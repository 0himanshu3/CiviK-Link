import Donation from '../models/donation.model.js';
import { User } from '../models/user.model.js';
import Issue from '../models/issue.model.js';
import axios from 'axios';

// Get total donations (all NGOs)
export const getTotalDonations = async (req, res) => {
  try {
    console.log('Fetching total donations');
    const result = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalDonations = result.length > 0 ? result[0].total : 0;
    console.log('Total donations:', totalDonations);
    res.json({ success: true, totalDonations });
  } catch (error) {
    console.error('Error fetching total donations:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch total donations', error: error.message });
  }
};

// Get all users (with optional city filter)
export const getAllUsers = async (req, res) => {
  try {
    console.log('Fetching all users');
    const { city } = req.query;
    const filter = { role: 'User' };
    if (city) filter.location = city;
    const users = await User.find(filter).select('-password');
    console.log(`Found ${users.length} users`);
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};

// Get all NGOs (with optional city filter)
export const getAllNGOs = async (req, res) => {
  try {
    console.log('Fetching all NGOs');
    const { city } = req.query;
    const filter = { role: 'NGO' };
    if (city) filter.location = city;
    const ngos = await User.find(filter).select('-password');
    console.log(`Found ${ngos.length} NGOs`);
    res.json({ success: true, ngos });
  } catch (error) {
    console.error('Error fetching NGOs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch NGOs', error: error.message });
  }
};

// Get completed issues with detailed information
export const getCompletedIssues = async (req, res) => {
  try {
    console.log('Fetching completed issues');
    const issues = await Issue.find({ status: 'Completed' })
      .populate('postedBy', 'name')
      .populate('assignedTo', 'name')
      .populate('volunteerPositions.registeredVolunteers', 'name')
      .select('title description issueLocation createdAt completedAt volunteerPositions assignedTo');

    const formattedIssues = issues.map(issue => ({
      _id: issue._id,
      title: issue.title,
      description: issue.description,
      location: issue.issueLocation,
      ngoName: issue.assignedTo?.name || 'Unassigned',
      totalPositions: issue.volunteerPositions.length,
      totalVolunteers: issue.volunteerPositions.reduce((acc, pos) => acc + pos.registeredVolunteers.length, 0),
      createdAt: issue.createdAt,
      completedAt: issue.completedAt
    }));

    console.log(`Found ${formattedIssues.length} completed issues`);
    res.json({ success: true, issues: formattedIssues });
  } catch (error) {
    console.error('Error fetching completed issues:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch completed issues', error: error.message });
  }
};

// Get detailed information for a specific issue
export const getIssueDetails = async (req, res) => {
  try {
    const { issueId } = req.params;
    console.log(`Fetching details for issue ${issueId}`);

    const issue = await Issue.findById(issueId)
      .populate({
        path: 'volunteerPositions.registeredVolunteers',
        select: 'name email'
      });

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    console.log('Issue postedBy:', issue.postedBy);
    
    const userwhoPosted = await User.findById(issue.postedBy).select('name email');
    console.log('Found user:', userwhoPosted);
    
    // Format the response with all necessary details
    const formattedIssue = {
      _id: issue._id,
      title: issue.title,
      tags: issue.tags,
      content: issue.content,
      images: issue.images.map(img => ({
        url: img.url,
        caption: img.caption || ''
      })),
      videos: issue.videos.map(vid => ({
        url: vid.url,
        caption: vid.caption || ''
      })),
      issueLocation: issue.issueLocation,
      assignedTo: issue.assignedTo, // This is a string, not an ObjectId
      postedBy: userwhoPosted ? {
        name: userwhoPosted.name,
        email: userwhoPosted.email
      } : {
        name: 'Unknown',
        email: 'Unknown'
      },
      upvotes: issue.upvoters?.length || 0,
      downvotes: issue.downvoters?.length || 0,
      volunteerPositions: issue.volunteerPositions.map(pos => ({
        position: pos.position,
        slots: pos.slots,
        registeredVolunteers: pos.registeredVolunteers.map(vol => ({
          name: vol.name,
          email: vol.email
        }))
      }))
    };

    console.log('Formatted issue:', formattedIssue);
    res.json({ success: true, issue: formattedIssue });
  } catch (error) {
    console.error('Error fetching issue details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch issue details', error: error.message });
  }
};

// Get feedback for a specific issue
export const getIssueFeedback = async (req, res) => {
  try {
    const { issueId } = req.params;
    console.log(`Fetching feedback for issue ${issueId}`);

    const issue = await Issue.findById(issueId)
      .populate('feedback.user', 'name')
      .select('feedback title');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const formattedFeedback = issue.feedback.map(fb => ({
      userName: fb.user.name,
      comment: fb.suggestions || fb.issueProblem,
      satisfaction: fb.satisfaction,
      resolved: fb.resolved,
      createdAt: fb.createdAt
    }));

    console.log(`Found ${formattedFeedback.length} feedback entries`);
    res.json({ success: true, feedback: formattedFeedback });
  } catch (error) {
    console.error('Error fetching issue feedback:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch issue feedback', error: error.message });
  }
};

// Generate AI report from feedback
export const generateFeedbackReport = async (req, res) => {
  try {
    const { issueId } = req.body;
    console.log(`Generating AI report for issue ${issueId}`);

    const issue = await Issue.findById(issueId)
      .populate('feedback.user', 'name')
      .select('feedback title');
    console.log(issue);
    
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    const feedbackText = issue.feedback.map(fb => 
      `\nSatisfaction: ${fb.satisfaction}/10\nResolved: ${fb.resolved}\nComment: ${fb.suggestions || fb.issueProblem}`
    ).join('\n\n');
    console.log(feedbackText);
    
    const reportGenerationPrompt = 
    `You are an expert at analyzing community feedback and generating comprehensive reports. 
    Analyze the following feedback and provide a JSON response with the following structure:
    {
      "overallRating": number, // average satisfaction rating
      "resolutionStatus": string, // "Highly Successful", "Successful", "Moderately Successful", or "Needs Improvement"
      "keyHighlights": string[], // array of positive themes
      "areasForImprovement": string[], // array of negative themes
      "actionableSuggestions": string[], // array of suggestions
      "finalVerdict": string // brief conclusion
    }
    Ensure the response is valid JSON and contains no markdown formatting or additional text.`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'deepseek/deepseek-chat-v3-0324:free',
      messages: [
        {
          role: 'system',
          content: reportGenerationPrompt
        },
        {
          role: 'user',
          content: `Please analyze the following feedback for the issue "${issue.title}" and generate a comprehensive report:\n\n${feedbackText}`
        }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const report = response.data.choices[0].message.content;
    
    console.log('====================================');
    console.log('Raw AI Response:', report);
    console.log('====================================');

    // Clean the response to ensure it's valid JSON
    const cleanReport = report.replace(/```json\n|\n```/g, '').trim();
    const reportJSON = JSON.parse(cleanReport);
    
    console.log('====================================');
    console.log('Parsed JSON:', reportJSON);
    console.log('====================================');

    res.json({ success: true, report: reportJSON });
  } catch (error) {
    console.error('Error generating feedback report:', error.message);
    res.status(500).json({ success: false, message: 'Failed to generate feedback report', error: error.message });
  }
}; 
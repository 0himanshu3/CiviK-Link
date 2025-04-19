import IssueRequest from '../models/request-issue.model.js'
import Issue from '../models/issue.model.js'
import { Notification } from '../models/notification.model.js'

export const requestIssue = async (req, res) => {
  const { issueId, description, ngoUsername, ngoUserid, timeline } = req.body;

  if (!issueId || !description || !timeline || !ngoUsername || !ngoUserid) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const issue = await Issue.findById(issueId).populate('postedBy'); 
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found.' });
    }
    if (issue.status !== 'Open') {
      return res.status(400).json({ error: 'Issue is not open for assignment.' });
    }

    console.log(issue);
    
    const issueRequest = await IssueRequest.create({
      issue: issueId,
      requestedBy: ngoUserid,
      description,
      timeline,
      status: 'Pending'
    });

    // Update the issue
    issue.assignedTo = ngoUsername;
    issue.status = 'Assigned';
    issue.deadline = timeline;
    await issue.save(); 

    await Notification.create({
      userId: issue.postedBy,
      message: `Your issue "${issue.title}" has been claimed by NGO "${ngoUsername}".`,
      type: "issue-claimed",
      eventSlug: issue.slug
    });

    return res.status(200).json({ success: true, message: 'Request submitted successfully.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};

export const getIssueRequestsByNGO = async (req, res) => {
  const ngoId = req.params.id;

  try {
    const issueRequests = await IssueRequest.find({ requestedBy: ngoId })
      .populate('issue', '_id'); // Only populate issue _id
    
    // Extract only the issue IDs
    const issueIds = issueRequests.map((request) => request.issue._id);

    res.status(200).json(issueIds); // Return only the issue IDs
  } catch (error) {
    console.error('Error fetching issue requests:', error);
    res.status(500).json({
      message: 'Server Error while fetching issue requests.',
    });
  }
};






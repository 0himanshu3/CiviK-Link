import Issue from '../models/issue.model.js';
import { Task } from '../models/task.model.js';
import { User } from '../models/user.model.js';
// import Job from '../models/job.model.js';
// import { Notification } from '../models/notification.model.js';
// import { notifyIssuePicked } from './notification.controller.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from "mongoose";

//Create a new issue
export const createIssue = async (req, res) => {
  try {
    const { title, tags, content, images, videos, issueLocation } = req.body;
    
    if (!title || !tags || !issueLocation) {
      return res.status(400).json({ message: "Missing required fields" });
    }
   
    const issue = await Issue.create({
      title,
      tags,
      content,
      images,
      videos,
      issueLocation,
      postedBy: req.user._id,
      upvoters: [req.user._id], // auto-upvote by reporter
    });
    console.log('====================================');
    console.log(req.user);
    console.log('====================================');
    return res.status(201).json(new ApiResponse(201, issue, "Issue created successfully"));
  } catch (error) {
    console.log('====================================');
    console.log(error.message);
    console.log('====================================');
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

//Assign NGO to issue and notify reporter/upvoters
export const assignNgoToIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const ngoId = req.user._id; // NGO is authenticated

    const ngoUser = await User.findById(ngoId);
    if (!ngoUser || ngoUser.role !== "NGO") {
      return res.status(403).json({ message: "Only NGOs can assign themselves to issues" });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    if (issue.status !== "Open") {
      return res.status(400).json({ message: "Issue is not open for assignment" });
    }

    issue.assignedTo = ngoId;
    issue.status = "Assigned";
    await issue.save();

    // Notify reporter and upvoters
    await notifyIssuePicked(issue._id, ngoId);

    return res.status(200).json(new ApiResponse(200, issue, "NGO assigned to issue successfully"));
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getIssueByUser = async (req, res) => {
  const userId = req.params.id;
  
  try {
    const issues = await Issue.find({ postedBy: userId });
    
    res.status(200).json({
      success: true,
      data: issues,
    });
  } catch (error) {
    console.error('Error fetching user issues:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
export const getIssuesVolunteered = async (req, res) => {
  const { id } = req.params;
  try {
    const volunteeredIssues = await Issue.find({
      "volunteerPositions.registeredVolunteers": id
    });
    res.status(200).json(volunteeredIssues);
  } catch (error) {
    console.error("Error fetching volunteered issues:", error);
    res.status(500).json({ message: "Failed to fetch volunteered issues" });
  }
};

export const getIssueThroughId = async (req, res) => {
  const userId = req.params.id;
  try {
    const issues = await Issue.find({ _id: userId });
    res.status(200).json({
      success: true,
      data: issues,
    });
  } catch (error) {
    console.error('Error fetching user issues:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
//Get all issues (with optional filters)
export const getAllIssues = async (req, res) => {
  try {
    // Optionally, you can paginate or sort
    const issues = await Issue
      .find()
      .sort({ createdAt: -1 })     // newest first
      .populate("postedBy", "name"); // include reporter name
    
    return res
      .status(200)
      .json(new ApiResponse(200,  issues , "Issues fetched successfully"));
  } catch (error) {
    console.error("Error in getAllIssues:", error.stack);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Server error", {
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      }));
  }
};

//Get a single issue by ID or slug
export const getIssue = async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const issue = await Issue.findOne({ $or: [{ _id: idOrSlug }, { slug: idOrSlug }] })
      .populate("postedBy assignedTo comments.user");
    if (!issue) return res.status(404).json({ message: "Issue not found" });
    return res.status(200).json(new ApiResponse(200, issue, "Issue fetched successfully"));
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findById(id)
      .populate("volunteerPositions.registeredVolunteers", "name email");

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found" });
    }

    const issueObj = issue.toObject();

    // For each volunteer position, attach tasks to each registered volunteer
    await Promise.all(
      issueObj.volunteerPositions.map(async (position) => {
        position.registeredVolunteers = await Promise.all(
          position.registeredVolunteers.map(async (volunteer) => {
            const volunteerId = new mongoose.Types.ObjectId(volunteer._id);
            const issueId = new mongoose.Types.ObjectId(issueObj._id);

            const tasks = await Task.find(
              { issue: issueId, assignedTo: volunteerId },
              "description status proofSubmitted proofMessage proofImages updates"
            ).exec();

            return { ...volunteer, tasks };
          })
        );
        return position;
      })
    );

    return res.status(200).json({ success: true, issue: issueObj });
  } catch (error) {
    console.error("Error fetching issue:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

//Update issue (by admin)
export const updateIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const updates = req.body;
    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to update this issue" });
    }

    Object.assign(issue, updates);
    await issue.save();
    return res.status(200).json(new ApiResponse(200, issue, "Issue updated successfully"));
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

//Delete issue (admin)
export const deleteIssue = async (req, res) => {
  try {
    const { issueId } = req.params;
    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: "Issue not found" });

    if (req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to delete this issue" });
    }

    await issue.remove();
    return res.status(200).json({ message: "Issue deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

//Upvote the issue:
export const upvoteIssue = async (req, res, next) => {
    try {
        const { issueId } = req.params;
        const userId = req.user._id;
        const issue = await Issue.findById(issueId);
        
        if (!issue) {
            return next(new ApiError(404, "Issue not found"));
        }

        if (!issue.upvoters)
            issue.upvoters = [];
        if (!issue.upvoters.includes(userId)) {
            issue.upvoters.push(userId);
            let upvoteCount = issue.upvoters.length;
            await issue.save();
            return res.status(200).json(new ApiResponse(200, issue, "Issue upvoted"));
        }
        else {
            return res.status(400).json({ message: "Already upvoted" });
        }
    }
    catch (error) {
        next(error);
    }
}

//downvote the issue: 
export const downvoteIssue = async (req, res, next) => {
    try {
      const { issueId } = req.params;
      const userId = req.user._id;
  
      const issue = await Issue.findById(issueId);
      if (!issue) return res.status(404).json({ message: "Issue not found" });
  
      // Prevent duplicate downvotes
      if (issue.downvoters.includes(userId)) {
        issue.downvoters = issue.downvoters.filter(id => id.toString() !== userId.toString());
      } else {
        issue.downvoters.push(userId);
  
        issue.upvoters = issue.upvoters.filter(id => id.toString() !== userId.toString());
      }
  
      // Auto-flag if threshold reached
        const limit = 2;
      if (issue.downvoters.length >= limit) {
        issue.isFlagged = true;
      }
  
      await issue.save();
      return res.status(200).json({ success: true, downvotes: issue.downvoters.length, isFlagged: issue.isFlagged });
    } catch (error) {
      next(error);
    }
  };
  
  export const getClaimedIssuesByUser = async (req, res) => {
    const { userId } = req.params;
     const user= await User.findById(userId);
    try {
      const claimedIssues = await Issue.find({ assignedTo: user.name }).sort({ timeline: 1 });
  
      res.status(200).json({
        success: true, 
        claimedIssues,
      });
    } catch (error) {
      console.error('Error fetching claimed issues:', error.message);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch claimed issues',
      });
    }
  };

  export const submitVolunteerRequest = async (req, res) => {
    const { issueId, volunteerPositions, ngoUsername, ngoUserid } = req.body;
  
    try {
      // Find the issue by ID
      const issue = await Issue.findById(issueId);
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
  
      // Validate volunteer positions
      const validationErrors = [];
      volunteerPositions.forEach((pos, index) => {
        if (!pos.position || pos.position.trim() === "") {
          validationErrors.push(`Position at index ${index} is required.`);
        }
        if (!pos.slots || isNaN(pos.slots) || pos.slots <= 0) {
          validationErrors.push(`Invalid slots at index ${index}. Slots should be a positive number.`);
        }
      });
  
      // If there are validation errors, send them back
      if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
      }
  
      // Add the volunteer positions to the issue document
      issue.volunteerPositions = [...issue.volunteerPositions, ...volunteerPositions];
  
      // Save the updated issue
      await issue.save();
  
      // Send a success response
      res.status(200).json({ message: "Volunteer positions added successfully!" });
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Something went wrong while processing your request." });
    }
};

export const registerVolunteer = async (req, res) => {
  const { position } = req.body;
  const issueId = req.params.id;
  const userId = req.user._id;

  try {
    const issue = await Issue.findById(issueId);
    const user= await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const selected = issue.volunteerPositions.find(p => p.position === position);
    if (!selected) return res.status(400).json({ message: 'Invalid position' });

    if (selected.registeredVolunteers.includes(userId)) {
      return res.status(409).json({ message: 'Already registered' });
    }

    if (selected.registeredVolunteers.length >= selected.slots) {
      return res.status(400).json({ message: 'No slots left' });
    }
    console.log("here");
    
    selected.registeredVolunteers.push(userId);
    user.Issues.push({
      issueId: issueId,
      tasks: [],
    });
    await issue.save();
    await user.save();

    res.status(200).json({ message: 'Registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

export const disclaimIssue = async (req, res) => {
  try {
    const { issueId } = req.body;

    if (!issueId) {
      return res.status(400).json({ success: false, message: 'Issue ID is required' });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    issue.status = 'Open';
    issue.assignedTo = null;
    issue.volunteerPositions = [];

    await issue.save();

    return res.status(200).json({
      success: true,
      message: 'Issue disclaimed successfully',
      updatedIssue: issue,
    });
  } catch (error) {
    console.error('Error disclaiming issue:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
export const markIssueAsCompleted = async (req, res) => {
  try {
    const { issueId } = req.body;

    if (!issueId) {
      return res.status(400).json({ success: false, message: 'Issue ID is required' });
    }

    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue not found' });
    }

    issue.status = 'Completed';
    issue.volunteerPositions = [];
    await issue.save();

    return res.status(200).json({
      success: true,
      message: 'Issue marked as completed',
      updatedIssue: issue,
    });
  } catch (error) {
    console.error('Error marking issue as completed:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const submitFeedback = async (req, res) => {
  try {
    const { issueId } = req.params;
    const userId = req.user._id; // assuming auth middleware sets req.user
    const { resolved, satisfaction, suggestions, issueProblem } = req.body;

    if (!["Yes", "No"].includes(resolved)) {
      return res.status(400).json({ message: "Resolved must be 'Yes' or 'No'." });
    }

    const issue = await Issue.findById(issueId);

    if (!issue) {
      return res.status(404).json({ message: "Issue not found." });
    }

    if (issue.status !== "Completed") {
      return res.status(400).json({ message: "Feedback can only be submitted for completed issues." });
    }

    const alreadySubmitted = issue.feedback.some((fb) =>
      fb.user.toString() === userId.toString()
    );

    if (alreadySubmitted) {
      return res.status(400).json({ message: "You have already submitted feedback for this issue." });
    }

    const newFeedback = {
      user: userId,
      resolved,
      satisfaction,
      suggestions,
      issueProblem,
    };

    issue.feedback.push(newFeedback);
    await issue.save();

    res.status(200).json({ message: "Feedback submitted successfully." });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


export const assignTask = async (req, res) => {
  const { issueId, volunteerId, task } = req.body;

  try {
    // Ensure the referenced issue and volunteer exist
    const issue = await Issue.findById(issueId);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const volunteer = await User.findById(volunteerId);
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });
    
    // Create a new task
    const newTask = await Task.create({
      issue: issueId,
      assignedTo: volunteerId,
      description: task,
    });
     volunteer.Issues.forEach((issue) => {
      if (issue.issueId.toString() === issueId) {
        issue.tasks.push(newTask._id);
      }
    }
  );
  await volunteer.save();
    res.status(201).json({
      message: 'Task assigned successfully',
      task: newTask,
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const { issueId } = req.params;

    if (!mongoose.isValidObjectId(issueId)) {
      return res.status(400).json({ success: false, message: 'Invalid issue ID' });
    }

    const tasks = await Task.find({
      issue: issueId,
      assignedTo: userId
    })
      .select('description status proofSubmitted')
      .lean();

    res.json({ success: true, tasks });
  } catch (err) {
    console.error('getMyTasks error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const sendTaskUpdate = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;
    const { title, content } = req.body;

    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'Title and content required' });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    if (task.assignedTo.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not your task' });
    }

    task.updates.push({ title, content });
    await task.save();

    res.json({ success: true, message: 'Update sent' });
  } catch (err) {
    console.error('sendTaskUpdate error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const submitTaskProof = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user._id;
    const { message, images } = req.body;

    // validate
    if (!mongoose.isValidObjectId(taskId)) {
      return res.status(400).json({ success: false, message: 'Invalid task ID' });
    }

    // find task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // only assigned user may submit proof
    if (task.assignedTo.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // update proof fields

    task.status= 'proof submitted'
    task.proofSubmitted = true;
    task.proofMessage = message || '';
    task.proofImages = Array.isArray(images) ? images : [];
    await task.save();

    return res.json({ success: true, message: 'Proof submitted' });
  } catch (err) {
    console.error('submitTaskProof error:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const approveTaskProof = async (req, res) => {
  try {
    const { taskId } = req.body;

    // Find the task by ID
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Approve the proof: mark task as completed
    task.status = 'completed';
    // Optionally, you could leave the proof fields intact or clear them
    // For example: task.proofSubmitted = true; (it should already be true)
    await task.save();

    return res.status(200).json({
      success: true,
      message: "Proof approved. Task marked as completed.",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const rejectTaskProof = async (req, res) => {
  try {
    console.log("here");
    
    const { taskId } = req.body;

    // Find the task by ID
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Reject the proof: reset proofSubmitted to false,
    // clear the proofImages and proofMessage,
    // and keep the task status as 'pending'
    task.proofSubmitted = false;
    task.proofImages = [];
    task.proofMessage = "";
    task.status = 'pending'; // Ensuring the task remains pending
    await task.save();

    return res.status(200).json({
      success: true,
      message: "Proof rejected. Task remains pending. Proof has been cleared.",
      data: task,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getCollaboratedIssues = async (req, res) => {
  try {
    const { ngoId } = req.params;

    // Find all issues where the NGO is listed as a collaborator
    const collaboratedIssues = await Issue.find({
      'collaborators.id': ngoId
    }).sort({ createdAt: -1 });
   
    res.status(200).json({
      success: true,
      collaboratedIssues
    });
  } catch (error) {
    console.error('Error in getCollaboratedIssues:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching collaborated issues',
      error: error.message
    });
  }
};


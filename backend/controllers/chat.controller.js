import Chat from '../models/chat.model.js';
import Issue from '../models/issue.model.js';
import { User } from '../models/user.model.js';
import { getMessagesWithPagination } from '../utils/chatUtils.js';

// Get chat messages for an issue
export const getChatMessages = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { page = 1, limit = 50, includeArchived = false } = req.query;
    
    // Check if issue exists
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Get messages with pagination
    const result = await getMessagesWithPagination(issueId, parseInt(page), parseInt(limit), includeArchived === 'true');
    
    return res.status(200).json({
      success: true,
      data: result.messages,
      pagination: {
        total: result.total,
        pages: result.pages,
        currentPage: result.currentPage
      }
    });
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get chat messages',
      error: error.message
    });
  }
};

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { issueId } = req.params;
    const { message } = req.body;
    const sender = req.user._id;
    
    // Check if issue exists
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Create new message
    const newMessage = await Chat.create({
      issueId,
      sender,
      message
    });
    
    // Populate sender information
    const populatedMessage = await Chat.findById(newMessage._id)
      .populate('sender', 'name');
    
    return res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Get participants for a chat
export const getChatParticipants = async (req, res) => {
  try {
    const { issueId } = req.params;
    
    // Check if issue exists
    const issue = await Issue.findById(issueId);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Get participants from the issue
    const participants = [];
    
    // Add the assigned NGO if exists
    if (issue.assignedTo) {
      // Since assignedTo is stored as a string (name), we need to find the NGO by name
      const assignedNgo = await User.findOne({ name: issue.assignedTo, role: 'NGO' });
      if (assignedNgo) {
        participants.push({
          id: assignedNgo._id,
          name: assignedNgo.name,
          role: 'Assigned NGO'
        });
      }
    }
    
    // Add collaborators
    if (issue.collaborators && issue.collaborators.length > 0) {
      for (const collaborator of issue.collaborators) {
        if (collaborator.id) {
          const user = await User.findById(collaborator.id);
          if (user) {
            participants.push({
              id: user._id,
              name: user.name,
              role: 'Collaborator'
            });
          }
        }
      }
    }
    
    return res.status(200).json({
      success: true,
      data: participants
    });
  } catch (error) {
    console.error('Error getting chat participants:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get chat participants',
      error: error.message
    });
  }
}; 
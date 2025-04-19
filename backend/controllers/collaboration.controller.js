import Collaboration from '../models/collaboration.model.js';
import Issue from '../models/issue.model.js';
import { User } from '../models/user.model.js';
import { createError } from "../utils/createError.js";

// Send collaboration request
export const sendCollaborationRequest = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('User from auth:', req.user);
        
        const { issueId, ngoId, message } = req.body;
        const requestedBy = req.user._id;

        // Validate required fields
        if (!issueId || !ngoId || !message) {
            console.log('Missing required fields:', { issueId, ngoId, message });
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if issue exists
        const issue = await Issue.findById(issueId);
        if (!issue) {
            console.log('Issue not found:', issueId);
            return res.status(404).json({
                success: false,
                message: 'Issue not found'
            });
        }

        // Check if NGO exists
        const ngo = await User.findById(ngoId);
        if (!ngo || ngo.role !== 'NGO') {
            console.log('NGO not found or invalid role:', ngoId);
            return res.status(404).json({
                success: false,
                message: 'NGO not found'
            });
        }

        // Create collaboration request
        const collaboration = await Collaboration.create({
            issueId,
            requestedBy,
            requestedTo: ngoId,
            message
        });

        console.log('Collaboration request created:', collaboration);
        return res.status(201).json({
            success: true,
            data: collaboration
        });
    } catch (error) {
        console.error('Detailed error in sendCollaborationRequest:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send collaboration request',
            error: error.message
        });
    }
};

// Get collaboration requests for an NGO
export const getCollaborationRequests = async (req, res) => {
    try {
        const userId = req.user._id;

        const requests = await Collaboration.find({ requestedTo: userId })
            .populate('issueId', 'title description')
            .populate('requestedBy', 'name email')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Error in getCollaborationRequests:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch collaboration requests'
        });
    }
};

// Respond to collaboration request
export const respondToRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;
        const userId = req.user._id;

        console.log('Responding to request:', { requestId, status, userId });

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Find the collaboration request
        const request = await Collaboration.findOne({
            _id: requestId,
            requestedTo: userId
        }).populate('issueId');

        console.log('Found request:', request);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Request not found'
            });
        }

        // If request is accepted, first update the issue with the collaborator
        if (status === 'accepted') {
            try {
                const issue = await Issue.findById(request.issueId);
                console.log('Found issue:', issue);

                if (issue) {
                    // Get the user data for the collaborator
                    const collaborator = await User.findById(request.requestedTo);
                    console.log('Found collaborator:', collaborator);

                    if (!collaborator) {
                        throw new Error('Collaborator user not found');
                    }

                    // Initialize or clean up collaborators array
                    if (!issue.collaborators || !Array.isArray(issue.collaborators)) {
                        issue.collaborators = [];
                    }

                    // Filter out any invalid collaborators (those without id or name)
                    issue.collaborators = issue.collaborators.filter(collab => 
                        collab && collab.id && collab.name
                    );

                    // Check if collaborator already exists
                    const collaboratorExists = issue.collaborators.some(
                        collab => collab.id && collab.id.toString() === request.requestedTo.toString()
                    );

                    if (!collaboratorExists) {
                        // Add the new collaborator with proper structure
                        issue.collaborators.push({
                            id: request.requestedTo,
                            name: collaborator.name
                        });
                        
                        // Save the issue with the new collaborator
                        const savedIssue = await issue.save();
                        console.log('Updated issue with collaborator:', savedIssue._id);
                        console.log('Current collaborators:', savedIssue.collaborators);
                    }
                }
            } catch (error) {
                console.error('Error updating issue with collaborator:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update issue with collaborator',
                    error: error.message
                });
            }
        }

        // Only update request status after successful collaborator addition (if accepted)
        request.status = status;
        await request.save();
        console.log('Updated request status:', request.status);

        // Populate the response data
        const populatedRequest = await Collaboration.findById(request._id)
            .populate('issueId', 'title description collaborators')
            .populate('requestedBy', 'name email')
            .populate('requestedTo', 'name email');

        return res.status(200).json({
            success: true,
            data: populatedRequest
        });
    } catch (error) {
        console.error('Detailed error in respondToRequest:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to respond to request',
            error: error.message
        });
    }
}; 
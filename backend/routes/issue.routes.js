import express from 'express';
import { 
  createIssue, 
  getAllIssues, 
  getIssue, 
  getIssueById,
  getIssueByUser,
  getIssuesVolunteered,
  getIssueThroughId,
  getClaimedIssuesByUser,
  getCollaboratedIssues,
  // ... other imports
} from '../controllers/issue.controller.js';

const router = express.Router();

// ... existing routes ...

// Get collaborated issues for an NGO
router.get('/collaborated/:ngoId', getCollaboratedIssues);

export default router; 
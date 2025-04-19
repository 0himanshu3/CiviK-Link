import express from 'express';
import { isAuthenticated, isAdmin } from '../middlewares/auth.middleware.js';
import { 
  getTotalDonations, 
  getAllUsers, 
  getAllNGOs,
  getCompletedIssues,
  getIssueDetails,
  getIssueFeedback,
  generateFeedbackReport
} from '../controllers/admin.controller.js';

const router = express.Router();

router.use(isAuthenticated, isAdmin);

router.get('/total-donations', getTotalDonations);
router.get('/users', getAllUsers);
router.get('/ngos', getAllNGOs);
router.get('/completed-issues', getCompletedIssues);
router.get('/issue-details/:issueId', getIssueDetails);
router.get('/issue-feedback/:issueId', getIssueFeedback);
router.post('/generate-feedback-report', generateFeedbackReport);

export default router; 
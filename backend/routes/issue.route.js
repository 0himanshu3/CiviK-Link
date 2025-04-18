import express from "express";
import {
  createIssue,
  getAllIssues,
  getClaimedIssuesByUser,
  getIssueById,
  getIssueByUser,
  submitVolunteerRequest,
  registerVolunteer,
  upvoteIssue,
  downvoteIssue,
  disclaimIssue,
  markIssueAsCompleted,
  submitFeedback,
  getIssueThroughId,
  getIssuesVolunteered,
  assignTask,
  getMyTasks,
  sendTaskUpdate,
  submitTaskProof,
  approveTaskProof,
  rejectTaskProof,
} from "../controllers/issue.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/create",isAuthenticated, createIssue);
router.get("/getAll", getAllIssues);
router.get("/users/:id",getIssueByUser);
router.get("/getIssue/:id",getIssueThroughId);
router.get("/requested/:id",getIssuesVolunteered);
router.post("/upvote/:issueId", isAuthenticated, upvoteIssue);
router.post("/downvote/:issueId", isAuthenticated, downvoteIssue);
router.get('/:id', getIssueById);
router.post('/submitVolunteerRequest',submitVolunteerRequest)
router.get('/claimed/:userId', getClaimedIssuesByUser); 
router.post('/:id/registerVolunteer', isAuthenticated, registerVolunteer)
router.post('/assignTask',assignTask)
router.post('/disclaim', disclaimIssue);
router.post('/complete', markIssueAsCompleted);
router.post("/:issueId/feedback", isAuthenticated, submitFeedback);


router.get(
    '/:issueId/my-tasks',
    isAuthenticated,
    getMyTasks
  );

  router.post(
    '/tasks/:taskId/updates',
    isAuthenticated,
    sendTaskUpdate
  );

  router.post(
    '/tasks/:taskId/proof',
    isAuthenticated,
    submitTaskProof
  );

  router.post('/acceptTaskProof',approveTaskProof);
  router.post('/rejectTaskProof',rejectTaskProof);
export default router;
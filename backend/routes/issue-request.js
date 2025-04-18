import express from "express";
import {
    requestIssue,
    getIssueRequestsByNGO,
} from "../controllers/issue-request.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/requesting", requestIssue);
router.get("/:id", getIssueRequestsByNGO);

export default router;

import express from 'express';
import { isAuthenticated, isAdmin } from '../middlewares/auth.middleware.js';
import { getTotalDonations, getAllUsers, getAllNGOs } from '../controllers/admin.controller.js';

const router = express.Router();

router.use(isAuthenticated, isAdmin);

router.get('/total-donations', getTotalDonations);
router.get('/users', getAllUsers);
router.get('/ngos', getAllNGOs);

export default router; 
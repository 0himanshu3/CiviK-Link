import cookieParser from "cookie-parser";
import express from "express";
import { config } from "dotenv";
import cors from "cors"
import { connectDB } from "./db/db.js";
import userRoutes from './routes/user.route.js'
import issueRouter from './routes/issue.route.js'
import issuerequestRouter from './routes/issue-request.js'
import donationRoutes from './routes/donation.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import adminRoutes from './routes/admin.routes.js'
import collaborationRoutes from './routes/collaboration.routes.js'
import eventRoutes from './routes/event.route.js'

export const app = express();

config({path:"./config/config.env"});

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Add this after creating the app but before any routes
app.use((req, res, next) => {
  console.log('Incoming request:', req.method, req.url);
  next();
});

// Mount routes
app.use("/api/v1/issue-request", issuerequestRouter);
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/issues", issueRouter);
app.use("/api/v1/donations", donationRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/collaboration', collaborationRoutes);
app.use("/api/v1/events", eventRoutes);

connectDB();
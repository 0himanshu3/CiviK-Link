import cookieParser from "cookie-parser";
import express from "express";
import { config } from "dotenv";
import cors from "cors"
import { connectDB } from "./db/db.js";
import userRoutes from './routes/user.route.js'
import issueRouter from './routes/issue.route.js'
import issuerequestRouter from './routes/issue-request.js'
import donationRoutes from './routes/donation.routes.js'

export const app = express();

config({path:"./config/config.env"});

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Mount routes
app.use("/api/v1/issue-request", issuerequestRouter);
app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/issues", issueRouter);
app.use("/api/v1/donations", donationRoutes);

connectDB();
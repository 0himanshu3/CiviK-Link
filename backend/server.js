import cookieParser from "cookie-parser";
import { app } from "./app.js";
import { config } from "dotenv";
config();

// Import routes
import donationRoutes from './routes/donation.routes.js';
import userRoutes from './routes/user.route.js';
import collaborationRoutes from './routes/collaboration.route.js';

//middleware for error handling
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
import cookieParser from "cookie-parser";
import { app } from "./app.js";
import { config } from "dotenv";
import { createServer } from 'http';
import { initializeSocket } from './socket.js';
config();

// Import routes
import donationRoutes from './routes/donation.routes.js';
import userRoutes from './routes/user.route.js';
import collaborationRoutes from './routes/collaboration.route.js';
import chatRoutes from './routes/chat.routes.js';

// Use routes
app.use('/api/v1/donation', donationRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/collaboration', collaborationRoutes);
app.use('/api/v1/chat', chatRoutes);

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
const httpServer = createServer(app);

// Initialize Socket.IO
const io = initializeSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
import { Server } from 'socket.io';

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:5173", 
      credentials: true
    }
  });

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a chat room for a specific issue
    socket.on('join-chat', (issueId) => {
      socket.join(issueId);
      console.log(`User ${socket.id} joined chat for issue ${issueId}`);
    });

    // Handle sending messages
    socket.on('send-message', (data) => {
      io.to(data.issueId).emit('receive-message', data);
      console.log(`Message sent in issue ${data.issueId}:`, data.message);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}; 
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const connectedUsers = new Map();

export const handleSocketConnection = (socket, io) => {
  console.log('User connected:', socket.id);

  // Authenticate socket connection
  socket.on('authenticate', async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        socket.userId = user._id.toString();
        socket.user = user;
        
        // Join user-specific room
        socket.join(`user_${user._id}`);
        
        // Store connected user
        connectedUsers.set(user._id.toString(), {
          socketId: socket.id,
          user: user,
          lastSeen: new Date()
        });

        // Emit online status
        socket.broadcast.emit('userOnline', {
          userId: user._id,
          name: user.name
        });

        // Send current online users
        const onlineUsers = Array.from(connectedUsers.keys());
        socket.emit('onlineUsers', onlineUsers);

        console.log(`User authenticated: ${user.name} (${user._id})`);
      } else {
        socket.emit('authError', 'Invalid user or account deactivated');
      }
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.emit('authError', 'Authentication failed');
    }
  });

  // Join conversation room
  socket.on('joinConversation', (conversationId) => {
    if (socket.userId) {
      socket.join(`conversation_${conversationId}`);
      console.log(`User ${socket.userId} joined conversation ${conversationId}`);
    }
  });

  // Leave conversation room
  socket.on('leaveConversation', (conversationId) => {
    if (socket.userId) {
      socket.leave(`conversation_${conversationId}`);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    if (socket.userId) {
      socket.to(`conversation_${data.conversationId}`).emit('userTyping', {
        userId: socket.userId,
        isTyping: true
      });
    }
  });

  socket.on('stopTyping', (data) => {
    if (socket.userId) {
      socket.to(`conversation_${data.conversationId}`).emit('userTyping', {
        userId: socket.userId,
        isTyping: false
      });
    }
  });

  // Handle message read receipts
  socket.on('messageRead', (data) => {
    if (socket.userId) {
      socket.to(`conversation_${data.conversationId}`).emit('messageRead', {
        messageId: data.messageId,
        readBy: socket.userId,
        readAt: new Date()
      });
    }
  });

  // Handle job application notifications
  socket.on('jobApplicationUpdate', (data) => {
    if (socket.userId) {
      // Notify the candidate about application status update
      io.to(`user_${data.candidateId}`).emit('applicationUpdate', {
        applicationId: data.applicationId,
        status: data.status,
        message: data.message,
        job: data.job
      });
    }
  });

  // Handle new job notifications
  socket.on('newJobPosted', (data) => {
    if (socket.userId && socket.user.role === 'recruiter') {
      // Notify relevant students about new job
      // This could be based on skills matching, location, etc.
      socket.broadcast.emit('newJobAvailable', {
        job: data.job,
        message: `New ${data.job.title} position available at ${data.job.company.name}`
      });
    }
  });

  // Handle interview scheduling
  socket.on('interviewScheduled', (data) => {
    if (socket.userId) {
      io.to(`user_${data.candidateId}`).emit('interviewScheduled', {
        applicationId: data.applicationId,
        interview: data.interview,
        message: `Interview scheduled for ${data.job.title}`,
        job: data.job
      });
    }
  });

  // Handle general notifications
  socket.on('sendNotification', (data) => {
    if (socket.userId) {
      io.to(`user_${data.userId}`).emit('notification', {
        type: data.type,
        title: data.title,
        message: data.message,
        data: data.data,
        timestamp: new Date()
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (socket.userId) {
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // Emit offline status
      socket.broadcast.emit('userOffline', {
        userId: socket.userId
      });
      
      console.log(`User ${socket.userId} went offline`);
    }
  });

  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  // Heartbeat to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong');
    
    if (socket.userId) {
      const connectedUser = connectedUsers.get(socket.userId);
      if (connectedUser) {
        connectedUser.lastSeen = new Date();
      }
    }
  });
};

// Helper function to get online users
export const getOnlineUsers = () => {
  return Array.from(connectedUsers.keys());
};

// Helper function to check if user is online
export const isUserOnline = (userId) => {
  return connectedUsers.has(userId.toString());
};

// Helper function to send notification to specific user
export const sendNotificationToUser = (io, userId, notification) => {
  io.to(`user_${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date()
  });
};

// Helper function to broadcast to all users
export const broadcastToAll = (io, event, data) => {
  io.emit(event, {
    ...data,
    timestamp: new Date()
  });
};

// Clean up inactive connections periodically
setInterval(() => {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  for (const [userId, userData] of connectedUsers.entries()) {
    if (userData.lastSeen < fiveMinutesAgo) {
      connectedUsers.delete(userId);
      console.log(`Cleaned up inactive connection for user ${userId}`);
    }
  }
}, 60000); // Run every minute
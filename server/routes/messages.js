import express from 'express';
import { body, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import User from '../models/User.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Send a message
router.post('/', authenticateToken, [
  body('receiverId').isMongoId().withMessage('Valid receiver ID required'),
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Message content required (max 1000 characters)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { receiverId, content } = req.body;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    // Find or create conversation
    const conversation = await Conversation.findOrCreate(req.user._id, receiverId);

    // Create message
    const message = new Message({
      conversation: conversation._id,
      sender: req.user._id,
      receiver: receiverId,
      content
    });

    await message.save();

    // Update conversation
    await conversation.updateLastActivity(message._id);
    await conversation.incrementUnread(receiverId);

    // Populate message for response
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profile.profilePicture')
      .populate('receiver', 'name profile.profilePicture');

    // Emit socket event for real-time messaging
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${receiverId}`).emit('newMessage', populatedMessage);
    }

    res.status(201).json({
      message: 'Message sent successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error while sending message' });
  }
});

// Get user's conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id
    })
    .populate('participants', 'name role profile.profilePicture company')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      const participant = conv.participants.find(p => p._id.toString() !== req.user._id.toString());
      const unreadCount = conv.unreadCount?.get(req.user._id.toString()) || 0;
      
      return {
        conversationId: conv._id,
        participant,
        lastMessage: conv.lastMessage,
        unreadCount,
        lastActivity: conv.lastActivity
      };
    });

    res.json(formattedConversations);

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error while fetching conversations' });
  }
});

// Get messages in a conversation
router.get('/conversation/:participantId', authenticateToken, async (req, res) => {
  try {
    const { participantId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Find conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId], $size: 2 }
    });

    if (!conversation) {
      return res.json({ messages: [], pagination: { current: 1, pages: 0, total: 0 } });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get messages
    const messages = await Message.find({
      conversation: conversation._id,
      deleted: { $ne: true }
    })
    .populate('sender', 'name profile.profilePicture')
    .populate('receiver', 'name profile.profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Message.countDocuments({
      conversation: conversation._id,
      deleted: { $ne: true }
    });

    // Mark messages as read
    await Message.updateMany(
      {
        conversation: conversation._id,
        receiver: req.user._id,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    // Reset unread count for this user
    await conversation.resetUnread(req.user._id);

    const pagination = {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
      hasNext: skip + parseInt(limit) < total,
      hasPrev: parseInt(page) > 1
    };

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination
    });

  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({ message: 'Server error while fetching messages' });
  }
});

// Mark conversation as read
router.put('/conversation/:participantId/read', authenticateToken, async (req, res) => {
  try {
    const { participantId } = req.params;

    // Find conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, participantId], $size: 2 }
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Mark all messages as read
    await Message.updateMany(
      {
        conversation: conversation._id,
        receiver: req.user._id,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    // Reset unread count
    await conversation.resetUnread(req.user._id);

    res.json({ message: 'Messages marked as read' });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error while marking messages as read' });
  }
});

// Edit message
router.put('/:id', authenticateToken, [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Message content required (max 1000 characters)')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const message = await Message.findOne({
      _id: req.params.id,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    // Check if message is too old to edit (e.g., 15 minutes)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    if (message.createdAt < fifteenMinutesAgo) {
      return res.status(400).json({ message: 'Message too old to edit' });
    }

    await message.editMessage(req.body.content);

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profile.profilePicture')
      .populate('receiver', 'name profile.profilePicture');

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${message.receiver}`).emit('messageEdited', populatedMessage);
    }

    res.json({
      message: 'Message edited successfully',
      data: populatedMessage
    });

  } catch (error) {
    console.error('Edit message error:', error);
    res.status(500).json({ message: 'Server error while editing message' });
  }
});

// Delete message
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.id,
      sender: req.user._id
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or unauthorized' });
    }

    await message.deleteMessage();

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${message.receiver}`).emit('messageDeleted', { messageId: message._id });
    }

    res.json({ message: 'Message deleted successfully' });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error while deleting message' });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      read: false,
      deleted: { $ne: true }
    });

    res.json({ count });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error while fetching unread count' });
  }
});

export default router;
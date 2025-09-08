import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  archived: {
    type: Map,
    of: Boolean,
    default: {}
  }
}, {
  timestamps: true
});

// Ensure only 2 participants per conversation
conversationSchema.index({ participants: 1 }, { unique: true });
conversationSchema.index({ lastActivity: -1 });

// Method to update last activity
conversationSchema.methods.updateLastActivity = function(messageId) {
  this.lastMessage = messageId;
  this.lastActivity = new Date();
  return this.save();
};

// Method to increment unread count
conversationSchema.methods.incrementUnread = function(userId) {
  const unreadCount = this.unreadCount || new Map();
  const currentCount = unreadCount.get(userId.toString()) || 0;
  unreadCount.set(userId.toString(), currentCount + 1);
  this.unreadCount = unreadCount;
  return this.save();
};

// Method to reset unread count
conversationSchema.methods.resetUnread = function(userId) {
  const unreadCount = this.unreadCount || new Map();
  unreadCount.set(userId.toString(), 0);
  this.unreadCount = unreadCount;
  return this.save();
};

// Static method to find or create conversation
conversationSchema.statics.findOrCreate = async function(participant1, participant2) {
  const participants = [participant1, participant2].sort();
  
  let conversation = await this.findOne({
    participants: { $all: participants, $size: 2 }
  });
  
  if (!conversation) {
    conversation = new this({ participants });
    await conversation.save();
  }
  
  return conversation;
};

export default mongoose.model('Conversation', conversationSchema);
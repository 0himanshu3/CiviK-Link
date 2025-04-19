import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  archived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  }
}, { timestamps: true });

// Index for faster queries
ChatSchema.index({ issueId: 1, timestamp: -1 });
ChatSchema.index({ archived: 1, timestamp: -1 });

const Chat = mongoose.model('Chat', ChatSchema);

export default Chat; 
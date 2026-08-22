const mongoose = require('mongoose');

// ------------------------------------------------------------
// MESSAGE
// A single message within a conversation. Sender is always
// derived from req.user.id on the server — never from the body.
// ------------------------------------------------------------
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Denormalized sender snapshot for display.
    senderName: {
      type: String,
      default: '',
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
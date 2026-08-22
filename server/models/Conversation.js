const mongoose = require('mongoose');

// ------------------------------------------------------------
// CONVERSATION
// A private thread between two REITA users. Optionally linked to
// a marketplace listing/property so the context is preserved.
// ------------------------------------------------------------
const conversationSchema = new mongoose.Schema(
  {
    // Exactly two participants.
    participants: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      required: true,
      validate: {
        validator: (value) => value.length === 2,
        message: 'A conversation must have exactly two participants.',
      },
    },

    // Optional related property/listing.
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
    },
    propertyName: {
      type: String,
      default: '',
    },

    // Denormalized last message for list previews.
    lastMessage: {
      type: String,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    lastSenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Per-participant read state: { [userId]: Date }
    readBy: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Ensure a unique conversation between the same two participants
// (regardless of order) so we don't create duplicate threads.
conversationSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
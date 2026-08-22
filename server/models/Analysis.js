const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      default: null,
    },

    propertyName: {
      type: String,
      default: '',
    },

    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    recommendation: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Analysis', analysisSchema);
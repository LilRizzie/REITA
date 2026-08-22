const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
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
    propertyType: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      default: '',
    },
    analysisDate: {
      type: String,
      default: '',
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    recommendation: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    userName: {
      type: String,
      default: '',
    },
    generatedBy: {
      type: String,
      default: '',
    },
    generatedByEmail: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Report', reportSchema);
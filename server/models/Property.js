const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    agent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Denormalized owner snapshot for admin views. Set from the authenticated
    // User document at creation time — never trusted from the request body.
    ownerEmail: {
      type: String,
      default: '',
    },
    ownerName: {
      type: String,
      default: '',
    },
    propertyName: {
      type: String,
      required: true,
      trim: true,
    },
    propertyType: {
      type: String,
      enum: ['Residential', 'Commercial', 'Industrial', 'Land', 'Mixed Use'],
      default: 'Residential',
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    state: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    purchasePrice: {
      type: Number,
      default: 0,
    },
    purchaseDate: {
      type: String,
      default: '',
    },
    currentValue: {
      type: Number,
      default: 0,
    },
    // Financial fields. The frontend uses several aliases inconsistently;
    // preserve all of them for forward/backward compatibility.
    annualRent: {
      type: Number,
      default: 0,
    },
    annualRentalIncome: {
      type: Number,
      default: 0,
    },
    expectedRentalIncome: {
      type: Number,
      default: 0,
    },
    monthlyRent: {
      type: Number,
      default: 0,
    },
    annualExpenses: {
      type: Number,
      default: 0,
    },
    mortgage: {
      type: Number,
      default: 0,
    },
    loanAmount: {
      type: Number,
      default: 0,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    loanYears: {
      type: Number,
      default: 0,
    },
    expectedAppreciation: {
      type: Number,
      default: 0,
    },
    availableShares: {
      type: Number,
      min: 0,
      default: 0,
    },
    pricePerShare: {
      type: Number,
      min: 0,
      default: 0,
    },
    minimumInvestment: {
      type: Number,
      min: 0,
      default: 0,
    },
    appreciationRate: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      default: 'Under review',
    },
    propertyStatus: {
      type: String,
      enum: ['Available', 'Fully funded', 'Under review', 'Sold/closed'],
      default: 'Under review',
    },
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    favorite: {
      type: Boolean,
      default: false,
    },

    // ------------------------------------------------------------
    // MARKETPLACE LISTING FIELDS
    // A user-owned property can optionally be published to the
    // marketplace so other REITA users can discover and contact
    // the owner. Ownership is always derived from req.user.id.
    // ------------------------------------------------------------
    listingStatus: {
      type: String,
      enum: ['published', 'unpublished', 'sold', 'pending'],
      default: 'unpublished',
      index: true,
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    askingPrice: {
      type: Number,
      default: 0,
    },
    bedrooms: {
      type: Number,
      default: 0,
    },
    bathrooms: {
      type: Number,
      default: 0,
    },
    area: {
      type: Number,
      default: 0,
    },
    images: {
      type: [String],
      default: [],
    },
    listingNotes: {
      type: String,
      default: '',
    },
    // Denormalized owner role snapshot for marketplace display.
    ownerRole: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for marketplace search/filtering.
propertySchema.index({ listingStatus: 1, propertyType: 1, state: 1, city: 1, askingPrice: 1 });

module.exports = mongoose.model('Property', propertySchema);
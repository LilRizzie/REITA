const mongoose = require('mongoose');

// ------------------------------------------------------------
// REFERENCE / MARKET PROPERTY
// External market properties used for comparison and analysis.
// These are NOT owned by REITA users. They can be imported from
// an external provider later without coupling the app to it.
// ------------------------------------------------------------
const referencePropertySchema = new mongoose.Schema(
  {
    // Unique identifier from the external source (if any).
    externalId: {
      type: String,
      default: '',
      index: true,
    },
    // Source label, e.g. 'manual', 'admin', or a future provider name.
    source: {
      type: String,
      default: 'manual',
      index: true,
    },
    propertyName: {
      type: String,
      default: '',
    },
    propertyType: {
      type: String,
      default: 'Residential',
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
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    price: {
      type: Number,
      default: 0,
    },
    rent: {
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
    description: {
      type: String,
      default: '',
    },
    image: {
      type: String,
      default: '',
    },
    listingUrl: {
      type: String,
      default: '',
    },
    // When this record was fetched/imported from the source.
    fetchedAt: {
      type: Date,
      default: null,
    },
    // Flexible metadata from the provider.
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate records when the same external property is imported
// repeatedly. externalId + source uniquely identify an external record.
referencePropertySchema.index({ externalId: 1, source: 1 }, { unique: true, sparse: true });

// Index for search/filtering.
referencePropertySchema.index({ propertyType: 1, state: 1, city: 1, price: 1, rent: 1 });

module.exports = mongoose.model('ReferenceProperty', referencePropertySchema);
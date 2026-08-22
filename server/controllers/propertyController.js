const Property = require('../models/Property');
const User = require('../models/User');

const PROPERTY_TYPES = ['Residential', 'Commercial', 'Industrial', 'Land', 'Mixed Use'];
const PROPERTY_STATUSES = ['Available', 'Fully funded', 'Under review', 'Sold/closed'];

const normalizeProperty = (property) => {
  const doc = property.toObject ? property.toObject() : property;
  const createdAt = doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now();
  const updatedAt = doc.updatedAt ? new Date(doc.updatedAt).getTime() : Date.now();

  return {
    id: String(doc._id),
    _id: String(doc._id),
    ownerId: doc.ownerId ? String(doc.ownerId) : '',
    agent: doc.agent ? String(doc.agent) : (doc.ownerId ? String(doc.ownerId) : ''),
    ownerUid: doc.ownerId ? String(doc.ownerId) : '',
    ownerEmail: doc.ownerEmail || '',
    ownerName: doc.ownerName || '',
    propertyName: doc.propertyName || '',
    propertyType: doc.propertyType || 'Residential',
    location: doc.location || [doc.address, doc.city, doc.state].filter(Boolean).join(', '),
    state: doc.state || '',
    city: doc.city || '',
    address: doc.address || '',
    purchasePrice: doc.purchasePrice || 0,
    purchaseDate: doc.purchaseDate || '',
    currentValue: doc.currentValue || 0,
    annualRent: doc.annualRent || 0,
    annualRentalIncome: doc.annualRentalIncome || 0,
    expectedRentalIncome: doc.expectedRentalIncome || doc.annualRentalIncome || doc.annualRent || 0,
    monthlyRent: doc.monthlyRent || 0,
    annualExpenses: doc.annualExpenses || 0,
    mortgage: doc.mortgage || 0,
    loanAmount: doc.loanAmount || 0,
    interestRate: doc.interestRate || 0,
    loanYears: doc.loanYears || 0,
    expectedAppreciation: doc.expectedAppreciation || 0,
    availableShares: doc.availableShares || 0,
    pricePerShare: doc.pricePerShare || 0,
    minimumInvestment: doc.minimumInvestment || 0,
    appreciationRate: doc.appreciationRate || 0,
    status: doc.propertyStatus || doc.status || 'Under review',
    propertyStatus: doc.propertyStatus || doc.status || 'Under review',
    images: Array.isArray(doc.images) ? doc.images : (doc.image ? [doc.image] : []),
    description: doc.description || '',
    image: doc.image || '',
    favorite: Boolean(doc.favorite),
    createdAt,
    updatedAt,
  };
};

const getProperties = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Administrator';
    const filter = isAdmin ? {} : { ownerId: req.user.id };

    const properties = await Property.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      properties: properties.map(normalizeProperty),
    });
  } catch (error) {
    console.error('Get properties error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while fetching properties.' });
  }
};

const getProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    const isAdmin = req.user.role === 'Administrator';
    if (!isAdmin && String(property.ownerId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, code: 'PROPERTY_FORBIDDEN', message: 'Not authorized to access this property.' });
    }

    return res.status(200).json({ success: true, property: normalizeProperty(property) });
  } catch (error) {
    console.error('Get property error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while fetching property.' });
  }
};

const createProperty = async (req, res) => {
  try {
    if (req.user.role !== 'Property Agent') {
      return res.status(403).json({ success: false, code: 'AGENT_REQUIRED', message: 'Only Property Agents can create properties.' });
    }
    // Ownership is ALWAYS derived from the verified JWT — never from the body.
    const ownerId = req.user.id;
    let ownerEmail = '';
    let ownerName = '';

    try {
      const owner = await User.findById(ownerId);
      if (owner) {
        ownerEmail = owner.email || '';
        ownerName = owner.fullName || '';
      }
    } catch {
      // Owner lookup failure does not block creation; defaults used.
    }

    const {
      propertyName,
      propertyType,
      state,
      city,
      address,
      purchasePrice,
      purchaseDate,
      currentValue,
      annualRent,
      annualRentalIncome,
      monthlyRent,
      annualExpenses,
      mortgage,
      loanAmount,
      interestRate,
      loanYears,
      expectedAppreciation,
      appreciationRate,
      status,
      description,
      image,
      favorite,
    } = req.body;

    if (!propertyName?.trim() || !req.body.location?.trim()) {
      return res.status(400).json({ success: false, code: 'INVALID_PROPERTY', message: 'Property name and location are required.' });
    }
    if (!PROPERTY_TYPES.includes(propertyType || 'Residential') || !PROPERTY_STATUSES.includes(status || 'Under review')) {
      return res.status(400).json({ success: false, code: 'INVALID_PROPERTY', message: 'Invalid property type or status.' });
    }

    const property = await Property.create({
      ownerId,
      agent: ownerId,
      ownerEmail,
      ownerName,
      propertyName: propertyName.trim(),
      propertyType: propertyType || 'Residential',
      location: req.body.location.trim(),
      state: state || '',
      city: city || '',
      address: address || '',
      purchasePrice: Number(purchasePrice) || 0,
      purchaseDate: purchaseDate || '',
      currentValue: Number(currentValue) || 0,
      annualRent: Number(annualRent) || 0,
      annualRentalIncome: Number(annualRentalIncome) || 0,
      expectedRentalIncome: Number(req.body.expectedRentalIncome ?? annualRentalIncome ?? annualRent) || 0,
      monthlyRent: Number(monthlyRent) || 0,
      annualExpenses: Number(annualExpenses) || 0,
      mortgage: Number(mortgage) || 0,
      loanAmount: Number(loanAmount) || 0,
      interestRate: Number(interestRate) || 0,
      loanYears: Number(loanYears) || 0,
      expectedAppreciation: Number(expectedAppreciation) || 0,
      availableShares: Math.max(0, Math.floor(Number(req.body.availableShares) || 0)),
      pricePerShare: Number(req.body.pricePerShare) || 0,
      minimumInvestment: Number(req.body.minimumInvestment) || 0,
      appreciationRate: Number(appreciationRate) || 0,
      status: status || 'Under review',
      propertyStatus: status || 'Under review',
      description: description || '',
      image: image || '',
      images: Array.isArray(req.body.images) ? req.body.images.filter((item) => typeof item === 'string') : [],
      favorite: Boolean(favorite),
    });

    return res.status(201).json({ success: true, property: normalizeProperty(property) });
  } catch (error) {
    console.error('Create property error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while creating property.' });
  }
};

const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    if (req.user.role !== 'Property Agent' || String(property.agent || property.ownerId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, code: 'PROPERTY_FORBIDDEN', message: 'Not authorized to edit this property.' });
    }

    if (req.body.propertyType !== undefined && !PROPERTY_TYPES.includes(req.body.propertyType)) {
      return res.status(400).json({ success: false, code: 'INVALID_PROPERTY', message: 'Invalid property type.' });
    }
    if (req.body.propertyStatus !== undefined && !PROPERTY_STATUSES.includes(req.body.propertyStatus)) {
      return res.status(400).json({ success: false, code: 'INVALID_PROPERTY', message: 'Invalid property status.' });
    }

    // Never allow ownership to change via the request body.
    const {
      propertyName,
      propertyType,
      state,
      city,
      address,
      purchasePrice,
      purchaseDate,
      currentValue,
      annualRent,
      annualRentalIncome,
      monthlyRent,
      annualExpenses,
      mortgage,
      loanAmount,
      interestRate,
      loanYears,
      expectedAppreciation,
      appreciationRate,
      status,
      description,
      image,
      favorite,
    } = req.body;

    if (propertyName !== undefined) property.propertyName = propertyName;
    if (propertyType !== undefined) property.propertyType = propertyType;
    if (req.body.location !== undefined) property.location = req.body.location;
    if (state !== undefined) property.state = state;
    if (city !== undefined) property.city = city;
    if (address !== undefined) property.address = address;
    if (purchasePrice !== undefined) property.purchasePrice = Number(purchasePrice) || 0;
    if (purchaseDate !== undefined) property.purchaseDate = purchaseDate;
    if (currentValue !== undefined) property.currentValue = Number(currentValue) || 0;
    if (annualRent !== undefined) property.annualRent = Number(annualRent) || 0;
    if (annualRentalIncome !== undefined) property.annualRentalIncome = Number(annualRentalIncome) || 0;
    if (req.body.expectedRentalIncome !== undefined) property.expectedRentalIncome = Number(req.body.expectedRentalIncome) || 0;
    if (monthlyRent !== undefined) property.monthlyRent = Number(monthlyRent) || 0;
    if (annualExpenses !== undefined) property.annualExpenses = Number(annualExpenses) || 0;
    if (mortgage !== undefined) property.mortgage = Number(mortgage) || 0;
    if (loanAmount !== undefined) property.loanAmount = Number(loanAmount) || 0;
    if (interestRate !== undefined) property.interestRate = Number(interestRate) || 0;
    if (loanYears !== undefined) property.loanYears = Number(loanYears) || 0;
    if (expectedAppreciation !== undefined) property.expectedAppreciation = Number(expectedAppreciation) || 0;
    if (req.body.availableShares !== undefined) property.availableShares = Math.max(0, Math.floor(Number(req.body.availableShares) || 0));
    if (req.body.pricePerShare !== undefined) property.pricePerShare = Number(req.body.pricePerShare) || 0;
    if (req.body.minimumInvestment !== undefined) property.minimumInvestment = Number(req.body.minimumInvestment) || 0;
    if (appreciationRate !== undefined) property.appreciationRate = Number(appreciationRate) || 0;
    if (status !== undefined) property.status = status;
    if (req.body.propertyStatus !== undefined) property.propertyStatus = req.body.propertyStatus;
    if (status !== undefined && req.body.propertyStatus === undefined) property.propertyStatus = status;
    if (description !== undefined) property.description = description;
    if (image !== undefined) property.image = image;
    if (favorite !== undefined) property.favorite = Boolean(favorite);
    if (Array.isArray(req.body.images)) property.images = req.body.images.filter((item) => typeof item === 'string');

    await property.save();

    return res.status(200).json({ success: true, property: normalizeProperty(property) });
  } catch (error) {
    console.error('Update property error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while updating property.' });
  }
};

const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found.' });
    }

    if (req.user.role !== 'Property Agent' || String(property.agent || property.ownerId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, code: 'PROPERTY_FORBIDDEN', message: 'Not authorized to delete this property.' });
    }

    await Property.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: 'Property deleted.' });
  } catch (error) {
    console.error('Delete property error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while deleting property.' });
  }
};

const normalizeInvestmentProperty = (property) => {
  const normalized = normalizeProperty(property);
  const { ownerId, ownerUid, ownerEmail, ownerName, agent, ...publicProperty } = normalized;
  return publicProperty;
};

const availableFilter = {
  $or: [
    { propertyStatus: 'Available' },
    { propertyStatus: { $exists: false }, status: 'Available' },
  ],
};

const requireInvestor = (req, res) => {
  if (req.user.role !== 'Investor') {
    res.status(403).json({ success: false, code: 'INVESTOR_REQUIRED', message: 'Only Investors can access investment opportunities.' });
    return false;
  }
  return true;
};

const getInvestmentProperties = async (req, res) => {
  try {
    if (!requireInvestor(req, res)) return;
    const properties = await Property.find(availableFilter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, properties: properties.map(normalizeInvestmentProperty) });
  } catch (error) {
    console.error('Get investment properties error:', error.message);
    return res.status(500).json({ success: false, code: 'INVESTMENTS_UNAVAILABLE', message: 'Unable to load investment opportunities.' });
  }
};

const getInvestmentProperty = async (req, res) => {
  try {
    if (!requireInvestor(req, res)) return;
    const property = await Property.findOne({ _id: req.params.id, ...availableFilter });
    if (!property) {
      return res.status(404).json({ success: false, code: 'INVESTMENT_NOT_FOUND', message: 'Investment opportunity not found.' });
    }
    return res.status(200).json({ success: true, property: normalizeInvestmentProperty(property) });
  } catch (error) {
    console.error('Get investment property error:', error.message);
    return res.status(500).json({ success: false, code: 'INVESTMENT_UNAVAILABLE', message: 'Unable to load this investment opportunity.' });
  }
};

module.exports = {
  getInvestmentProperties,
  getInvestmentProperty,
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
};
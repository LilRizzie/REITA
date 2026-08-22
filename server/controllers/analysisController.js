const Analysis = require('../models/Analysis');

const normalizeAnalysis = (analysis) => {
  const doc = analysis.toObject ? analysis.toObject() : analysis;

  const createdAt = doc.createdAt
    ? new Date(doc.createdAt).getTime()
    : Date.now();

  const updatedAt = doc.updatedAt
    ? new Date(doc.updatedAt).getTime()
    : Date.now();

  return {
    id: String(doc._id),
    _id: String(doc._id),
    ownerId: doc.ownerId ? String(doc.ownerId) : '',
    ownerUid: doc.ownerId ? String(doc.ownerId) : '',
    propertyId: doc.propertyId ? String(doc.propertyId) : null,
    propertyName: doc.propertyName || '',
    summary: doc.summary || {},
    recommendation: doc.recommendation || '',
    createdAt,
    updatedAt,
  };
};

const getAnalyses = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Administrator';

    const filter = isAdmin
      ? {}
      : { ownerId: req.user.id };

    const analyses = await Analysis
      .find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      analyses: analyses.map(normalizeAnalysis),
    });
  } catch (error) {
    console.error('Get analyses error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching analyses.',
    });
  }
};

const getAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found.',
      });
    }

    const isAdmin = req.user.role === 'Administrator';

    if (
      !isAdmin &&
      String(analysis.ownerId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this analysis.',
      });
    }

    return res.status(200).json({
      success: true,
      analysis: normalizeAnalysis(analysis),
    });
  } catch (error) {
    console.error('Get analysis error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Server error while fetching analysis.',
    });
  }
};

const createAnalysis = async (req, res) => {
  try {
    const ownerId = req.user.id;

    const {
      propertyId,
      propertyName,
      summary,
      recommendation,
    } = req.body;

    const analysis = await Analysis.create({
      ownerId,
      propertyId: propertyId || null,
      propertyName: propertyName || '',
      summary: summary || {},
      recommendation: recommendation || '',
    });

    return res.status(201).json({
      success: true,
      analysis: normalizeAnalysis(analysis),
    });
  } catch (error) {
    console.error('Create analysis error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Server error while creating analysis.',
    });
  }
};

const deleteAnalysis = async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.id);

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'Analysis not found.',
      });
    }

    const isAdmin = req.user.role === 'Administrator';

    if (
      !isAdmin &&
      String(analysis.ownerId) !== String(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this analysis.',
      });
    }

    await Analysis.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Analysis deleted.',
    });
  } catch (error) {
    console.error('Delete analysis error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Server error while deleting analysis.',
    });
  }
};

module.exports = {
  getAnalyses,
  getAnalysis,
  createAnalysis,
  deleteAnalysis,
};
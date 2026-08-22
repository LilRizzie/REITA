const Report = require('../models/Report');

const normalizeReport = (report) => {
  const doc = report.toObject ? report.toObject() : report;
  const createdAt = doc.createdAt ? new Date(doc.createdAt).getTime() : Date.now();
  const updatedAt = doc.updatedAt ? new Date(doc.updatedAt).getTime() : Date.now();

  return {
    id: String(doc._id),
    _id: String(doc._id),
    ownerId: doc.ownerId ? String(doc.ownerId) : '',
    ownerUid: doc.ownerId ? String(doc.ownerId) : '',
    propertyId: doc.propertyId ? String(doc.propertyId) : null,
    propertyName: doc.propertyName || '',
    propertyType: doc.propertyType || '',
    location: doc.location || '',
    analysisDate: doc.analysisDate || '',
    summary: doc.summary || {},
    recommendation: doc.recommendation || {},
    userName: doc.userName || '',
    generatedBy: doc.generatedBy || '',
    generatedByEmail: doc.generatedByEmail || '',
    createdAt,
    updatedAt,
  };
};

const getReports = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'Administrator';
    const filter = isAdmin ? {} : { ownerId: req.user.id };

    const reports = await Report.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      reports: reports.map(normalizeReport),
    });
  } catch (error) {
    console.error('Get reports error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while fetching reports.' });
  }
};

const getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const isAdmin = req.user.role === 'Administrator';
    if (!isAdmin && String(report.ownerId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to access this report.' });
    }

    return res.status(200).json({ success: true, report: normalizeReport(report) });
  } catch (error) {
    console.error('Get report error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while fetching report.' });
  }
};

const createReport = async (req, res) => {
  try {
    // Ownership is ALWAYS derived from the verified JWT — never from the body.
    const ownerId = req.user.id;

    const {
      propertyId,
      propertyName,
      propertyType,
      location,
      analysisDate,
      summary,
      recommendation,
      userName,
      generatedBy,
      generatedByEmail,
    } = req.body;

    const report = await Report.create({
      ownerId,
      propertyId: propertyId || null,
      propertyName: propertyName || '',
      propertyType: propertyType || '',
      location: location || '',
      analysisDate: analysisDate || '',
      summary: summary || {},
      recommendation: recommendation || {},
      userName: userName || '',
      generatedBy: generatedBy || '',
      generatedByEmail: generatedByEmail || '',
    });

    return res.status(201).json({ success: true, report: normalizeReport(report) });
  } catch (error) {
    console.error('Create report error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while creating report.' });
  }
};

const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found.' });
    }

    const isAdmin = req.user.role === 'Administrator';
    if (!isAdmin && String(report.ownerId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this report.' });
    }

    await Report.findByIdAndDelete(req.params.id);

    return res.status(200).json({ success: true, message: 'Report deleted.' });
  } catch (error) {
    console.error('Delete report error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while deleting report.' });
  }
};

module.exports = {
  getReports,
  getReport,
  createReport,
  deleteReport,
};
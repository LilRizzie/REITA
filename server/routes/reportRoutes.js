const express = require('express');
const router = express.Router();

const {
  getReports,
  getReport,
  createReport,
  deleteReport,
} = require('../controllers/reportController');

const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getReports);
router.get('/:id', getReport);
router.post('/', createReport);
router.delete('/:id', deleteReport);

module.exports = router;
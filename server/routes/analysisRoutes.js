const express = require('express');

const {
  getAnalyses,
  getAnalysis,
  createAnalysis,
  deleteAnalysis,
} = require('../controllers/analysisController');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getAnalyses);
router.get('/:id', getAnalysis);
router.post('/', createAnalysis);
router.delete('/:id', deleteAnalysis);

module.exports = router;
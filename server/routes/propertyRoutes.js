const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getInvestmentProperties,
  getInvestmentProperty,
} = require('../controllers/propertyController');

const router = express.Router();

// All property routes require a valid REITA JWT.
router.use(protect);

router.get('/investments', getInvestmentProperties);
router.get('/investments/:id', getInvestmentProperty);
router.get('/', getProperties);
router.get('/my-properties', (req, res, next) => {
  if (req.user.role !== 'Property Agent') {
    return res.status(403).json({ success: false, code: 'AGENT_REQUIRED', message: 'Only Property Agents can access My Properties.' });
  }
  return getProperties(req, res, next);
});
router.get('/:id', getProperty);
router.post('/', createProperty);
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);

module.exports = router;
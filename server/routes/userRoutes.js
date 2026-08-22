const express = require('express');
const {
  getUsers,
  updateUserRole,
  setUserDisabled,
  deleteUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/adminMiddleware');

const router = express.Router();

router.use(protect, requireAdmin);
router.get('/', getUsers);
router.patch('/:id/role', updateUserRole);
router.patch('/:id/status', setUserDisabled);
router.delete('/:id', deleteUser);

module.exports = router;
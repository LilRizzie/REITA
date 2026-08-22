const User = require('../models/User');

const normalizeUser = (user) => ({
  id: String(user._id),
  _id: String(user._id),
  email: user.email,
  fullName: user.fullName || '',
  photoURL: user.photoURL || '',
  investorType: user.investorType,
  role: user.role,
  emailVerified: Boolean(user.emailVerified),
  lastActive: user.lastActive || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Admin: list all users with optional search/filter.
const getUsers = async (req, res) => {
  try {
    const { query = '', role = '', status = '' } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (status === 'disabled') filter.disabled = true;
    if (status === 'active') filter.disabled = { $ne: true };

    if (query) {
      const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ fullName: regex }, { email: regex }];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      users: users.map(normalizeUser),
    });
  } catch (error) {
    console.error('Get users error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while fetching users.' });
  }
};

// Admin: update a user's role.
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['Investor', 'Property Agent'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }

    // Prevent an admin from demoting themselves.
    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You cannot change your own role.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.role = role;
    user.investorType = role;
    await user.save();

    return res.status(200).json({ success: true, user: normalizeUser(user) });
  } catch (error) {
    console.error('Update user role error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while updating user role.' });
  }
};

// Admin: disable or enable a user.
const setUserDisabled = async (req, res) => {
  try {
    const { id } = req.params;
    const { disabled } = req.body;

    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You cannot disable your own account.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.disabled = Boolean(disabled);
    await user.save();

    return res.status(200).json({ success: true, user: normalizeUser(user) });
  } catch (error) {
    console.error('Set user disabled error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while updating user status.' });
  }
};

// Admin: delete a user.
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({ success: true, message: 'User deleted.' });
  } catch (error) {
    console.error('Delete user error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error while deleting user.' });
  }
};

module.exports = {
  getUsers,
  updateUserRole,
  setUserDisabled,
  deleteUser,
};
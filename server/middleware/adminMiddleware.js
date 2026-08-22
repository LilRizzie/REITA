// ------------------------------------------------------------
// ADMIN MIDDLEWARE
// Restricts a route to Administrator users. Must be used AFTER
// the `protect` middleware so req.user is populated.
// ------------------------------------------------------------
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token provided.', code: 'INVALID_CREDENTIALS' });
  }

  if (req.user.role !== 'Administrator') {
    return res.status(403).json({ success: false, message: 'Administrator access required.', code: 'ADMIN_REQUIRED' });
  }

  next();
};

module.exports = { requireAdmin };
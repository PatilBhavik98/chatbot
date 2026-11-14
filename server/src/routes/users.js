const express = require('express');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/lookup', requireAuth, async (req, res) => {
  const email = String(req.query.email || '')
    .trim()
    .toLowerCase();
  if (!email) {
    return res.status(400).json({ message: 'email query required' });
  }
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: 'No user with that email' });
  }
  if (user._id.equals(req.user._id)) {
    return res.status(400).json({ message: 'Cannot chat with yourself' });
  }
  res.json({ user: user.toPublicJSON() });
});

module.exports = router;
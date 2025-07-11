const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/admin', authMiddleware, adminMiddleware, (req, res) => {
  res.json({ message: 'Welcome to the admin panel', admin: req.user });
});

module.exports = router;

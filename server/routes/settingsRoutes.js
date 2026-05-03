const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { auth, adminOnly } = require('../middleware/authMiddleware');

router.use(auth);

// Get all settings
router.get('/', settingsController.getSettings);

// Update settings
router.put('/', adminOnly, settingsController.updateSettings);

module.exports = router;

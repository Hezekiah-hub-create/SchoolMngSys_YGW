const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');
const { auth, adminOnly } = require('../middleware/authMiddleware');

router.use(auth);

// Get SMS configuration status
router.get('/config', adminOnly, smsController.getSMSStatus);

// Test gateway connection
router.post('/test', adminOnly, smsController.testSMS);

// Send custom single/bulk SMS
router.post('/send', smsController.sendSMS);

// Broadcast SMS to grade/section/school
router.post('/broadcast', smsController.broadcastSMS);

module.exports = router;

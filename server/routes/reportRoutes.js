const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { auth } = require('../middleware/authMiddleware');

router.use(auth);

// Generate student report payload
router.get('/student/:studentId', reportController.getStudentReport);
router.get('/class/:grade', reportController.getClassReport);

module.exports = router;

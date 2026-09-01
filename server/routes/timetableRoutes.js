const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { auth, adminOnly } = require('../middleware/authMiddleware');

router.use(auth);

// Order matters: specific routes before parameterized routes
router.get('/', timetableController.getAllTimetables);
router.get('/class/:className', timetableController.getTimetableByClass);
router.get('/grade/:grade', timetableController.getTimetablesByGrade);
router.get('/teacher/:teacherId', timetableController.getTimetableByTeacher);
router.get('/:id', timetableController.getTimetableById);

// Creation, generation, and modification strictly restricted to administrators
router.post('/auto-generate', adminOnly, timetableController.autoGenerateTimetable);
router.post('/', adminOnly, timetableController.createTimetable);
router.put('/:id', adminOnly, timetableController.updateTimetable);
router.delete('/all', adminOnly, timetableController.deleteAllTimetables);
router.delete('/:id', adminOnly, timetableController.deleteTimetable);
router.post('/:id/period', adminOnly, timetableController.addPeriod);
router.delete('/:id/period', adminOnly, timetableController.removePeriod);

module.exports = router;
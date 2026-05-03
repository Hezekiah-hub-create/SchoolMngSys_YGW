const express = require('express');
const router = express.Router();
const { 
  getAllExams, 
  getExamById, 
  createExam, 
  updateExam, 
  deleteExam,
  getExamResults,
  getExamSchedule
} = require('../controllers/examController');
const { auth, teacherAndAdmin } = require('../middleware/authMiddleware');

router.use(auth);

router.get('/results', getExamResults);
router.get('/schedule', getExamSchedule);

router.route('/')
  .get(getAllExams)
  .post(teacherAndAdmin, createExam);

router.route('/:id')
  .get(getExamById)
  .put(teacherAndAdmin, updateExam)
  .delete(teacherAndAdmin, deleteExam);

module.exports = router;
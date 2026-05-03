const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');

// Helper to map DB snake_case to Frontend camelCase
const mapExamToFrontend = (e) => {
  if (!e) return null;
  return {
    id: e.id,
    name: e.name,
    subject: e.subject,
    grade: e.grade,
    date: e.date,
    duration: e.duration,
    maxScore: e.max_score,
    instructions: e.instructions,
    status: e.status,
    createdAt: e.created_at
  };
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
const getAllExams = asyncHandler(async (req, res) => {
  const exams = await supabaseService.getAll(COLLECTIONS.EXAMS || 'exams', { orderBy: 'date', orderDirection: 'desc' });
  
  res.json({
    success: true,
    data: exams.map(mapExamToFrontend)
  });
});

// @desc    Get exam by ID
// @route   GET /api/exams/:id
// @access  Private
const getExamById = asyncHandler(async (req, res) => {
  const exam = await supabaseService.getById(COLLECTIONS.EXAMS || 'exams', req.params.id);
  
  if (!exam) {
    return res.status(404).json({ message: 'Exam not found' });
  }
  
  res.json({
    success: true,
    data: mapExamToFrontend(exam)
  });
});

// @desc    Create new exam
// @route   POST /api/exams
// @access  Private (Admin, Teacher)
const createExam = asyncHandler(async (req, res) => {
  const examData = {
    name: req.body.name,
    subject: req.body.subject,
    grade: req.body.grade,
    date: req.body.date,
    duration: req.body.duration,
    max_score: req.body.maxScore,
    instructions: req.body.instructions,
    status: req.body.status || 'scheduled'
  };
  
  const exam = await supabaseService.create(COLLECTIONS.EXAMS || 'exams', examData);
  
  res.status(201).json({
    success: true,
    data: mapExamToFrontend(exam)
  });
});

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Admin, Teacher)
const updateExam = asyncHandler(async (req, res) => {
  const existing = await supabaseService.getById(COLLECTIONS.EXAMS || 'exams', req.params.id);
  
  if (!existing) {
    return res.status(404).json({ message: 'Exam not found' });
  }
  
  const updates = {};
  if (req.body.name) updates.name = req.body.name;
  if (req.body.subject) updates.subject = req.body.subject;
  if (req.body.grade) updates.grade = req.body.grade;
  if (req.body.date) updates.date = req.body.date;
  if (req.body.duration) updates.duration = req.body.duration;
  if (req.body.maxScore) updates.max_score = req.body.maxScore;
  if (req.body.instructions) updates.instructions = req.body.instructions;
  if (req.body.status) updates.status = req.body.status;
  
  const updated = await supabaseService.update(COLLECTIONS.EXAMS || 'exams', req.params.id, updates);
  
  res.json({
    success: true,
    data: mapExamToFrontend(updated)
  });
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Admin)
const deleteExam = asyncHandler(async (req, res) => {
  const exam = await supabaseService.getById(COLLECTIONS.EXAMS || 'exams', req.params.id);
  
  if (!exam) {
    return res.status(404).json({ message: 'Exam not found' });
  }
  
  await supabaseService.delete(COLLECTIONS.EXAMS || 'exams', req.params.id);
  
  res.json({
    success: true,
    message: 'Exam deleted successfully'
  });
});

// @desc    Get exam results
// @route   GET /api/exams/results
// @access  Private
// @desc    Get exam results
// @route   GET /api/exams/results
// @access  Private
const getExamResults = asyncHandler(async (req, res) => {
  // Fetch from grades table since exam_results doesn't exist
  const supabase = require('../config/supabase');
  const { data: results, error } = await supabase.from(COLLECTIONS.GRADES || 'grades')
    .select('*, course:course_id(subject:subject_id(name), class:class_id(name))')
    .order('created_at', { ascending: false });
    
  if (error || !results) {
    return res.json({ success: true, data: [] });
  }
  
  // Map grades to the format expected by ExamResults.jsx
  const mappedResults = results.map(r => ({
    id: r.id,
    studentId: r.student_id,
    courseId: r.course_id,
    subject: r.course?.subject?.name || 'General Subject', // Fetch from joined table
    score: r.total_score || 0,
    maxScore: 100, // Default max score
    grade: r.course?.class?.name || r.term || 'N/A', // Using joined class name or term
    term: r.term,
    academicYear: r.academic_year,
    letterGrade: r.letter_grade,
    isFinalized: r.is_finalized,
    createdAt: r.created_at
  }));
  
  res.json({
    success: true,
    data: mappedResults
  });
});

// @desc    Get exam schedule
// @route   GET /api/exams/schedule
// @access  Private
const getExamSchedule = asyncHandler(async (req, res) => {
  const exams = await supabaseService.getAll(COLLECTIONS.EXAMS || 'exams', { 
    orderBy: 'date', 
    orderDirection: 'asc' 
  });
  
  res.json({
    success: true,
    data: exams.map(mapExamToFrontend)
  });
});

module.exports = {
  getAllExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  getExamResults,
  getExamSchedule
};
const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const { asyncHandler } = require('../middleware/errorMiddleware');

// Get all assignments
const getAllAssignments = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 20, grade, dueDate, student } = req.query;
    let course = req.query.course;
    const user = req.user;

    console.log(`[DEBUG] getAllAssignments called. User: ${user.id}, Role: ${user.role}, Course Query: ${course}`);

    // Data Isolation for Teachers
    let teacherCourseIds = null;
    if (user.role === 'teacher' || user.role === 'staff') {
      const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
      if (teacherProfile) {
        console.log(`[DEBUG] Found teacher profile: ${teacherProfile.id}`);
        const teacherCourses = await supabaseService.getAll(COLLECTIONS.COURSES);
        teacherCourseIds = teacherCourses
          .filter(c => (c.teacher_id || c.teacher) === teacherProfile.id)
          .map(c => c.id);
        
        console.log(`[DEBUG] Teacher handles ${teacherCourseIds.length} courses`);

        // If course is requested, ensure it's one of the teacher's courses
        if (course && !teacherCourseIds.includes(course)) {
          console.warn(`[DEBUG] Teacher ${teacherProfile.id} tried to access course ${course} they don't handle`);
          return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
        }
      } else {
        console.warn(`[DEBUG] No teacher profile found for user ${user.id}`);
        return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
      }
    }

    let assignments = [];
    try {
      assignments = await supabaseService.getAll(COLLECTIONS.ASSIGNMENTS, { 
        orderBy: 'due_date', 
        orderDirection: 'asc' 
      });
    } catch (assignErr) {
      console.warn('[DEBUG] Assignments table might be missing or empty:', assignErr.message);
      return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
    }

    // Data Isolation for Students
    if (user.role === 'student') {
      const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', user.id);
      if (studentProfile) {
        const studentGrade = studentProfile.grade;
        const studentSection = studentProfile.section;
        
        assignments = assignments.filter((a) => {
          const hasSubmission = (a.submissions || []).some((s) => s.student === studentProfile.id);
          
          const normalize = (g) => g ? g.toString().toLowerCase().replace('primary', 'basic').replace(/\s/g, '') : '';
          const studentGradeNorm = normalize(studentGrade);
          const aGradeNorm = normalize(a.grade || a.class);
          
          const matchesGrade = studentGradeNorm && aGradeNorm && (
            studentGradeNorm === aGradeNorm && (!a.section || a.section === studentSection)
          );
          return hasSubmission || matchesGrade;
        });
      } else {
        return res.json({ success: true, data: [], pagination: { page: 1, limit, total: 0, pages: 0 } });
      }
    }

    // Filter by teacher's courses if applicable

    // Filter by teacher's courses if applicable
    if (teacherCourseIds) {
      assignments = assignments.filter(a => teacherCourseIds.includes(a.course_id || a.course));
    }

    // Apply filters
    if (course) {
      assignments = assignments.filter(a => (a.course_id || a.course) === course);
    }
    if (grade) {
      assignments = assignments.filter(a => a.grade === grade);
    }
    if (dueDate) {
      const dueDateObj = new Date(dueDate);
      assignments = assignments.filter(a => new Date(a.due_date || a.dueDate) <= dueDateObj);
    }
    if (student) {
      const studentRecord = await supabaseService.getById(COLLECTIONS.STUDENTS, student);
      const studentGrade = studentRecord?.grade;
      assignments = assignments.filter((a) => {
        const hasSubmission = (a.submissions || []).some((s) => s.student === student);
        const matchesGrade = studentGrade && (
          a.grade === studentGrade ||
          a.class === studentGrade ||
          `${a.grade || ''}${a.section || ''}` === studentGrade
        );
        return hasSubmission || matchesGrade;
      });
    }

    // Pagination
    const total = assignments.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedAssignments = assignments.slice(startIndex, endIndex);

    res.json({ 
      success: true, 
      data: paginatedAssignments, 
      pagination: { 
        page: parseInt(page), 
        limit: parseInt(limit), 
        total,
        pages: Math.ceil(total / limit)
      } 
    });
  } catch (error) {
    console.error('[ERROR] getAllAssignments failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error while fetching assignments',
      error: error.message
    });
  }
});

// Get single assignment
const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await supabaseService.getById(COLLECTIONS.ASSIGNMENTS, req.params.id);
  
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }
  
  res.json({ success: true, data: assignment });
});

// Create assignment
const createAssignment = asyncHandler(async (req, res) => {
  const { title, description, course, grade, assignmentType, maxScore, weight, releaseDate, dueDate, instructions } = req.body;
  const user = req.user;
  let teacherId = req.body.teacherId;

  // Security check for teachers
  if (user.role === 'teacher' || user.role === 'staff') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
    if (!teacherProfile) return res.status(403).json({ message: 'Teacher profile not found' });
    
    teacherId = teacherProfile.id;

    // Verify course belongs to teacher
    const courseData = await supabaseService.getById(COLLECTIONS.COURSES, course);
    if (!courseData || (courseData.teacher_id !== teacherId && courseData.teacher !== teacherId)) {
      return res.status(403).json({ message: 'Access denied. You can only create assignments for your own classes.' });
    }
  }

  // Fetch current settings for academic year and term
  const allSettings = await supabaseService.getAll('settings');
  const settings = allSettings && allSettings.length > 0 ? allSettings[0] : { current_session: '2024-2025', current_term: '1st' };

  const assignmentData = {
    title,
    description,
    course_id: course,
    teacher_id: teacherId,
    academic_year: settings.current_session || '2024-2025',
    term: settings.current_term || '1st',
    grade,
    assignment_type: assignmentType || 'homework',
    max_score: maxScore || 100,
    weight: weight || 1,
    release_date: releaseDate || new Date().toISOString().split('T')[0],
    due_date: dueDate,
    instructions,
    submissions: [],
    is_published: true
  };

  const assignment = await supabaseService.create(COLLECTIONS.ASSIGNMENTS, assignmentData);
  res.status(201).json({ success: true, data: assignment });
});

// Update assignment
const updateAssignment = asyncHandler(async (req, res) => {
  const assignment = await supabaseService.getById(COLLECTIONS.ASSIGNMENTS, req.params.id);
  
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }
  
  const fieldMapping = {
    title: 'title',
    description: 'description',
    course: 'course_id',
    teacherId: 'teacher_id',
    grade: 'grade',
    assignmentType: 'assignment_type',
    maxScore: 'max_score',
    weight: 'weight',
    releaseDate: 'release_date',
    dueDate: 'due_date',
    instructions: 'instructions',
    isPublished: 'is_published'
  };

  const updates = {};
  Object.keys(fieldMapping).forEach(frontendField => {
    if (req.body[frontendField] !== undefined) {
      updates[fieldMapping[frontendField]] = req.body[frontendField];
    }
  });

  const updatedAssignment = await supabaseService.update(
    COLLECTIONS.ASSIGNMENTS,
    req.params.id,
    updates
  );
  
  res.json({ success: true, data: updatedAssignment });
});

// Delete assignment
const deleteAssignment = asyncHandler(async (req, res) => {
  const assignment = await supabaseService.getById(COLLECTIONS.ASSIGNMENTS, req.params.id);
  
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }
  
  await supabaseService.delete(COLLECTIONS.ASSIGNMENTS, req.params.id);
  
  res.json({ success: true, message: 'Assignment deleted successfully' });
});

// Submit assignment
const submitAssignment = asyncHandler(async (req, res) => {
  const { studentId, content, attachments } = req.body;
  
  const assignment = await supabaseService.getById(COLLECTIONS.ASSIGNMENTS, req.params.id);
  
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  const submissions = assignment.submissions || [];
  const existingIndex = submissions.findIndex(s => s.student === studentId);

  const submission = {
    student: studentId,
    content,
    attachments: attachments || [],
    submittedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    submissions[existingIndex] = { ...submissions[existingIndex], ...submission };
  } else {
    submissions.push(submission);
  }

  const updatedAssignment = await supabaseService.update(
    COLLECTIONS.ASSIGNMENTS,
    req.params.id,
    { submissions }
  );

  res.json({ success: true, data: updatedAssignment });
});

// Grade submission
const gradeSubmission = asyncHandler(async (req, res) => {
  const { studentId, score, feedback } = req.body;
  const user = req.user;
  
  const assignment = await supabaseService.getById(COLLECTIONS.ASSIGNMENTS, req.params.id);
  
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  // Security check for teachers
  if (user.role === 'teacher' || user.role === 'staff') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
    if (!teacherProfile) return res.status(403).json({ message: 'Teacher profile not found' });
    
    // Check if the assignment belongs to the teacher
    if (assignment.teacher_id !== teacherProfile.id) {
      // Check if it's one of their courses at least
      const course = await supabaseService.getById(COLLECTIONS.COURSES, assignment.course_id || assignment.course);
      if (!course || (course.teacher_id !== teacherProfile.id && course.teacher !== teacherProfile.id)) {
        return res.status(403).json({ message: 'Access denied. You can only grade assignments for your own classes.' });
      }
    }
  }

  const submissions = assignment.submissions || [];
  const submissionIndex = submissions.findIndex(s => s.student === studentId);

  if (submissionIndex < 0) {
    return res.status(404).json({ message: 'Submission not found' });
  }

  submissions[submissionIndex] = {
    ...submissions[submissionIndex],
    score,
    feedback,
    gradedAt: new Date().toISOString()
  };

  const updatedAssignment = await supabaseService.update(
    COLLECTIONS.ASSIGNMENTS,
    req.params.id,
    { submissions }
  );

  res.json({ success: true, data: updatedAssignment });
});

// Get course assignments
const getCourseAssignments = asyncHandler(async (req, res) => {
  const assignments = await supabaseService.query(
    COLLECTIONS.ASSIGNMENTS,
    'course_id',
    '==',
    req.params.courseId
  );

  // Sort by due date
  assignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  res.json({ success: true, data: assignments });
});

// Upload file for assignment
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // In a real app, you might upload to Supabase Storage here.
  // For now, we return the local path or a mock URL.
  const fileUrl = `/uploads/${req.file.filename}`;
  
  res.json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    }
  });
});

module.exports = { 
  getAllAssignments, 
  getAssignmentById, 
  createAssignment, 
  updateAssignment, 
  deleteAssignment, 
  submitAssignment, 
  gradeSubmission, 
  getCourseAssignments,
  uploadFile
};


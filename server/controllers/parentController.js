const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');
const bcrypt = require('bcryptjs');


// Helper to map DB snake_case to Frontend camelCase
const mapParentToFrontend = (p) => {
  if (!p) return null;
  return {
    id: p.id,
    userId: p.user_id,
    firstName: p.first_name,
    lastName: p.last_name,
    email: p.email,
    phone: p.phone,
    alternativePhone: p.alternative_phone,
    occupation: p.occupation,
    relationship: p.relationship,
    studentIds: p.student_ids || [],
    address: p.address || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Ghana'
    },
    status: p.status,
    profileImage: p.profile_image,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
};

// @desc    Get all parents
// @route   GET /api/parents
// @access  Private
const getAllParents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;

  let parents = await supabaseService.getAll(COLLECTIONS.PARENTS, { 
    orderBy: 'last_name', 
    orderDirection: 'asc' 
  });

  // Apply search filter
  if (search) {
    const searchWords = search.toLowerCase().trim().split(/\s+/).filter(Boolean);
    parents = parents.filter(p => {
      const fullName = `${p.first_name || ''} ${p.last_name || ''}`.toLowerCase();
      return searchWords.every(word =>
        fullName.includes(word) ||
        p.email?.toLowerCase().includes(word) ||
        p.phone?.includes(word)
      );
    });
  }

  // Pagination
  const total = parents.length;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedParents = parents.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedParents.map(mapParentToFrontend),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single parent
// @route   GET /api/parents/:id
// @access  Private
const getParentById = asyncHandler(async (req, res) => {
  const parent = await supabaseService.getById(COLLECTIONS.PARENTS, req.params.id);

  if (!parent) {
    return res.status(404).json({ message: 'Parent not found' });
  }

  const mappedParent = mapParentToFrontend(parent);

  // Get linked students with full details
  const studentIds = parent.student_ids || [];
  if (studentIds.length > 0) {
    const students = [];
    for (const studentId of studentIds) {
      const student = await supabaseService.getById(COLLECTIONS.STUDENTS, studentId);
      if (student) {
        students.push({
          id: student.id,
          firstName: student.first_name,
          lastName: student.last_name,
          grade: student.grade,
          section: student.section,
          admissionNumber: student.admission_number
        });
      }
    }
    mappedParent.students = students;
  }

  res.json({ success: true, data: mappedParent });
});

// @desc    Create new parent
// @route   POST /api/parents
// @access  Private (Admin)
const createParent = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    gender,
    relationship,
    occupation,
    address,
    phone,
    alternativePhone,
    email,
    students
  } = req.body;

  // Generate parent ID
  const allParents = await supabaseService.getAll(COLLECTIONS.PARENTS);
  const parentCount = allParents.length + 1;
  const parentId = `PAR${String(parentCount).padStart(4, '0')}`;
  const defaultPassword = `${parentId}@123`;
  const userEmail = email || `${parentId.toLowerCase()}@uhasbasic.edu.gh`;

  // Create user account
  let userUid = null;
  try {
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    const user = await supabaseService.create(COLLECTIONS.USERS, {
      email: userEmail,
      password: hashedPassword,
      role: 'parent',
      first_name: firstName,
      last_name: lastName,
      is_active: true
    });
    userUid = user.id;
  } catch (error) {
    console.error('Error creating parent account:', error.message);
    try {
      const existingUser = await supabaseService.getByField(COLLECTIONS.USERS, 'email', userEmail);
      if (existingUser) userUid = existingUser.id;
    } catch (findError) {}
  }

  const parentData = {
    first_name: firstName,
    last_name: lastName,
    gender,
    relationship,
    occupation,
    phone,
    alternative_phone: alternativePhone,
    email: userEmail,
    student_ids: students || [],
    address: address || {},
    status: 'active',
    user_id: userUid
  };

  const parent = await supabaseService.create(COLLECTIONS.PARENTS, parentData);

  res.status(201).json({
    success: true,
    data: mapParentToFrontend(parent),
    credentials: {
      email: userEmail,
      password: defaultPassword
    }
  });
});

// @desc    Update parent
// @route   PUT /api/parents/:id
// @access  Private (Admin)
const updateParent = asyncHandler(async (req, res) => {
  const parent = await supabaseService.getById(COLLECTIONS.PARENTS, req.params.id);

  if (!parent) {
    return res.status(404).json({ message: 'Parent not found' });
  }

  const fieldMapping = {
    firstName: 'first_name',
    lastName: 'last_name',
    email: 'email',
    phone: 'phone',
    alternativePhone: 'alternative_phone',
    gender: 'gender',
    occupation: 'occupation',
    relationship: 'relationship',
    address: 'address',
    studentIds: 'student_ids',
    status: 'status',
    profileImage: 'profile_image'
  };

  const updates = {};
  Object.keys(fieldMapping).forEach(frontendField => {
    if (req.body[frontendField] !== undefined) {
      updates[fieldMapping[frontendField]] = req.body[frontendField];
    }
  });

  if (Object.keys(updates).length === 0) {
    return res.json({ success: true, data: mapParentToFrontend(parent) });
  }

  const updatedParent = await supabaseService.update(
    COLLECTIONS.PARENTS,
    req.params.id,
    updates
  );

  // Sync with users table if name changed
  if ((updates.first_name || updates.last_name) && updatedParent.user_id) {
    await supabaseService.update(
      COLLECTIONS.USERS,
      updatedParent.user_id,
      {
        first_name: updatedParent.first_name,
        last_name: updatedParent.last_name
      }
    );
  }

  res.json({
    success: true,
    data: mapParentToFrontend(updatedParent)
  });
});

// @desc    Delete parent
// @route   DELETE /api/parents/:id
// @access  Private (Admin)
const deleteParent = asyncHandler(async (req, res) => {
  const parent = await supabaseService.getById(COLLECTIONS.PARENTS, req.params.id);

  if (!parent) {
    return res.status(404).json({ message: 'Parent not found' });
  }

  if (parent.user_id) {
    try {
      await supabaseService.delete(COLLECTIONS.USERS, parent.user_id);
    } catch (error) {
      console.error('Error deleting user:', error.message);
    }
  }

  await supabaseService.delete(COLLECTIONS.PARENTS, req.params.id);

  res.json({ success: true, message: 'Parent deleted successfully' });
});



// @desc    Get current parent's children
// @route   GET /api/parents/me/children
// @access  Private (Parent)
const getMyChildren = asyncHandler(async (req, res) => {
  const parent = await supabaseService.query(COLLECTIONS.PARENTS, 'user_id', '==', req.user.id);
  if (!parent || parent.length === 0) return res.status(404).json({ message: 'Parent profile not found' });
  
  const studentIds = parent[0].student_ids || [];
  const children = await Promise.all(studentIds.map(async id => {
    const s = await supabaseService.getById(COLLECTIONS.STUDENTS, id);
    if (!s) return null;
    return {
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      email: s.email,
      grade: s.grade,
      section: s.section,
      status: s.status,
      admissionNumber: s.admission_number,
      profileImage: s.profile_image,
      dateOfBirth: s.date_of_birth,
      gender: s.gender,
      phone: s.phone,
      address: s.address,
      createdAt: s.created_at
    };
  }));
  
  res.json({ success: true, data: children.filter(Boolean) });
});

// @desc    Link student to parent
// @route   POST /api/parents/:id/students
// @access  Private (Admin)
const linkStudent = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const parentId = req.params.id;

  const parent = await supabaseService.getById(COLLECTIONS.PARENTS, parentId);
  if (!parent) return res.status(404).json({ message: 'Parent not found' });

  const student_ids = parent.student_ids || [];
  if (!student_ids.includes(studentId)) {
    student_ids.push(studentId);
    await supabaseService.update(COLLECTIONS.PARENTS, parentId, { student_ids });
  }

  res.json({ success: true, message: 'Student linked successfully' });
});

// @desc    Unlink student from parent
// @route   DELETE /api/parents/:id/students/:studentId
// @access  Private (Admin)
const unlinkStudent = asyncHandler(async (req, res) => {
  const { id: parentId, studentId } = req.params;

  const parent = await supabaseService.getById(COLLECTIONS.PARENTS, parentId);
  if (!parent) return res.status(404).json({ message: 'Parent not found' });

  const student_ids = (parent.student_ids || []).filter(id => id !== studentId);
  await supabaseService.update(COLLECTIONS.PARENTS, parentId, { student_ids });

  res.json({ success: true, message: 'Student unlinked successfully' });
});

// @desc    Get current parent's children's grades
// @route   GET /api/parents/me/children/grades
// @access  Private (Parent)
const getMyChildrenGrades = asyncHandler(async (req, res) => {
  const parent = await supabaseService.query(COLLECTIONS.PARENTS, 'user_id', '==', req.user.id);
  if (!parent || parent.length === 0) return res.status(404).json({ message: 'Parent profile not found' });
  
  const studentIds = parent[0].student_ids || [];
  if (studentIds.length === 0) return res.json({ success: true, data: [] });

  const [grades, assignments, students, { data: allCourses }] = await Promise.all([
    supabaseService.getAll(COLLECTIONS.GRADES),
    supabaseService.getAll(COLLECTIONS.ASSIGNMENTS),
    Promise.all(studentIds.map(id => supabaseService.getById(COLLECTIONS.STUDENTS, id))),
    supabase
      .from(COLLECTIONS.CLASS_SUBJECTS)
      .select('id, class_id, subject_id, class:class_id(name), subject:subject_id(name)')
  ]);

  const courseMap = {};
  (allCourses || []).forEach(c => {
    courseMap[c.id] = c.subject?.name || '';
  });

  const studentMap = {};
  students.filter(Boolean).forEach(s => {
    studentMap[s.id] = { id: s.id, firstName: s.first_name, lastName: s.last_name, grade: s.grade };
  });

  const flatGrades = [];

  // 1. Terminal Grades
  (grades || []).forEach(g => {
    if (studentIds.includes(g.student_id)) {
      const numericScore = Number(g.score || g.total_score || 0);
      const letterGrade = g.letter_grade || (numericScore >= 70 ? 'A' : numericScore >= 60 ? 'B' : numericScore >= 50 ? 'C' : 'F');
      flatGrades.push({
        id: g.id,
        subject: g.subject_name || g.subject || courseMap[g.course_id] || 'Academic Subject',
        score: numericScore,
        rawScore: numericScore,
        maxScore: 100,
        grade: letterGrade,
        term: g.term || '1st Term',
        assessmentType: 'Terminal Exam',
        studentId: g.student_id,
        student: studentMap[g.student_id]
      });
    }
  });

  // 2. Graded Assignments & Course Deliverables
  (assignments || []).forEach(a => {
    const submissions = a.submissions || [];
    submissions.forEach(s => {
      const sId = s.student || s.student_id;
      if (studentIds.includes(sId) && s.score !== undefined && s.score !== null) {
        const rawScore = Number(s.score);
        const maxScore = Number(a.max_score || a.maxScore || 100);
        const percentageScore = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : rawScore;
        const letterGrade = percentageScore >= 70 ? 'A' : percentageScore >= 60 ? 'B' : percentageScore >= 50 ? 'C' : 'F';
        
        flatGrades.push({
          id: `asg-${a.id}-${sId}`,
          subject: a.subject || a.subject_name || courseMap[a.course_id] || 'Academic Deliverable',
          score: percentageScore,
          rawScore: rawScore,
          maxScore: maxScore,
          grade: letterGrade,
          term: a.term || '1st Term',
          assessmentType: `${a.title || 'Assignment'} (Assessment)`,
          studentId: sId,
          student: studentMap[sId]
        });
      }
    });
  });

  res.json({ success: true, data: flatGrades });
});

// @desc    Get current parent's children's attendance
// @route   GET /api/parents/me/children/attendance
// @access  Private (Parent)
const getMyChildrenAttendance = asyncHandler(async (req, res) => {
  const parent = await supabaseService.query(COLLECTIONS.PARENTS, 'user_id', '==', req.user.id);
  if (!parent || parent.length === 0) return res.status(404).json({ message: 'Parent profile not found' });
  
  const studentIds = parent[0].student_ids || [];
  if (studentIds.length === 0) return res.json({ success: true, data: [], summaries: {} });

  const { data: attendance, error } = await supabase
    .from(COLLECTIONS.ATTENDANCE)
    .select('*')
    .in('student_id', studentIds)
    .order('date', { ascending: false });

  if (error) throw error;

  const rawStudents = await Promise.all(studentIds.map(id => supabaseService.getById(COLLECTIONS.STUDENTS, id)));
  const studentMap = {};
  const summaries = {};

  rawStudents.filter(Boolean).forEach(s => {
    studentMap[s.id] = {
      id: s.id,
      firstName: s.first_name,
      lastName: s.last_name,
      grade: s.grade,
      section: s.section,
      rollNumber: s.roll_number || s.scholar_identity || s.id_number,
      profileImage: s.profile_image
    };

    const sRecords = (attendance || []).filter(a => a.student_id === s.id);
    const total = sRecords.length;
    const present = sRecords.filter(r => ['present', 'Present'].includes(r.status)).length;
    const late = sRecords.filter(r => ['late', 'Late'].includes(r.status)).length;
    const absent = sRecords.filter(r => ['absent', 'Absent'].includes(r.status)).length;
    const percentage = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

    summaries[s.id] = {
      total,
      present,
      late,
      absent,
      percentage,
      presentDays: present,
      lateDays: late,
      absentDays: absent,
      attendancePercentage: percentage
    };
  });

  const flatAttendance = (attendance || []).map(a => ({
    id: a.id,
    date: a.date,
    status: a.status,
    notes: a.notes || a.remarks || '',
    remarks: a.remarks || a.notes || '',
    arrivalTime: a.arrival_time || null,
    arrival_time: a.arrival_time || null,
    period: a.period || 'General Session',
    academicYear: a.academic_year || '2024-2025',
    term: a.term || '1st',
    studentId: a.student_id,
    student_id: a.student_id,
    student: studentMap[a.student_id] || null
  }));
  
  res.json({ success: true, data: flatAttendance, summaries });
});

// @desc    Get current parent's children's assignments
// @route   GET /api/parents/me/children/assignments
// @access  Private (Parent)
const getMyChildrenAssignments = asyncHandler(async (req, res) => {
  const parent = await supabaseService.query(COLLECTIONS.PARENTS, 'user_id', '==', req.user.id);
  if (!parent || parent.length === 0) return res.status(404).json({ message: 'Parent profile not found' });
  
  const studentIds = parent[0].student_ids || [];
  if (studentIds.length === 0) return res.json({ success: true, data: [] });

  const [assignments, { data: allCourses }, rawStudents] = await Promise.all([
    supabaseService.getAll(COLLECTIONS.ASSIGNMENTS),
    supabase
      .from(COLLECTIONS.CLASS_SUBJECTS)
      .select('id, class_id, subject_id, class:class_id(name), subject:subject_id(name)'),
    Promise.all(studentIds.map(id => supabaseService.getById(COLLECTIONS.STUDENTS, id)))
  ]);

  const courseMap = {};
  (allCourses || []).forEach(c => {
    courseMap[c.id] = {
      ...c,
      name: c.subject?.name || '',
      grade: c.class?.name || ''
    };
  });

  const studentMap = {};
  rawStudents.filter(Boolean).forEach(s => {
    studentMap[s.id] = { id: s.id, firstName: s.first_name, lastName: s.last_name, grade: s.grade, section: s.section };
  });

  const normalizeGrade = (g) => {
    if (!g) return '';
    let str = String(g).toLowerCase().trim().replace(/primary/i, 'basic').replace(/\s/g, '');
    if (str.includes('jhs1') || str === 'jhs1') return 'basic7';
    if (str.includes('jhs2') || str === 'jhs2') return 'basic8';
    if (str.includes('jhs3') || str === 'jhs3') return 'basic9';
    return str;
  };

  const flatAssignments = [];
  
  for (const studentId of studentIds) {
    const student = studentMap[studentId];
    if (!student) continue;
    
    const studentGradeNorm = normalizeGrade(student.grade);
    
    const matchedAssignments = (assignments || []).filter(a => {
      const hasSubmission = (a.submissions || []).some(s => s.student === studentId || s.student_id === studentId);
      if (hasSubmission) return true;

      const courseInfo = courseMap[a.course_id] || {};
      const aGrade = a.grade || a.class || courseInfo.grade;
      const aGradeNorm = normalizeGrade(aGrade);
      return studentGradeNorm && aGradeNorm && (studentGradeNorm === aGradeNorm);
    });

    matchedAssignments.forEach(a => {
      const courseInfo = courseMap[a.course_id] || {};
      const submissions = a.submissions || [];
      const sub = submissions.find(s => s.student === studentId || s.student_id === studentId);
      
      flatAssignments.push({
        id: a.id,
        title: a.title || 'Assignment',
        description: a.description || '',
        instructions: a.instructions || '',
        attachments: a.attachments || [],
        dueDate: a.due_date || a.dueDate,
        status: sub ? (sub.status || 'submitted') : 'pending',
        score: sub ? sub.score : null,
        subject: a.subject || courseInfo.name || 'Subject',
        subjectName: a.subject_name || a.subject || courseInfo.name || 'Subject',
        grade: a.grade || student.grade,
        section: a.section || student.section,
        maxScore: a.max_score || a.maxScore || 100,
        studentId: studentId,
        student: { id: student.id, firstName: student.firstName, lastName: student.lastName },
        submissions: a.submissions || [],
        submission: sub || null
      });
    });
  }

  res.json({ success: true, data: flatAssignments });
});

// @desc    Get announcements for parent
// @route   GET /api/parents/me/children/announcements
// @access  Private (Parent)
const getMyChildrenAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await supabaseService.getAll(COLLECTIONS.EVENTS, { limit: 10, orderBy: 'created_at', orderDirection: 'desc' });
  res.json({ success: true, data: announcements });
});

const getNotifications = asyncHandler(async (req, res) => {
  let parentId = req.params.id;
  let parent;

  if (parentId && parentId !== 'me') {
    parent = await supabaseService.getById(COLLECTIONS.PARENTS, parentId);
  } else {
    const parents = await supabaseService.query(COLLECTIONS.PARENTS, 'user_id', '==', req.user.id);
    parent = parents?.[0];
  }

  if (!parent && req.user?.email) {
    const { data } = await supabase.from(COLLECTIONS.PARENTS).select('*').eq('email', req.user.email).maybeSingle();
    parent = data;
  }

  const notifications = parent?.notifications || [];
  const sorted = Array.isArray(notifications)
    ? [...notifications].sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0))
    : [];

  res.json({ success: true, data: sorted });
});

const markNotificationRead = asyncHandler(async (req, res) => {
  let parentId = req.params.id;
  const { notificationId } = req.params;
  let parent;

  if (parentId && parentId !== 'me') {
    parent = await supabaseService.getById(COLLECTIONS.PARENTS, parentId);
  } else {
    const parents = await supabaseService.query(COLLECTIONS.PARENTS, 'user_id', '==', req.user.id);
    parent = parents?.[0];
  }

  if (!parent && req.user?.email) {
    const { data } = await supabase.from(COLLECTIONS.PARENTS).select('*').eq('email', req.user.email).maybeSingle();
    parent = data;
  }

  if (parent) {
    let notifications = Array.isArray(parent.notifications) ? parent.notifications : [];
    if (notificationId === 'all') {
      notifications = notifications.map(n => ({ ...n, read: true, isRead: true }));
    } else {
      notifications = notifications.map(n => String(n.id) === String(notificationId) ? { ...n, read: true, isRead: true } : n);
    }
    await supabase.from(COLLECTIONS.PARENTS).update({ notifications }).eq('id', parent.id);
  }

  res.json({ success: true, message: 'Notification marked as read' });
});

const migrateParentsFromStudents = asyncHandler(async (req, res) => res.json({ success: true }));
const getChildrenTimetable = asyncHandler(async (req, res) => {
  const parent = await supabaseService.query(COLLECTIONS.PARENTS, 'user_id', '==', req.user.id);
  if (!parent || parent.length === 0) return res.status(404).json({ message: 'Parent profile not found' });
  
  const studentIds = parent[0].student_ids || [];
  if (studentIds.length === 0) return res.json({ success: true, data: [] });

  const students = await Promise.all(studentIds.map(id => supabaseService.getById(COLLECTIONS.STUDENTS, id)));
  const gradesData = students.filter(Boolean).map(s => s.grade);
  
  const timetables = await supabaseService.getAll(COLLECTIONS.TIMETABLE);
  const myChildrenTimetables = timetables.filter(t => gradesData.includes(t.grade));
  
  res.json({ success: true, data: myChildrenTimetables });
});

module.exports = {
  getAllParents,
  getParentById,
  createParent,
  updateParent,
  deleteParent,
  getMyChildren,
  getMyChildrenGrades,
  getMyChildrenAttendance,
  getMyChildrenAssignments,
  getMyChildrenAnnouncements,
  getNotifications,
  migrateParentsFromStudents,
  linkStudent,
  unlinkStudent,
  markNotificationRead,
  getChildrenTimetable
};

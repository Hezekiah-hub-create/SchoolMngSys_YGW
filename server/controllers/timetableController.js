const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');

const isUUID = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
};

// @desc    Get all timetables
// @route   GET /api/timetable
// @access  Private
const getAllTimetables = asyncHandler(async (req, res) => {
  const timetables = await supabaseService.getAll(COLLECTIONS.TIMETABLE);
  res.json({ success: true, data: timetables });
});

// @desc    Get timetable by ID
// @route   GET /api/timetable/id/:id
// @access  Private
const getTimetableById = asyncHandler(async (req, res) => {
  const timetable = await supabaseService.getById(COLLECTIONS.TIMETABLE, req.params.id);
  if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
  res.json({ success: true, data: timetable });
});

// @desc    Get timetable by class/grade
// @route   GET /api/timetable/class/:className
// @access  Private
const getTimetableByClass = asyncHandler(async (req, res) => {
  const { className } = req.params;
  const user = req.user;

  // Security check for students
  if (user.role === 'student') {
    const studentProfile = await supabaseService.getByField(COLLECTIONS.STUDENTS, 'user_id', user.id);
    if (studentProfile) {
      const myGrade = studentProfile.grade;
      
      const requested = className.toLowerCase().trim().replace(/\s/g, '');
      const myGradeNorm = myGrade.toLowerCase().trim().replace(/\s/g, '');
      
      const allowed = [myGradeNorm, 'configuration']; // Students can view configuration for periods
      
      if (!allowed.includes(requested)) {
        return res.status(403).json({ message: 'Access denied. You can only view your own class timetable.' });
      }
    }
  }

  // Security check for parents
  if (user.role === 'parent') {
    const parentProfile = await supabaseService.getByField(COLLECTIONS.PARENTS, 'user_id', user.id);
    if (parentProfile) {
      const studentIds = parentProfile.student_ids || [];
      const children = await Promise.all(studentIds.map(id => supabaseService.getById(COLLECTIONS.STUDENTS, id)));
      
      const requested = className.toLowerCase().trim().replace(/\s/g, '');
      const allowedClasses = children.filter(Boolean).map(s => {
        const gradeNorm = (s.grade || '').toLowerCase().trim().replace(/\s/g, '');
        return [gradeNorm];
      }).flat();
      allowedClasses.push('configuration'); // Parents can view configuration for periods

      if (!allowedClasses.includes(requested)) {
        return res.status(403).json({ message: 'Access denied. You can only view your children\'s class timetables.' });
      }
    }
  }
  
  let grade = className.trim();
  
  if (className === 'CONFIGURATION') {
    grade = 'SYSTEM';
  }

  const allSettings = await supabaseService.getAll('settings');
  const settings = allSettings && allSettings.length > 0 ? allSettings[0] : { current_session: '2024/2025', current_term: '1st' };
  const currentSession = settings.current_session;

  const gradesToSearch = [grade];
  const gradeLower = grade.toLowerCase();

  if (gradeLower === 'jhs 1' || gradeLower === 'jhs1') gradesToSearch.push('Basic 7');
  if (gradeLower === 'jhs 2' || gradeLower === 'jhs2') gradesToSearch.push('Basic 8');
  if (gradeLower === 'jhs 3' || gradeLower === 'jhs3') gradesToSearch.push('Basic 9');
  if (gradeLower === 'basic 7') gradesToSearch.push('JHS 1');
  if (gradeLower === 'basic 8') gradesToSearch.push('JHS 2');
  if (gradeLower === 'basic 9') gradesToSearch.push('JHS 3');

  const { data: allRows, error } = await supabase
    .from(COLLECTIONS.TIMETABLE)
    .select('*, teacher:teacher_id(*)')
    .in('grade', gradesToSearch)
    .eq('term', settings.current_term);

  if (error) throw error;

  const rows = allRows || [];

  const classRows = (rows || []).filter(r => {
    const rYear = (r.academic_year || r.academicYear || '').replace('/', '-');
    const sYear = currentSession.replace('/', '-');
    return rYear === sYear;
  });

  const courseIds = [...new Set(classRows.map(r => r.course_id).filter(Boolean))];
  const classSubjectMap = {};
  
  if (courseIds.length > 0) {
    const { data: classSubjects } = await supabase
      .from(COLLECTIONS.CLASS_SUBJECTS)
      .select('id, subject:subject_id(name)')
      .in('id', courseIds);
    
    if (classSubjects) {
      classSubjects.forEach(cs => {
        classSubjectMap[cs.id] = cs.subject?.name || cs.subject_id;
      });
    }
  }
  
  const schedule = {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [], Periods: []
  };

  classRows.forEach(row => {
    const day = row.day.charAt(0).toUpperCase() + row.day.slice(1);
    if (schedule[day]) {
      // Resolve subject name from manual map
      const subjectName = classSubjectMap[row.course_id] || row.course_id;
      // Resolve teacher name from join
      const teacherName = row.teacher ? `${row.teacher.first_name} ${row.teacher.last_name}` : row.teacher_id;

      schedule[day].push({
        id: row.id,
        period: row.period,
        subjectId: row.course_id,
        subject: subjectName,
        teacherId: row.teacher_id,
        teacher: teacherName,
        startTime: row.start_time,
        endTime: row.end_time,
        time: `${row.start_time || ''} - ${row.end_time || ''}`,
        room: row.room,
        isBreak: row.is_break,
        break_label: row.break_label
      });
    }
  });

  Object.keys(schedule).forEach(day => {
    schedule[day].sort((a, b) => a.period - b.period);
  });

  const DEFAULT_PERIODS = [
    { period: 0, startTime: '07:30', endTime: '08:10', time: '07:30 - 08:10', name: 'Morning Assembly', isBreak: true },
    { period: 1, startTime: '08:10', endTime: '08:55', time: '08:10 - 08:55', name: 'Period 1', isBreak: false },
    { period: 2, startTime: '08:55', endTime: '09:40', time: '08:55 - 09:40', name: 'Period 2', isBreak: false },
    { period: 3, startTime: '09:40', endTime: '10:10', time: '09:40 - 10:10', name: 'Break', isBreak: true },
    { period: 4, startTime: '10:10', endTime: '10:55', time: '10:10 - 10:55', name: 'Period 3', isBreak: false },
    { period: 5, startTime: '10:55', endTime: '11:40', time: '10:55 - 11:40', name: 'Period 4', isBreak: false },
    { period: 6, startTime: '11:40', endTime: '12:10', time: '11:40 - 12:10', name: 'Break', isBreak: true },
    { period: 7, startTime: '12:10', endTime: '12:55', time: '12:10 - 12:55', name: 'Period 5', isBreak: false },
    { period: 8, startTime: '12:55', endTime: '13:40', time: '12:55 - 13:40', name: 'Period 6', isBreak: false },
    { period: 9, startTime: '13:40', endTime: '14:25', time: '13:40 - 14:25', name: 'Period 7', isBreak: false },
    { period: 10, startTime: '14:25', endTime: '15:00', time: '14:25 - 15:00', name: 'Dismissal', isBreak: true },
  ];

  let finalPeriods = [...(schedule.Monday || []), ...(schedule.Periods || [])].sort((a, b) => a.period - b.period);
  
  // If the fetched periods are empty or seem like uninitialized placeholders (empty names)
  const isUninitialized = finalPeriods.length === 0 || finalPeriods.every(p => !p.name);
  
  if (className === 'CONFIGURATION' && isUninitialized) {
    finalPeriods = DEFAULT_PERIODS.map(p => ({
      ...p,
      startTime: p.startTime || p.time?.split(' - ')[0] || '',
      endTime: p.endTime || p.time?.split(' - ')[1] || '',
      time: p.time || `${p.startTime || ''} - ${p.endTime || ''}`
    }));
  }

  res.json({ 
    success: true, 
    data: {
      id: classRows.length > 0 ? (className === 'CONFIGURATION' ? 'SYSTEM-CONFIG' : grade) : null,
      class: className,
      grade,
      schedule: className === 'CONFIGURATION' 
        ? { periods: finalPeriods }
        : schedule
    } 
  });
});

// @desc    Get timetables by grade
// @route   GET /api/timetable/grade/:grade
// @access  Private
const getTimetablesByGrade = asyncHandler(async (req, res) => {
  const { grade } = req.params;
  const timetables = await supabaseService.getManyByField(COLLECTIONS.TIMETABLE, 'grade', grade);
  res.json({ success: true, data: timetables });
});

// @desc    Get timetable by teacher
// @route   GET /api/timetable/teacher/:teacherId
// @access  Private
const getTimetableByTeacher = asyncHandler(async (req, res) => {
  const { teacherId } = req.params;
  const user = req.user;

  // Security check: Teachers can only view their own timetable unless they are Admin
  if (user.role === 'teacher' && user.id !== teacherId && !isUUID(teacherId)) {
     // If user.id is not UUID but teacherId is, it might be a mismatch in how IDs are stored.
     // But generally, teachers should only see their own.
     // We allow it for now if it's their own profile.
  }
  
  const { data: allPeriods, error } = await supabase
    .from(COLLECTIONS.TIMETABLE)
    .select('*, teacher:teacher_id(*)')
    .eq('teacher_id', teacherId);

  if (error) throw error;
  
  const courseIds = [...new Set((allPeriods || []).map(p => p.course_id).filter(Boolean))];
  const classSubjectMap = {};
  
  if (courseIds.length > 0) {
    const { data: classSubjects } = await supabase
      .from(COLLECTIONS.CLASS_SUBJECTS)
      .select('id, subject:subject_id(name)')
      .in('id', courseIds);
    
    if (classSubjects) {
      classSubjects.forEach(cs => {
        classSubjectMap[cs.id] = cs.subject?.name || cs.subject_id;
      });
    }
  }

  const teacherTimetables = (allPeriods || []).map(p => {
    const subjectName = classSubjectMap[p.course_id] || p.course_id;
    const teacherName = p.teacher ? `${p.teacher.first_name} ${p.teacher.last_name}` : p.teacher_id;
    
    return {
      ...p,
      day: p.day.charAt(0).toUpperCase() + p.day.slice(1),
      startTime: p.start_time,
      endTime: p.end_time,
      course_name: subjectName,
      subject: subjectName,
      teacher: teacherName, // Ensure this is a string
      grade: p.grade
    };
  });

  res.json({ success: true, data: teacherTimetables });
});

// Helper to detect clashes across timetable classes
async function checkTimetableClashes({ grade, schedule, settings }) {
  const normCurrentSession = (settings.current_session || '').replace('/', '-');
  
  const { data: allTimetable, error } = await supabase
    .from(COLLECTIONS.TIMETABLE)
    .select('*, teacher:teacher_id(id, first_name, last_name)')
    .eq('term', settings.current_term)
    .neq('grade', grade);
    
  if (error || !allTimetable) return [];
  
  const clashes = [];
  const days = Object.keys(schedule);
  
  for (const day of days) {
    const dayNorm = day.toLowerCase();
    const periods = Array.isArray(schedule[day]) ? schedule[day] : [];
    
    for (const p of periods) {
      if (p.isBreak) continue;
      const tId = p.teacherId || p.teacher;
      const room = p.room ? p.room.trim() : null;
      
      if (isUUID(tId)) {
        const conflict = allTimetable.find(existing => {
          const normRowSession = (existing.academic_year || existing.academicYear || '').replace('/', '-');
          return normRowSession === normCurrentSession &&
                 existing.day?.toLowerCase() === dayNorm &&
                 parseInt(existing.period) === parseInt(p.period) &&
                 existing.teacher_id === tId &&
                 !existing.is_break;
        });
        
        if (conflict) {
          const teacherName = conflict.teacher ? `${conflict.teacher.first_name} ${conflict.teacher.last_name}` : 'The selected educator';
          clashes.push(`${teacherName} is already assigned to ${conflict.grade} on ${day} during Period ${p.period}.`);
        }
      }
      
      if (room && room !== 'Classroom' && room !== 'N/A' && room !== '') {
        const roomConflict = allTimetable.find(existing => {
          const normRowSession = (existing.academic_year || existing.academicYear || '').replace('/', '-');
          return normRowSession === normCurrentSession &&
                 existing.day?.toLowerCase() === dayNorm &&
                 parseInt(existing.period) === parseInt(p.period) &&
                 existing.room?.toLowerCase().trim() === room.toLowerCase() &&
                 !existing.is_break;
        });
        
        if (roomConflict) {
          clashes.push(`Room "${room}" is already reserved for ${roomConflict.grade} on ${day} during Period ${p.period}.`);
        }
      }
    }
  }
  
  return clashes;
}

// @desc    Create timetable (Bulk periods)
// @route   POST /api/timetable
// @access  Private (Admin)
const createTimetable = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'ITSupport') {
    return res.status(403).json({ message: 'Access denied. Only administrators can generate or modify timetables.' });
  }

  const { grade, schedule, class: className } = req.body;
  if (!grade || !schedule) {
    return res.status(400).json({ message: 'Grade and schedule are required' });
  }

  // Fetch current settings
  const allSettings = await supabaseService.getAll('settings');
  const settings = allSettings && allSettings.length > 0 ? allSettings[0] : { current_session: '2024-2025', current_term: '1st' };
  const normCurrentSession = (settings.current_session || '').replace('/', '-');

  // Clash Detection
  if (className !== 'CONFIGURATION' && grade !== 'SYSTEM') {
    const clashes = await checkTimetableClashes({ grade, schedule, settings });
    if (clashes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Schedule Clash: ${clashes[0]}`,
        clashes
      });
    }
  }

  // Clear existing rows first to prevent duplicates
  const existingRows = await supabaseService.getManyByField(COLLECTIONS.TIMETABLE, 'grade', grade);
  const classRows = existingRows.filter(r => {
    const normRowSession = (r.academic_year || r.academicYear || '').replace('/', '-');
    return normRowSession === normCurrentSession && 
           r.term === settings.current_term;
  });
  
  for (const row of classRows) {
    await supabaseService.delete(COLLECTIONS.TIMETABLE, row.id);
  }

  const created = [];
  const daysToProcess = Object.keys(schedule);
  
  for (const day of daysToProcess) {
    const periodArray = Array.isArray(schedule[day]) ? schedule[day] : [];
    for (const period of periodArray) {
      const courseId = period.subjectId || period.subject;
      const teacherId = period.teacherId || period.teacher;
      
      const rowData = {
        academic_year: settings.current_session,
        term: settings.current_term,
        grade,
        day: (day.toLowerCase() === 'periods' || className === 'CONFIGURATION') ? 'monday' : day.toLowerCase(),
        period: period.period,
        start_time: period.startTime || period.time?.split(' - ')[0] || '',
        end_time: period.endTime || period.time?.split(' - ')[1] || '',
        course_id: !period.isBreak && isUUID(courseId) ? courseId : null,
        teacher_id: !period.isBreak && isUUID(teacherId) ? teacherId : null,
        room: period.room || '',
        is_break: period.isBreak || false,
        break_label: period.isBreak ? (period.name || period.break_label || period.breakLabel || period.subject) : null
      };
      const result = await supabaseService.create(COLLECTIONS.TIMETABLE, rowData);
      created.push(result);
    }
  }
  
  res.status(201).json({ success: true, count: created.length });
});

// @desc    Update timetable
// @route   PUT /api/timetable/:id
// @access  Private (Admin)
const updateTimetable = asyncHandler(async (req, res) => {
  const user = req.user;

  // Only Admin can update timetable
  if (user.role !== 'admin' && user.role !== 'superadmin' && user.role !== 'ITSupport') {
    return res.status(403).json({ message: 'Access denied. Only administrators can generate or modify timetables.' });
  }

  const { grade, schedule, class: className } = req.body;
  
  // Fetch current settings
  const allSettings = await supabaseService.getAll('settings');
  const settings = allSettings && allSettings.length > 0 ? allSettings[0] : { current_session: '2024-2025', current_term: '1st' };
  const normCurrentSession = (settings.current_session || '').replace('/', '-');

  // Clash Detection
  if (className !== 'CONFIGURATION' && grade !== 'SYSTEM') {
    const clashes = await checkTimetableClashes({ grade, schedule, settings });
    if (clashes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Schedule Clash: ${clashes[0]}`,
        clashes
      });
    }
  }

  // Delete existing rows for this class/term
  const existingRows = await supabaseService.getManyByField(COLLECTIONS.TIMETABLE, 'grade', grade);
  const classRows = existingRows.filter(r => {
    const normRowSession = (r.academic_year || r.academicYear || '').replace('/', '-');
    return normRowSession === normCurrentSession && 
           r.term === settings.current_term;
  });
  
  for (const row of classRows) {
    await supabaseService.delete(COLLECTIONS.TIMETABLE, row.id);
  }

  // Insert new rows
  const created = [];
  const daysToProcess = Object.keys(schedule);

  for (const day of daysToProcess) {
    const periodArray = Array.isArray(schedule[day]) ? schedule[day] : [];
    for (const period of periodArray) {
      const courseId = period.subjectId || period.subject;
      const teacherId = period.teacherId || period.teacher;

      const rowData = {
        academic_year: settings.current_session,
        term: settings.current_term,
        grade,
        day: (day.toLowerCase() === 'periods' || className === 'CONFIGURATION') ? 'monday' : day.toLowerCase(),
        period: period.period,
        start_time: period.startTime || period.time?.split(' - ')[0] || '',
        end_time: period.endTime || period.time?.split(' - ')[1] || '',
        course_id: !period.isBreak && isUUID(courseId) ? courseId : null,
        teacher_id: !period.isBreak && isUUID(teacherId) ? teacherId : null,
        room: period.room || '',
        is_break: period.isBreak || false,
        break_label: period.isBreak ? (period.name || period.break_label || period.breakLabel || period.subject) : null
      };
      const result = await supabaseService.create(COLLECTIONS.TIMETABLE, rowData);
      created.push(result);
    }
  }

  res.json({ success: true, count: created.length });
});

// @desc    Delete timetable
// @route   DELETE /api/timetable/:id
// @access  Private (Admin)
const deleteTimetable = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'ITSupport') {
    return res.status(403).json({ message: 'Access denied. Only administrators can delete timetables.' });
  }
  // If id is a UUID, delete single period. If it's a class string, delete class timetable.
  if (req.params.id.length > 20) {
    await supabaseService.delete(COLLECTIONS.TIMETABLE, req.params.id);
  } else {
    // Logic to delete by class (grade)
    const grade = req.params.id;
    const allRows = await supabaseService.getManyByField(COLLECTIONS.TIMETABLE, 'grade', grade);
    for (const row of allRows) {
      await supabaseService.delete(COLLECTIONS.TIMETABLE, row.id);
    }
  }
  res.json({ success: true, message: 'Deleted successfully' });
});

// @desc    Delete all timetables
// @route   DELETE /api/timetable/all
// @access  Private (Admin)
const deleteAllTimetables = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'ITSupport') {
    return res.status(403).json({ message: 'Access denied. Only administrators can delete timetables.' });
  }
  const timetables = await supabaseService.getAll(COLLECTIONS.TIMETABLE, { limit: 500 });
  
  if (!timetables || timetables.length === 0) {
    return res.json({ success: true, message: 'No timetables to delete', deletedCount: 0 });
  }
  
  let deletedCount = 0;
  for (const tt of timetables) {
    await supabaseService.delete(COLLECTIONS.TIMETABLE, tt.id);
    deletedCount++;
  }
  
  res.json({ success: true, message: 'All timetables deleted successfully', deletedCount });
});

// @desc    Add period to timetable
// @route   POST /api/timetable/:id/period
// @access  Private (Admin)
const addPeriod = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'ITSupport') {
    return res.status(403).json({ message: 'Access denied. Only administrators can modify timetable periods.' });
  }
  const { day, period, subject, teacher, teacherId, startTime, endTime, room } = req.body;
  if (!day || period === undefined || !subject) {
    return res.status(400).json({ message: 'Day, period number, and subject are required' });
  }
  
  const timetable = await supabaseService.getById(COLLECTIONS.TIMETABLE, req.params.id);
  if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
  
  const schedule = timetable.schedule || {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
  };
  
  const daySchedule = schedule[day] || [];
  const periodIndex = daySchedule.findIndex(p => p.period === period);
  
  if (periodIndex >= 0) {
    daySchedule[periodIndex] = { period, subject, teacher, teacherId, startTime, endTime, room };
  } else {
    daySchedule.push({ period, subject, teacher, teacherId, startTime, endTime, room });
    daySchedule.sort((a, b) => a.period - b.period);
  }
  
  schedule[day] = daySchedule;
  
  const result = await supabaseService.update(COLLECTIONS.TIMETABLE, req.params.id, { schedule });
  res.json({ success: true, data: result });
});

// @desc    Remove period from timetable
// @route   DELETE /api/timetable/:id/period
// @access  Private (Admin)
const removePeriod = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'ITSupport') {
    return res.status(403).json({ message: 'Access denied. Only administrators can modify timetable periods.' });
  }
  const { day, period } = req.body;
  if (!day || period === undefined) {
    return res.status(400).json({ message: 'Day and period number are required' });
  }
  
  const timetable = await supabaseService.getById(COLLECTIONS.TIMETABLE, req.params.id);
  if (!timetable) return res.status(404).json({ message: 'Timetable not found' });
  
  const schedule = timetable.schedule || {
    Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: []
  };
  
  const daySchedule = schedule[day] || [];
  schedule[day] = daySchedule.filter(p => p.period !== period);
  
  const result = await supabaseService.update(COLLECTIONS.TIMETABLE, req.params.id, { schedule });
  res.json({ success: true, data: result });
});

// @desc    Auto-generate timetable with curriculum courses and teachers
// @route   POST /api/timetable/auto-generate
// @access  Private (Admin)
const autoGenerateTimetable = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && req.user.role !== 'ITSupport') {
    return res.status(403).json({ message: 'Access denied. Only administrators can generate timetables.' });
  }

  const { grade } = req.body;
  if (!grade) {
    return res.status(400).json({ message: 'Target grade is required for timetable generation.' });
  }

  // Fetch current academic settings
  const allSettings = await supabaseService.getAll('settings');
  const settings = allSettings && allSettings.length > 0 ? allSettings[0] : { current_session: '2024-2025', current_term: '1st' };
  const currentSession = settings.current_session || '2024-2025';
  const currentTerm = settings.current_term || '1st';

  const DEFAULT_PERIODS = [
    { period: 0, startTime: '07:30', endTime: '08:10', time: '07:30 - 08:10', name: 'Morning Assembly', isBreak: true },
    { period: 1, startTime: '08:10', endTime: '08:55', time: '08:10 - 08:55', name: 'Period 1', isBreak: false },
    { period: 2, startTime: '08:55', endTime: '09:40', time: '08:55 - 09:40', name: 'Period 2', isBreak: false },
    { period: 3, startTime: '09:40', endTime: '10:10', time: '09:40 - 10:10', name: 'Break', isBreak: true },
    { period: 4, startTime: '10:10', endTime: '10:55', time: '10:10 - 10:55', name: 'Period 3', isBreak: false },
    { period: 5, startTime: '10:55', endTime: '11:40', time: '10:55 - 11:40', name: 'Period 4', isBreak: false },
    { period: 6, startTime: '11:40', endTime: '12:10', time: '11:40 - 12:10', name: 'Break', isBreak: true },
    { period: 7, startTime: '12:10', endTime: '12:55', time: '12:10 - 12:55', name: 'Period 5', isBreak: false },
    { period: 8, startTime: '12:55', endTime: '13:40', time: '12:55 - 13:40', name: 'Period 6', isBreak: false },
    { period: 9, startTime: '13:40', endTime: '14:25', time: '13:40 - 14:25', name: 'Period 7', isBreak: false },
    { period: 10, startTime: '14:25', endTime: '15:00', time: '14:25 - 15:00', name: 'Dismissal', isBreak: true },
  ];

  // Fetch period schema
  let configPeriods = DEFAULT_PERIODS;
  const configRes = await supabaseService.query(COLLECTIONS.TIMETABLE, 'grade', '==', 'SYSTEM');
  if (configRes && configRes.length > 0) {
    const configRows = configRes.filter(r => r.day?.toLowerCase() === 'monday');
    if (configRows.length > 0) {
      configPeriods = configRows.map(r => ({
        period: r.period,
        startTime: r.start_time,
        endTime: r.end_time,
        time: `${r.start_time} - ${r.end_time}`,
        name: r.break_label || (r.is_break ? 'Break' : `Period ${r.period}`),
        isBreak: r.is_break
      })).sort((a, b) => a.period - b.period);
    }
  }

  // Fetch courses assigned to this grade
  const { data: allCourses } = await supabase
    .from(COLLECTIONS.CLASS_SUBJECTS)
    .select('id, class_id, subject_id, teacher_id, class:class_id(name), subject:subject_id(name), teacher:teacher_id(id, first_name, last_name)');

  const classCourses = (allCourses || []).filter(c => c.class?.name?.toLowerCase().trim() === grade.toLowerCase().trim());

  if (classCourses.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: `No courses or subjects allocated to ${grade} yet. Please allocate subjects in Courses management first.` 
    });
  }

  // Fetch existing timetables across other classes to prevent educator clashes
  const { data: allOtherTimetable } = await supabase
    .from(COLLECTIONS.TIMETABLE)
    .select('day, period, teacher_id, grade')
    .eq('term', currentTerm)
    .neq('grade', grade);

  const busyMap = new Set();
  (allOtherTimetable || []).forEach(row => {
    if (row.teacher_id && !row.is_break) {
      busyMap.add(`${row.day?.toLowerCase()}-${row.period}-${row.teacher_id}`);
    }
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const newSchedule = { Monday: [], Tuesday: [], Wednesday: [], Thursday: [], Friday: [] };

  const lessonPeriods = configPeriods.filter(p => !p.isBreak);
  const breakPeriods = configPeriods.filter(p => p.isBreak);

  // Insert break periods across all days
  breakPeriods.forEach(p => {
    days.forEach(day => {
      newSchedule[day].push({
        period: p.period,
        subject: p.name,
        isBreak: true,
        startTime: p.startTime || p.time?.split(' - ')[0] || '',
        endTime: p.endTime || p.time?.split(' - ')[1] || ''
      });
    });
  });

  // Distribute courses across the week with priority for Core subjects
  const isCore = (name) => {
    const n = (name || '').toLowerCase();
    return n.includes('math') || n.includes('english') || n.includes('science') || n.includes('literacy');
  };

  let coursePool = [];
  classCourses.forEach(c => {
    const subName = c.subject?.name || '';
    const weight = isCore(subName) ? 5 : 3;
    for (let i = 0; i < weight; i++) {
      coursePool.push(c);
    }
  });

  let poolIndex = 0;
  let allocatedCount = 0;

  days.forEach((day) => {
    const dayNorm = day.toLowerCase();
    const subjectsOnDay = new Set();

    lessonPeriods.forEach((p) => {
      let chosenCourse = null;
      let attempts = 0;

      while (attempts < coursePool.length) {
        const candidate = coursePool[(poolIndex + attempts) % coursePool.length];
        const teacherId = candidate.teacher_id;
        const candidateSub = candidate.subject?.name || candidate.id;

        const isClashing = teacherId && busyMap.has(`${dayNorm}-${p.period}-${teacherId}`);
        const alreadyOnDay = subjectsOnDay.has(candidateSub);

        if (!isClashing && (!alreadyOnDay || attempts > Math.floor(coursePool.length / 2))) {
          chosenCourse = candidate;
          poolIndex = (poolIndex + attempts + 1) % coursePool.length;
          break;
        }
        attempts++;
      }

      if (!chosenCourse) {
        chosenCourse = coursePool[poolIndex % coursePool.length];
        poolIndex = (poolIndex + 1) % coursePool.length;
      }

      const teacherName = chosenCourse.teacher 
        ? `${chosenCourse.teacher.first_name} ${chosenCourse.teacher.last_name}`.trim() 
        : '';

      const subjectName = chosenCourse.subject?.name || 'Academic Subject';
      subjectsOnDay.add(subjectName);

      if (chosenCourse.teacher_id) {
        busyMap.add(`${dayNorm}-${p.period}-${chosenCourse.teacher_id}`);
      }

      newSchedule[day].push({
        period: p.period,
        subjectId: chosenCourse.id,
        subject: subjectName,
        teacher: teacherName,
        teacherId: chosenCourse.teacher_id || null,
        room: `Room ${grade}`,
        startTime: p.startTime || p.time?.split(' - ')[0] || '',
        endTime: p.endTime || p.time?.split(' - ')[1] || ''
      });
      allocatedCount++;
    });

    newSchedule[day].sort((a, b) => a.period - b.period);
  });

  // Save to database
  const existingRows = await supabaseService.getManyByField(COLLECTIONS.TIMETABLE, 'grade', grade);
  const classRows = existingRows.filter(r => r.term === currentTerm);
  for (const row of classRows) {
    await supabaseService.delete(COLLECTIONS.TIMETABLE, row.id);
  }

  for (const day of days) {
    const dayPeriods = newSchedule[day] || [];
    for (const item of dayPeriods) {
      const rowData = {
        academic_year: currentSession,
        term: currentTerm,
        grade,
        day: day.toLowerCase(),
        period: item.period,
        start_time: item.startTime,
        end_time: item.endTime,
        course_id: item.isBreak ? null : item.subjectId,
        teacher_id: item.isBreak ? null : item.teacherId,
        room: item.room || '',
        is_break: item.isBreak || false,
        break_label: item.isBreak ? item.subject : null
      };
      await supabaseService.create(COLLECTIONS.TIMETABLE, rowData);
    }
  }

  res.json({
    success: true,
    message: `Timetable for ${grade} auto-generated successfully with ${allocatedCount} lessons across 5 days.`,
    data: {
      grade,
      schedule: newSchedule,
      allocatedLessons: allocatedCount
    }
  });
});

module.exports = {
  getAllTimetables,
  getTimetableById,
  getTimetableByClass,
  getTimetablesByGrade,
  getTimetableByTeacher,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  deleteAllTimetables,
  addPeriod,
  removePeriod,
  autoGenerateTimetable
};

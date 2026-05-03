const { supabaseService, COLLECTIONS } = require('../services/supabaseService');
const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/errorMiddleware');

const toOrdinal = (num) => {
  const n = Number(num);
  if (!n || n <= 0) return '-';
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n}st`;
  if (mod10 === 2 && mod100 !== 12) return `${n}nd`;
  if (mod10 === 3 && mod100 !== 13) return `${n}rd`;
  return `${n}th`;
};

const getInterpretation = (score) => {
  const s = Number(score);
  if (s >= 90) return 'Highest';
  if (s >= 80) return 'Higher';
  if (s >= 70) return 'High';
  if (s >= 60) return 'High Average';
  if (s >= 55) return 'Average';
  if (s >= 50) return 'Lower Average';
  if (s >= 40) return 'Low';
  if (s >= 35) return 'Lower';
  return 'Lowest';
};

const fallbackGradeBand = (score) => {
  const s = Number(score);
  if (s >= 90) return 'A';
  if (s >= 80) return 'B';
  if (s >= 70) return 'C';
  if (s >= 60) return 'D';
  if (s >= 55) return 'E';
  if (s >= 50) return 'F';
  if (s >= 40) return 'G';
  if (s >= 35) return 'H';
  return 'I';
};

const getGradeValue = (score) => {
  const s = Number(score);
  if (s >= 90) return 1;
  if (s >= 80) return 2;
  if (s >= 70) return 3;
  if (s >= 60) return 4;
  if (s >= 55) return 5;
  if (s >= 50) return 6;
  if (s >= 40) return 7;
  if (s >= 35) return 8;
  return 9;
};

const aggregateYearlyGrades = (grades) => {
  const grouped = {};
  grades.forEach((grade) => {
    const key = grade.course || grade.courseName || grade.subject;
    if (!key) return;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(grade);
  });

  return Object.values(grouped).map((courseGrades) => {
    const sample = courseGrades[0];
    const avg = (field) => Math.round(courseGrades.reduce((sum, g) => sum + Number(g[field] || 0), 0) / courseGrades.length);
    const classScore = avg('classwork') + avg('homework');
    const examScore = avg('final');
    const total = Math.round(
      courseGrades.reduce((sum, g) => sum + Number(g.total ?? (Number(g.classwork || 0) + Number(g.homework || 0) + Number(g.final || 0))), 0) / courseGrades.length
    );
    return {
      ...sample,
      classwork: classScore,
      homework: 0,
      final: examScore,
      total
    };
  });
};

const mapSubjectRows = (grades) => {
  const rows = grades.map((grade) => {
    // Assessments are stored in a JSON field in Supabase
    const assessments = grade.assessments || {};
    const classScore = Number(assessments.classwork || 0) + Number(assessments.homework || 0) + Number(assessments.midterm || 0);
    const examScore = Number(assessments.finalExam || assessments.final || 0);
    const total = Number(grade.total_score ?? grade.total ?? (classScore + examScore));
    
    return {
      name: grade.course_name || grade.subject_name || 'Subject',
      classScore,
      examScore,
      total,
      position: toOrdinal(grade.position),
      grade: grade.letter_grade || grade.grade || fallbackGradeBand(total),
      interpretation: getInterpretation(total)
    };
  });
  rows.sort((a, b) => b.total - a.total);
  return rows;
};

const buildStudentReportPayload = async ({ student, reportType, term: rawTerm, academicYear, month }) => {
  const supabase = require('../config/supabase');
  
  // Normalize term (e.g., "FIRST TERM" -> "1st")
  const normalizeTerm = (t) => {
    const termStr = String(t).toLowerCase();
    if (termStr.includes('first')) return '1st';
    if (termStr.includes('second')) return '2nd';
    if (termStr.includes('third')) return '3rd';
    return t;
  };
  const term = normalizeTerm(rawTerm);

  // 1. Fetch Class ID with normalization
  let classId = student.class_id;
  if (student.grade) {
    const { data: allClasses } = await supabase.from(COLLECTIONS.ACADEMIC_CLASSES).select('id, name');
    const targetGrade = String(student.grade).toLowerCase().trim();
    
    const clean = (s) => s.toLowerCase().replace(/basic|primary|kindergarten|kg/g, '').trim();
    const targetClean = clean(targetGrade);

    const matchedClass = allClasses?.find(c => {
      const dbName = String(c.name).toLowerCase().trim();
      return dbName === targetGrade || 
             dbName === targetGrade.replace('basic', 'primary') ||
             dbName === targetGrade.replace('primary', 'basic') ||
             dbName === targetGrade.replace('kg', 'kindergarten') ||
             dbName === targetGrade.replace('kindergarten', 'kg') ||
             clean(dbName) === targetClean;
    });
    
    if (matchedClass) classId = matchedClass.id;
  }

  // 2. Fetch All Subjects for this Class Level (Highly Aggressive Discovery)
  let classSubjects = [];
  try {
    // Strategy A: Fetch via Class-Subject Relationship
    const { data: allDefinitions } = await supabase.from(COLLECTIONS.CLASS_SUBJECTS)
      .select('*, subject:subject_id(id, name, category), class:class_id(name)');
    
    if (allDefinitions && allDefinitions.length > 0) {
      const targetGrade = String(student.grade || '').toLowerCase().trim();
      const targetSec = String(student.section || '').replace(/section\s*/i, '').trim().toLowerCase();
      
      const clean = (s) => s.toLowerCase().replace(/basic|primary|kindergarten|kg/g, '').trim();
      const targetClean = clean(targetGrade);

      // Filter for this specific class level
      let matched = allDefinitions.filter(d => {
        const dbClassName = String(d.class?.name || '').toLowerCase().trim();
        return (classId && d.class_id === classId) || 
               dbClassName === targetGrade || 
               dbClassName === targetGrade.replace('basic', 'primary') ||
               dbClassName === targetGrade.replace('primary', 'basic') ||
               dbClassName === targetGrade.replace('kg', 'kindergarten') ||
               dbClassName === targetGrade.replace('kindergarten', 'kg') ||
               clean(dbClassName) === targetClean;
      });

      // Collect all subjects for this grade level across all sections
      classSubjects = matched;
    }

    // Strategy B: Fallback to Courses table (Active Teaching Assignments)
    if (classSubjects.length === 0 && student.grade) {
      const { data: courseData } = await supabase.from(COLLECTIONS.COURSES)
        .select('*')
        .ilike('grade', `%${student.grade}%`);
      
      if (courseData && courseData.length > 0) {
        const courseSubjects = courseData.map(c => ({
          subject: { name: c.name, category: c.category || 'CORE' },
          section: c.section,
          academic_year: c.academic_year
        }));
        classSubjects = [...classSubjects, ...courseSubjects];
      }
    }

    // Strategy C: Final Global Recovery
    if (classSubjects.length === 0) {
       const { data: fallbackSubjects } = await supabase.from(COLLECTIONS.SUBJECTS)
         .select('id, name, category');
       
       if (fallbackSubjects) {
         const commonCores = [
           'Mathematics', 'English', 'Science', 'Social Studies', 'ICT', 'French', 'RME', 'Creative Arts', 'History',
           'Numeracy', 'Literacy', 'Environmental Studies', 'Our World Our People', 'Religious and Moral Education'
         ];
         classSubjects = fallbackSubjects
           .filter(s => commonCores.some(core => s.name.toLowerCase().includes(core.toLowerCase())))
           .map(s => ({ subject: s }));
       }
    }

    // Final Cleanup and Deduplication
    const seen = new Set();
    classSubjects = classSubjects.filter(item => {
      const name = item.subject?.name;
      if (!name || seen.has(name.toLowerCase().trim())) return false;
      seen.add(name.toLowerCase().trim());
      return true;
    });

  } catch (err) {
    console.error('Subject Discovery Failure:', err.message);
  }

  // 3. Fetch Student Grades for this term with flexible term matching
  const termVariants = [term, rawTerm];
  if (term === '1st') termVariants.push('First Term', 'Term 1');
  if (term === '2nd') termVariants.push('Second Term', 'Term 2');
  if (term === '3rd') termVariants.push('Third Term', 'Term 3');

  let gradesQuery = supabase.from(COLLECTIONS.GRADES)
    .select('*')
    .eq('student_id', student.id)
    .in('term', termVariants);
  
  if (academicYear) gradesQuery = gradesQuery.eq('academic_year', academicYear);
  
  let { data: gradesData } = await gradesQuery;
  const grades = gradesData || [];

  // Subject Category Helper
  const getSubjectCategory = (subject) => {
    if (subject?.category) {
      const cat = String(subject.category).toUpperCase();
      if (cat.includes('CORE')) return 'CORE';
      if (cat.includes('ELECTIVE')) return 'ELECTIVE';
    }
    const coreKeywords = [
      'MATH', 'ENGLISH', 'SCIENCE', 'SOCIAL', 'ICT', 'RME', 'RELIGIOUS', 'OWOP', 
      'ARTS', 'FRENCH', 'GHANAIAN', 'PHYSICAL', 'HISTORY', 'COMPUTING', 'OUR WORLD'
    ];
    const upperName = String(subject?.name || '').toUpperCase();
    return coreKeywords.some(key => upperName.includes(key)) ? 'CORE' : 'ELECTIVE';
  };

  // 4. Robust Subject Merging: Use class definition OR actual grades found
  const subjectMap = new Map();

  // Add from Class Subjects first (the template)
  classSubjects.forEach(cs => {
    const sName = cs.subject?.name || 'Unknown Subject';
    subjectMap.set(sName, {
      id: cs.subject_id || cs.id,
      name: sName,
      category: getSubjectCategory(cs.subject),
      isFromDefinition: true
    });
  });

  // Add from Grades (in case subjects are not in definition or names are missing)
  const unknownGradeCourseIds = grades
    .filter(g => !g.course_name && !g.subject_name)
    .map(g => g.course_id)
    .filter(id => id);

  let gradeSubjectNames = [];
  if (unknownGradeCourseIds.length > 0) {
    const { data: gsData } = await supabase.from(COLLECTIONS.CLASS_SUBJECTS)
      .select('id, subject:subject_id(name, category)')
      .in('id', unknownGradeCourseIds);
    gradeSubjectNames = gsData || [];
  }

  grades.forEach(g => {
    const gsDetail = gradeSubjectNames.find(gs => String(gs.id) === String(g.course_id));
    const sName = g.course_name || g.subject_name || gsDetail?.subject?.name || 'Unknown Subject';
    
    if (!subjectMap.has(sName)) {
      subjectMap.set(sName, {
        id: g.course_id,
        name: sName,
        category: getSubjectCategory(gsDetail?.subject || { name: sName }),
        isFromDefinition: false
      });
    }
  });

  const mergedSubjects = [];
  for (const sInfo of subjectMap.values()) {
    const grade = grades.find(g => 
      (g.course_id && String(g.course_id) === String(sInfo.id)) || 
      (g.course_name && g.course_name === sInfo.name) ||
      (g.subject_name && g.subject_name === sInfo.name) ||
      (gradeSubjectNames.find(gs => String(gs.id) === String(g.course_id))?.subject?.name === sInfo.name)
    );
    
    // Calculate scores from various possible structures
    let classScore = 0;
    let examScore = 0;

    const assessments = grade?.assessments;
    if (Array.isArray(assessments)) {
      // Handle array structure from bulkCreateGrades
      const cs = assessments.find(a => /class/i.test(a.name));
      const es = assessments.find(a => /exam/i.test(a.name) || /final/i.test(a.name));
      classScore = Number(cs?.score || 0);
      examScore = Number(es?.score || 0);
    } else if (assessments && typeof assessments === 'object') {
      // Handle object structure from seed or manual entry
      classScore = Number(assessments.classwork || 0) + Number(assessments.homework || 0) + Number(assessments.midterm || 0);
      examScore = Number(assessments.finalExam || assessments.final || 0);
    }

    // Fallback to direct columns if available
    classScore = grade?.class_score ?? classScore;
    examScore = grade?.exam_score ?? examScore;
    
    const total = Number(grade?.total_score ?? (classScore + examScore));

    // Dynamic position calculation if not provided
    let subjectPosition = grade?.position;
    if (!subjectPosition && total > 0 && sInfo.id) {
      try {
        const { count: higherScores } = await supabase.from(COLLECTIONS.GRADES)
          .select('*', { count: 'exact', head: true })
          .eq('course_id', sInfo.id)
          .in('term', termVariants)
          .in('academic_year', [academicYear, academicYear?.replace('/', '-'), academicYear?.replace('-', '/')].filter(Boolean))
          .gt('total_score', total);
        
        subjectPosition = (higherScores || 0) + 1;
      } catch (e) {
        console.warn('Failed to calculate dynamic rank:', e.message);
      }
    }

    mergedSubjects.push({
      name: sInfo.name,
      category: sInfo.category,
      classScore: classScore || 0,
      examScore: examScore || 0,
      total: total || 0,
      position: toOrdinal(subjectPosition),
      grade: grade?.letter_grade || (total > 0 ? fallbackGradeBand(total) : '--'),
      gradeValue: total > 0 ? getGradeValue(total) : '--',
      interpretation: total > 0 ? getInterpretation(total) : '--'
    });
  }

  const totalAggregate = mergedSubjects.reduce((sum, s) => sum + Number(s.total || 0), 0);

  // 5. Fetch Attendance Summary
  let attendanceQuery = supabase.from(COLLECTIONS.ATTENDANCE)
    .select('status')
    .eq('student_id', student.id)
    .in('term', termVariants);
    
  if (academicYear) {
    const y1 = academicYear.replace('/', '-');
    const y2 = academicYear.replace('-', '/');
    attendanceQuery = attendanceQuery.in('academic_year', [academicYear, y1, y2]);
  }
  
  const { data: attendanceData } = await attendanceQuery;
  const attendancePresent = attendanceData ? attendanceData.filter(r => ['present', 'Present', 'late', 'Late'].includes(r.status)).length : 0;
  
  // 6. Fetch Report Card Metadata (Remarks, Conduct, etc.)
  let reportMetadata = {};
  try {
    const { data: meta } = await supabase.from('report_cards')
      .select('*')
      .eq('student_id', student.id)
      .in('term', termVariants)
      .maybeSingle();
    if (meta) reportMetadata = meta;
  } catch (e) {}

  // 7. Fetch School Settings & Total Days
  const allSettings = await supabaseService.getAll('settings');
  const settings = (allSettings && allSettings.length > 0) ? allSettings[0] : {};
  const schoolName = settings.school_name || 'UHAS BASIC SCHOOL';
  const totalSchoolDays = settings.total_days || reportMetadata.total_days || (attendanceData ? attendanceData.length : 0);

  // 8. Fallback Remarks from Grades
  if (!reportMetadata.teacher_remarks && grades.length > 0) {
    const remarkGrade = grades.find(g => g.teacher_remarks || g.remarks);
    reportMetadata.teacher_remarks = remarkGrade?.teacher_remarks || remarkGrade?.remarks;
  }

  // 9. Fetch Class Master Name
  let teacherName = 'CLASS TEACHER';
  try {
    const { data: sectionInfo } = await supabase.from(COLLECTIONS.SECTIONS)
      .select('teacher:class_master_id(first_name, last_name), class_id')
      .eq('name', student.section);
      
    let bestSection = sectionInfo?.find(s => s.class_id === classId) || sectionInfo?.[0];
    if (bestSection?.teacher) {
      teacherName = `${bestSection.teacher.first_name} ${bestSection.teacher.last_name}`;
    }
  } catch (e) {}

  // 10. Calculate Class Position (Rank)
  let classPosition = '--';
  try {
    const { data: sectionStudents } = await supabase.from(COLLECTIONS.STUDENTS)
      .select('id')
      .eq('grade', student.grade)
      .eq('section', student.section);
    
    if (sectionStudents && sectionStudents.length > 0) {
      const studentIds = sectionStudents.map(s => s.id);
      const { data: allGrades } = await supabase.from(COLLECTIONS.GRADES)
        .select('student_id, total_score')
        .in('student_id', studentIds)
        .in('term', termVariants)
        .eq('academic_year', academicYear);
      
      const studentAggregates = {};
      allGrades?.forEach(g => {
        studentAggregates[g.student_id] = (studentAggregates[g.student_id] || 0) + Number(g.total_score || 0);
      });
      
      const sortedAggregates = Object.entries(studentAggregates)
        .map(([id, agg]) => ({ id, agg }))
        .sort((a, b) => b.agg - a.agg);
      
      const rank = sortedAggregates.findIndex(s => s.id === student.id) + 1;
      if (rank > 0) {
        classPosition = `${toOrdinal(rank)} of ${sectionStudents.length}`;
      }
    }
  } catch (e) {}

  mergedSubjects.sort((a, b) => b.total - a.total);

  return {
    schoolName: schoolName.toUpperCase(),
    studentId: student.id,
    studentName: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
    admissionNumber: student.admission_number || 'N/A',
    gender: student.gender || 'N/A',
    class: student.grade || 'N/A',
    section: student.section || 'N/A',
    year: academicYear || '2024-2025',
    term: rawTerm.toUpperCase(),
    month: month?.toUpperCase() || 'N/A',
    date: new Date().toLocaleDateString(),
    aggregate: mergedSubjects.reduce((sum, row) => sum + Number(row.total || 0), 0),
    classPosition,
    subjects: mergedSubjects.filter(s => s.category === 'CORE'),
    electives: mergedSubjects.filter(s => s.category === 'ELECTIVE'),
    attendance: attendancePresent > 0 ? attendancePresent : '--',
    totalDays: totalSchoolDays > 0 ? totalSchoolDays : '--',
    conduct: (reportMetadata.conduct || student.conduct || 'VERY GOOD').toUpperCase(),
    attitude: (reportMetadata.attitude || student.attitude || 'CONSISTENT').toUpperCase(),
    interest: (reportMetadata.interest || student.interest || 'ACADEMIC EXCELLENCE').toUpperCase(),
    teacherRemarks: reportMetadata.teacher_remarks || 'A very good performance. Keep it up.',
    teacherName: teacherName.toUpperCase()
  };
};

// @desc    Generate student report payload
// @route   GET /api/reports/student/:studentId
// @access  Private
const getStudentReport = asyncHandler(async (req, res) => {
  const { studentId } = req.params;
  const { reportType, type, term = 'First Term', academicYear, month } = req.query;
  const finalReportType = reportType || type || 'mid-term';

  const student = await supabaseService.getById(COLLECTIONS.STUDENTS, studentId);
  if (!student) {
    return res.status(404).json({ message: 'Student not found' });
  }

  // Security check for teachers
  const user = req.user;
  if (user.role === 'teacher' || user.role === 'staff') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
    if (!teacherProfile) return res.status(403).json({ message: 'Teacher profile not found' });
    
    // Check if the student belongs to any of the teacher's courses
    const teacherCourses = await supabaseService.getAll(COLLECTIONS.COURSES);
    const assignedCourses = teacherCourses.filter(c => c.teacher_id === teacherProfile.id);
    
    const assignedStudentIds = new Set();
    assignedCourses.forEach(c => {
      const ids = c.student_ids || [];
      ids.forEach(id => assignedStudentIds.add(id));
    });

    if (!assignedStudentIds.has(studentId)) {
      return res.status(403).json({ message: 'Access denied. You can only generate reports for your own students.' });
    }
  }

  const reportData = await buildStudentReportPayload({ student, reportType: finalReportType, term, academicYear, month });
  const allStudents = await supabaseService.getAll(COLLECTIONS.STUDENTS, { limit: 2000 });
  const sectionCount = allStudents.filter((s) => s.grade === student.grade && s.section === student.section).length || '-';
  reportData.numberOnRoll = sectionCount;

  res.json({
    success: true,
    data: reportData
  });
});

// @desc    Generate class-level report payload (bulk)
// @route   GET /api/reports/class/:grade
// @access  Private
const getClassReport = asyncHandler(async (req, res) => {
  const { grade } = req.params;
  const { reportType, type, term = 'First Term', academicYear, month, section } = req.query;
  const finalReportType = reportType || type || 'mid-term';
  const user = req.user;

  // Security check for teachers
  if (user.role === 'teacher' || user.role === 'staff') {
    const teacherProfile = await supabaseService.getByField(COLLECTIONS.TEACHERS, 'user_id', user.id);
    if (!teacherProfile) return res.status(403).json({ message: 'Teacher profile not found' });
    
    // Check if the grade requested is one the teacher teaches
    const teacherCourses = await supabaseService.getAll(COLLECTIONS.COURSES);
    const hasAssignedGrade = teacherCourses.some(c => 
      c.teacher_id === teacherProfile.id && c.grade === grade
    );

    if (!hasAssignedGrade) {
      return res.status(403).json({ message: 'Access denied. You can only generate class reports for classes you handle.' });
    }
  }

  const gradeName = String(grade).toLowerCase();
  const gradeNumber = gradeName.replace(/basic|primary|kindergarten|kg/g, '').trim();
  
  const possibleNames = [
    gradeName,
    gradeName.replace('primary', 'basic'),
    gradeName.replace('basic', 'primary'),
    gradeName.replace('primary ', 'basic '),
    gradeName.replace('basic ', 'primary '),
    gradeNumber // Also try just the number (e.g. "3" for "Basic 3")
  ];

  const { data: studentsData } = await supabase.from(COLLECTIONS.STUDENTS)
    .select('*');
  
  let students = studentsData || [];
  
  // Robust case-insensitive filtering for grade
  const searchNames = possibleNames.map(n => n.toLowerCase().trim());
  students = students.filter(s => {
    const sGrade = String(s.grade || '').toLowerCase().trim();
    const sGradeNumber = sGrade.replace(/basic|primary|kindergarten|kg/g, '').trim();
    return searchNames.includes(sGrade) || (gradeNumber && sGradeNumber === gradeNumber);
  });
  
  if (section) {
    const targetSec = String(section).toLowerCase().replace('section', '').trim();
    students = students.filter(s => {
      const dbSec = String(s.section || '').toLowerCase().replace('section', '').trim();
      return dbSec === targetSec || String(s.section || '').toLowerCase() === String(section).toLowerCase();
    });
  }
  
  // Remove academicYear filtering for students - we only care about their current grade/section
  // and we will filter THEIR GRADES by academicYear later in buildStudentReportPayload.

  students.sort((a, b) => `${a.last_name || ''}${a.first_name || ''}`.localeCompare(`${b.last_name || ''}${b.first_name || ''}`));

  const reports = [];
  for (const student of students) {
    const payload = await buildStudentReportPayload({ student, reportType: finalReportType, term, academicYear, month });
    payload.numberOnRoll = students.length;
    reports.push(payload);
  }

  const classAverage = reports.length
    ? Number((reports.reduce((sum, r) => sum + Number(r.aggregate || 0), 0) / reports.length).toFixed(2))
    : 0;

  res.json({
    success: true,
    data: {
      grade,
      reportType,
      term: reportType === 'end-year' ? 'YEARLY' : String(term).toUpperCase(),
      academicYear: academicYear || 'N/A',
      totalStudents: reports.length,
      classAverage,
      reports
    }
  });
});

module.exports = {
  getStudentReport,
  getClassReport
};

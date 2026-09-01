require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const courseRoutes = require('./routes/courseRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const parentRoutes = require('./routes/parentRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const eventRoutes = require('./routes/eventRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const staffRoutes = require('./routes/staffRoutes');
const auditRoutes = require('./routes/auditRoutes');

const dashboardRoutes = require('./routes/dashboardRoutes');
const examRoutes = require('./routes/examRoutes');
const gradeMasterRoutes = require('./routes/gradeMasterRoutes');
const classRoutes = require('./routes/classRoutes');

const subjectRoutes = require('./routes/subjectRoutes');
const academicCalendarRoutes = require('./routes/academicCalendarRoutes');
const aiRoutes = require('./routes/aiRoutes');
const smsRoutes = require('./routes/smsRoutes');


const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');

// Simple CORS — Bearer token auth doesn't require withCredentials
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'School Management API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/grades/masters', gradeMasterRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/parents', parentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/classes', classRoutes);

app.use('/api/subjects', subjectRoutes);
app.use('/api/academic-calendar', academicCalendarRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sms', smsRoutes);



// List all system users — Admin & Staff only
const { auth: authMiddleware } = require('./middleware/authMiddleware');
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const userRole = String(req.user?.role || '').toLowerCase();
    if (!['admin', 'administrator', 'itsupport', 'staff'].includes(userRole)) {
      return res.status(403).json({ success: false, message: 'Access denied. Administrator clearance required.' });
    }

    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      console.error('[ERROR] Supabase users query failed:', error);
      throw error;
    }

    const sanitized = (data || []).map(u => ({
      id: u.id,
      email: u.email || '',
      first_name: u.first_name || u.firstName || u.name?.split(' ')[0] || '',
      last_name: u.last_name || u.lastName || u.name?.split(' ').slice(1).join(' ') || '',
      role: u.role || 'User',
      is_active: u.is_active !== false && u.isActive !== false,
      created_at: u.created_at || u.createdAt || null,
      last_login: u.last_login || u.lastLogin || null
    }));

    res.json({ success: true, data: sanitized });
  } catch (err) {
    console.error('[ERROR] /api/users endpoint failed:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

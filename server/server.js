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
const sectionRoutes = require('./routes/sectionRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const academicCalendarRoutes = require('./routes/academicCalendarRoutes');
const aiRoutes = require('./routes/aiRoutes');


const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

const path = require('path');

// Custom robust CORS middleware for cookies and cross-origin security
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://school-mng-sys-ygw-client.vercel.app'
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'School Management API is running' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/debug/eval', async (req, res) => {
  const { code } = req.body;
  try {
    const supabase = require('./config/supabase');
    const { supabaseService, COLLECTIONS } = require('./services/supabaseService');
    const result = await eval(`(async () => { ${code} })()`);
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, stack: err.stack });
  }
});

app.post('/api/debug/fix-password', async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  
  const hashed = await bcrypt.hash(password, 10);
  const { error } = await supabase.from('users').update({ password: hashed }).eq('email', email.toLowerCase());
  if (error) return res.status(500).json({ message: error.message });
  
  res.json({ message: 'Password updated', email });
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
app.use('/api/sections', sectionRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/academic-calendar', academicCalendarRoutes);
app.use('/api/ai', aiRoutes);



app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;

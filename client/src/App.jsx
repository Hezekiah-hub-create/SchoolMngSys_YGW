import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Login from './pages/Login/Login';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import TeacherDashboard from './pages/Dashboard/TeacherDashboard';
import StudentDashboard from './pages/Dashboard/StudentDashboard';
import ParentDashboard from './pages/Dashboard/ParentDashboard';
import FinanceDashboard from './pages/Dashboard/FinanceDashboard';
import ITSupportDashboard from './pages/Dashboard/ITSupportDashboard';
import AdmissionDashboard from './pages/Dashboard/AdmissionDashboard';
import Students from './pages/Students/Students';
import AddStudent from './pages/Students/AddStudent/AddStudent';
import StudentProfile from './pages/Students/StudentProfile/StudentProfile';
import PromoteStudents from './pages/Students/PromoteStudents/PromoteStudents';
import Teachers from './pages/Teachers/Teachers';
import AddTeacher from './pages/Teachers/AddTeacher/AddTeacher';
import TeacherProfile from './pages/Teachers/TeacherProfile/TeacherProfile';
import Courses from './pages/Courses/Courses';
import Classes from './pages/Classes/Classes';
import Subjects from './pages/Subjects/Subjects';
import Timetable from './pages/Timetable/Timetable';
import Calendar from './pages/Calendar/Calendar';
import Attendance from './pages/Attendance/Attendance';
import Parents from './pages/Parents/Parents';
import ParentProfile from './pages/Parents/ParentProfile/ParentProfile';
import Assignments from './pages/Assignments/Assignments';
import Announcements from './pages/Announcements/Announcements';

import Results from './pages/Results/Results';
import ExamSchedule from './pages/Exams/ExamSchedule/ExamSchedule';
import MarksEntry from './pages/Exams/MarksEntry/MarksEntry';
import ExamResults from './pages/Exams/ExamResults/ExamResults';
import Fees from './pages/Fees/Fees';
import FeesStructure from './pages/Fees/FeesStructure/FeesStructure';
import FeesCollection from './pages/Fees/FeesCollection/FeesCollection';
import Expenses from './pages/Fees/Expenses/Expenses';
import Income from './pages/Fees/Income/Income';
import SettingsGeneral from './pages/Settings/General/General';
import SettingsAcademic from './pages/Settings/Academic/Academic';
import SettingsUsers from './pages/Settings/Users/Users';
import SettingsRoles from './pages/Settings/Roles/Roles';
import Reports from './pages/Reports/Reports';
import FinancialReports from './pages/Reports/FinancialReports';
import StaffReports from './pages/Reports/StaffReports';
import Sections from './pages/Sections/Sections';
import NonTeaching from './pages/Staff/NonTeaching';
import StaffProfile from './pages/Staff/StaffProfile/StaffProfile';
import HelpSupport from './pages/Account/HelpSupport';
import LoginHistory from './pages/Account/LoginHistory';
import Configuration from './pages/Account/Configuration';
import './index.css';

// PublicRoute - Redirects to dashboard if already authenticated
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #00843e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// RoleBasedRoute - Routes to role-specific dashboard
const RoleBasedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const teacherAllowedPaths = new Set([
    '/',
    '/teacher-dashboard',
    '/classes',
    '/students',
    '/attendance',
    '/assignments',
    '/exams/marks',
    '/reports',
    '/timetable',
    '/courses',
  ]);

  const parentAllowedPaths = new Set([
    '/',
    '/parent-dashboard',
    '/students',
    '/courses',
    '/attendance',
    '/assignments',
    '/exams/results',
    '/fees',
    '/calendar',
    '/timetable',
    '/results',
    '/exam-results',
    '/parents/:id',
    '/announcements',
  ]);

  const admissionAllowedPaths = new Set([
    '/',
    '/admission-dashboard',
    '/students',
    '/students/add',
    '/students/:id',
    '/parents',
    '/parents/:id',
    '/attendance',
    '/classes',
    '/sections',
    '/subjects',
    '/courses',
    '/reports',
    '/reports/academic',
    '/calendar',
  ]);

  const studentAllowedPaths = new Set([
    '/',
    '/student-dashboard',
    '/courses',
    '/timetable',
    '/calendar',
    '/attendance',
    '/assignments',
    '/exams/results',
    '/fees',
  ]);


  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #e2e8f0',
          borderTop: '4px solid #00843e',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Handle root path redirection
  if (location.pathname === '/') {
    if (user.role === 'teacher') return <Navigate to="/teacher-dashboard" replace />;
    if (user.role === 'parent') return <Navigate to="/parent-dashboard" replace />;
    if (user.role === 'student') return <Navigate to="/student-dashboard" replace />;
    if (user.role === 'admission') return <Navigate to="/admission-dashboard" replace />;
    if (user.role === 'finance') return <Navigate to="/finance-dashboard" replace />;
    if (user.role === 'itsupport') return <Navigate to="/it-dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
  }

  if (user.role === 'teacher' && !teacherAllowedPaths.has(location.pathname)) {
    return <Navigate to="/teacher-dashboard" replace />;
  }

  if (user.role === 'parent' && !parentAllowedPaths.has(location.pathname)) {
    return <Navigate to="/parent-dashboard" replace />;
  }

  if (user.role === 'admission' && !admissionAllowedPaths.has(location.pathname)) {
    return <Navigate to="/admission-dashboard" replace />;
  }

  if (user.role === 'student' && !studentAllowedPaths.has(location.pathname)) {
    return <Navigate to="/student-dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          {/* Handle /5173/login route - redirect to /login */}
          <Route path="/5173/login" element={<Navigate to="/login" replace />} />
          
          {/* Protected routes - Role-based dashboards */}
          <Route path="/" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <AdminDashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/admin-dashboard" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <AdminDashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/teacher-dashboard" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <TeacherDashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/student-dashboard" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <StudentDashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/parent-dashboard" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <ParentDashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/finance-dashboard" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <FinanceDashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/it-dashboard" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <ITSupportDashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/admission-dashboard" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <AdmissionDashboard />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          {/* Student Management Routes */}
          <Route path="/students" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Students />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/students/add" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <AddStudent />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/students/:id" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <StudentProfile />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/students/promote" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <PromoteStudents />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          {/* Teacher Management Routes */}
          <Route path="/teachers" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Teachers />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/teachers/add" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <AddTeacher />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/teachers/:id" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <TeacherProfile />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          {/* Academic Routes */}
          <Route path="/courses" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Courses />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/classes" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Classes />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/subjects" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Subjects />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/timetable" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Timetable />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/calendar" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Calendar />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/attendance" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Attendance />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          {/* Parents Route */}
          <Route path="/parents" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Parents />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/parents/:id" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <ParentProfile />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          {/* Assignments */}
          <Route path="/assignments" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Assignments />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          {/* Exams & Results */}
          <Route path="/exams" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Results />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/exams/schedule" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <ExamSchedule />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/exams/marks" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <MarksEntry />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/exams/results" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <ExamResults />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          {/* Finance */}
          <Route path="/fees" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Fees />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/fees/structure" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <FeesStructure />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/fees/collection" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <FeesCollection />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/fees/collection/:studentId" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <FeesCollection />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/fees/expenses" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Expenses />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/fees/income" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Income />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          {/* Reports */}
          <Route path="/reports" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Reports />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/reports/academic" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Reports type="academic" />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/reports/financial" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <FinancialReports />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/reports/staff" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <StaffReports />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />

          {/* Sections Management */}
          <Route path="/sections" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Sections />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />

          {/* Staff Management */}
          <Route path="/staff/non-teaching" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <NonTeaching />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />

          <Route path="/staff/:id" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <StaffProfile />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />

          {/* Account Settings */}
          <Route path="/account/help" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <HelpSupport />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />

          <Route path="/account/login-history" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <LoginHistory />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />

          <Route path="/account/config" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Configuration />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          {/* Settings */}
          <Route path="/settings" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <SettingsGeneral />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/settings/general" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <SettingsGeneral />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/settings/academic" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <SettingsAcademic />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/settings/users" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <SettingsUsers />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/settings/roles" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <SettingsRoles />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          <Route path="/announcements" element={
            <ProtectedRoute>
              <RoleBasedRoute>
                <Announcements />
              </RoleBasedRoute>
            </ProtectedRoute>
          } />
          
          {/* Catch all - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;


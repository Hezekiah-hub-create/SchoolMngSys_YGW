import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { Home, BookOpen, Calendar as CalendarIcon, User } from 'lucide-react-native';
import { COLORS } from '../theme';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import CalendarScreen from '../screens/CalendarScreen';
import AcademicsScreen from '../screens/AcademicsScreen';
import ProfileScreen from '../screens/ProfileScreen';

import AdminHubScreen from '../screens/admin/AdminHubScreen';
import StudentsListScreen from '../screens/admin/StudentsListScreen';
import TeachersListScreen from '../screens/admin/TeachersListScreen';
import StudentProfileScreen from '../screens/admin/StudentProfileScreen';
import AdminParentsListScreen from '../screens/admin/AdminParentsListScreen';
import AdminStaffListScreen from '../screens/admin/AdminStaffListScreen';
import ClassesScreen from '../screens/admin/ClassesScreen';
import SectionsScreen from '../screens/admin/SectionsScreen';
import SubjectsScreen from '../screens/admin/SubjectsScreen';
import SubjectAllocationScreen from '../screens/admin/SubjectAllocationScreen';

import ExamsScreen from '../screens/admin/ExamsScreen';
import FeesScreen from '../screens/admin/FeesScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';
import ActivityLogsScreen from '../screens/admin/ActivityLogsScreen';

import TeacherAttendanceScreen from '../screens/teacher/AttendanceScreen';
import ScheduleScreen from '../screens/ScheduleScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.slate[400],
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 85,
          paddingBottom: Platform.OS === 'ios' ? 28 : 25,
          paddingTop: 10,
          shadowColor: COLORS.slate[900],
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.05,
          shadowRadius: 20,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '800',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 8,
        }
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Academics" 
        component={AcademicsScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <BookOpen color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <CalendarIcon color={color} size={size} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          {/* Admin Stack */}
          <Stack.Screen name="AdminHub" component={AdminHubScreen} />
          <Stack.Screen name="AdminStudentsList" component={StudentsListScreen} />
          <Stack.Screen name="AdminTeachersList" component={TeachersListScreen} />
          <Stack.Screen name="AdminStudentProfile" component={StudentProfileScreen} />
          <Stack.Screen name="AdminParentsList" component={AdminParentsListScreen} />
          <Stack.Screen name="AdminStaffList" component={AdminStaffListScreen} />
          <Stack.Screen name="AdminClasses" component={ClassesScreen} />
          <Stack.Screen name="AdminSections" component={SectionsScreen} />
          <Stack.Screen name="AdminSubjects" component={SubjectsScreen} />
          <Stack.Screen name="AdminSubjectAllocation" component={SubjectAllocationScreen} />
          
          <Stack.Screen name="AdminExams" component={ExamsScreen} />
          <Stack.Screen name="AdminFees" component={FeesScreen} />
          <Stack.Screen name="AdminReports" component={ReportsScreen} />
          <Stack.Screen name="AdminSettings" component={SettingsScreen} />
          <Stack.Screen name="AdminLogs" component={ActivityLogsScreen} />
          {/* Teacher Stack */}
          <Stack.Screen name="TeacherAttendance" component={TeacherAttendanceScreen} />
          {/* Shared Stack */}
          <Stack.Screen name="Schedule" component={ScheduleScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;

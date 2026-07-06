import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import LoginScreen from './pages/LoginScreen';
import ChangePasswordScreen from './pages/ChangePasswordScreen';
import RegisterStudentScreen from './pages/RegisterStudentScreen';
import DashboardScreen from './pages/DashboardScreen';
import StudentListScreen from './pages/StudentListScreen';
import StudentDetailScreen from './pages/StudentDetailScreen';
import EditStudentScreen from './pages/EditStudentScreen';
import StudentPromotionScreen from './pages/StudentPromotionScreen';
import LessonsScreen from './pages/LessonsScreen';
import LessonDetailScreen from './pages/LessonDetailScreen';
import ContentManagementScreen from './pages/ContentManagementScreen';
import ProgressScreen from './pages/ProgressScreen';
import CurriculumManagementScreen from './pages/CurriculumManagementScreen';
import HymnLessonManagementScreen from './pages/HymnLessonManagementScreen';
import StudentCurriculumScreen from './pages/StudentCurriculumScreen';
import StudentHymnLessonsScreen from './pages/StudentHymnLessonsScreen';
import HymnLessonDetailScreen from './pages/HymnLessonDetailScreen';
import ExamScoreEntryScreen from './pages/ExamScoreEntryScreen';
import MyExamResultsScreen from './pages/MyExamResultsScreen';
import CertificateScreen from './pages/CertificateScreen';
import MyCertificatesScreen from './pages/MyCertificatesScreen';
import AnnouncementsScreen from './pages/AnnouncementsScreen';
import SelfRegisterScreen from './pages/SelfRegisterScreen';
import PendingApprovalsScreen from './pages/PendingApprovalsScreen';
import PaymentReportsScreen from './pages/PaymentReportsScreen';
import StudentProfileScreen from './pages/StudentProfileScreen';
import AttendanceSessionsScreen from './pages/AttendanceSessionsScreen';
import AttendanceDashboardScreen from './pages/AttendanceDashboardScreen';
import StudentCheckInScreen from './pages/StudentCheckInScreen';
import LeaveRequestsScreen from './pages/LeaveRequestsScreen';
import AcademicYearsScreen from './pages/AcademicYearsScreen';
import ClassDistributionScreen from './pages/ClassDistributionScreen';
import HymnSubmissionsScreen from './pages/HymnSubmissionsScreen';
import HomeworkManagementScreen from './pages/HomeworkManagementScreen';
import StudentHomeworkListScreen from './pages/StudentHomeworkListScreen';
import StudentHomeworkDetailScreen from './pages/StudentHomeworkDetailScreen';
import NotificationsScreen from './pages/NotificationsScreen';

const ProtectedRoute = ({ children, adminOnly }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
    if (adminOnly && user.role !== 'Admin') return <Navigate to="/dashboard" replace />;
    return children;
};

const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (user) return <Navigate to="/dashboard" replace />;
    return children;
};

function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<PublicRoute><LoginScreen /></PublicRoute>} />
            <Route path="/self-register" element={<SelfRegisterScreen />} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePasswordScreen /></ProtectedRoute>} />

            {/* Admin only */}
            <Route path="/register-student" element={<ProtectedRoute adminOnly><RegisterStudentScreen /></ProtectedRoute>} />
            <Route path="/pending-approvals" element={<ProtectedRoute adminOnly><PendingApprovalsScreen /></ProtectedRoute>} />
            <Route path="/payment-reports" element={<ProtectedRoute adminOnly><PaymentReportsScreen /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute adminOnly><StudentListScreen /></ProtectedRoute>} />
            <Route path="/students/:id" element={<ProtectedRoute adminOnly><StudentDetailScreen /></ProtectedRoute>} />
            <Route path="/students/:id/edit" element={<ProtectedRoute adminOnly><EditStudentScreen /></ProtectedRoute>} />
            <Route path="/students/:id/promote" element={<ProtectedRoute adminOnly><StudentPromotionScreen /></ProtectedRoute>} />
            <Route path="/content" element={<ProtectedRoute adminOnly><ContentManagementScreen /></ProtectedRoute>} />
            <Route path="/curriculum-management" element={<ProtectedRoute adminOnly><CurriculumManagementScreen /></ProtectedRoute>} />
            <Route path="/hymn-lessons-management" element={<ProtectedRoute adminOnly><HymnLessonManagementScreen /></ProtectedRoute>} />
            <Route path="/exams" element={<ProtectedRoute adminOnly><ExamScoreEntryScreen /></ProtectedRoute>} />
            <Route path="/attendance/sessions" element={<ProtectedRoute adminOnly><AttendanceSessionsScreen /></ProtectedRoute>} />
            <Route path="/attendance/dashboard" element={<ProtectedRoute adminOnly><AttendanceDashboardScreen /></ProtectedRoute>} />
            <Route path="/academic-years" element={<ProtectedRoute adminOnly><AcademicYearsScreen /></ProtectedRoute>} />
            <Route path="/class-distribution" element={<ProtectedRoute adminOnly><ClassDistributionScreen /></ProtectedRoute>} />
            <Route path="/hymn-submissions" element={<ProtectedRoute adminOnly><HymnSubmissionsScreen /></ProtectedRoute>} />
            <Route path="/homework-management" element={<ProtectedRoute adminOnly><HomeworkManagementScreen /></ProtectedRoute>} />

            {/* Shared */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><NotificationsScreen /></ProtectedRoute>} />
            <Route path="/lessons" element={<ProtectedRoute><LessonsScreen /></ProtectedRoute>} />
            <Route path="/lessons/:id" element={<ProtectedRoute><LessonDetailScreen /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressScreen /></ProtectedRoute>} />
            <Route path="/curriculum" element={<ProtectedRoute><StudentCurriculumScreen /></ProtectedRoute>} />
            <Route path="/hymn-lessons" element={<ProtectedRoute><StudentHymnLessonsScreen /></ProtectedRoute>} />
            <Route path="/hymn-lessons/:id" element={<ProtectedRoute><HymnLessonDetailScreen /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><AnnouncementsScreen /></ProtectedRoute>} />
            <Route path="/certificates/:id" element={<ProtectedRoute><CertificateScreen /></ProtectedRoute>} />
            <Route path="/attendance/leaves" element={<ProtectedRoute><LeaveRequestsScreen /></ProtectedRoute>} />

            {/* Student only */}
            <Route path="/profile" element={<ProtectedRoute><StudentProfileScreen /></ProtectedRoute>} />
            <Route path="/my-results" element={<ProtectedRoute><MyExamResultsScreen /></ProtectedRoute>} />
            <Route path="/my-certificates" element={<ProtectedRoute><MyCertificatesScreen /></ProtectedRoute>} />
            <Route path="/attendance/checkin" element={<ProtectedRoute><StudentCheckInScreen /></ProtectedRoute>} />
            <Route path="/homework" element={<ProtectedRoute><StudentHomeworkListScreen /></ProtectedRoute>} />
            <Route path="/homework/:id" element={<ProtectedRoute><StudentHomeworkDetailScreen /></ProtectedRoute>} />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;

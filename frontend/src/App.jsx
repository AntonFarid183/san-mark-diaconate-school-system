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
import StudentProfileScreen from './pages/StudentProfileScreen';

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
            <Route path="/students" element={<ProtectedRoute adminOnly><StudentListScreen /></ProtectedRoute>} />
            <Route path="/students/:id" element={<ProtectedRoute adminOnly><StudentDetailScreen /></ProtectedRoute>} />
            <Route path="/students/:id/edit" element={<ProtectedRoute adminOnly><EditStudentScreen /></ProtectedRoute>} />
            <Route path="/students/:id/promote" element={<ProtectedRoute adminOnly><StudentPromotionScreen /></ProtectedRoute>} />
            <Route path="/content" element={<ProtectedRoute adminOnly><ContentManagementScreen /></ProtectedRoute>} />
            <Route path="/curriculum-management" element={<ProtectedRoute adminOnly><CurriculumManagementScreen /></ProtectedRoute>} />
            <Route path="/hymn-lessons-management" element={<ProtectedRoute adminOnly><HymnLessonManagementScreen /></ProtectedRoute>} />
            <Route path="/exams" element={<ProtectedRoute adminOnly><ExamScoreEntryScreen /></ProtectedRoute>} />

            {/* Shared */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
            <Route path="/lessons" element={<ProtectedRoute><LessonsScreen /></ProtectedRoute>} />
            <Route path="/lessons/:id" element={<ProtectedRoute><LessonDetailScreen /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressScreen /></ProtectedRoute>} />
            <Route path="/curriculum" element={<ProtectedRoute><StudentCurriculumScreen /></ProtectedRoute>} />
            <Route path="/hymn-lessons" element={<ProtectedRoute><StudentHymnLessonsScreen /></ProtectedRoute>} />
            <Route path="/hymn-lessons/:id" element={<ProtectedRoute><HymnLessonDetailScreen /></ProtectedRoute>} />
            <Route path="/announcements" element={<ProtectedRoute><AnnouncementsScreen /></ProtectedRoute>} />
            <Route path="/certificates/:id" element={<ProtectedRoute><CertificateScreen /></ProtectedRoute>} />

            {/* Student only */}
            <Route path="/profile" element={<ProtectedRoute><StudentProfileScreen /></ProtectedRoute>} />
            <Route path="/my-results" element={<ProtectedRoute><MyExamResultsScreen /></ProtectedRoute>} />
            <Route path="/my-certificates" element={<ProtectedRoute><MyCertificatesScreen /></ProtectedRoute>} />
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

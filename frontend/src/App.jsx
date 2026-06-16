import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';
import LoginScreen from './pages/LoginScreen';
import ChangePasswordScreen from './pages/ChangePasswordScreen';
import RegisterStudentScreen from './pages/RegisterStudentScreen';
import DashboardScreen from './pages/DashboardScreen';
import StudentListScreen from './pages/StudentListScreen';
import StudentDetailScreen from './pages/StudentDetailScreen';
import LessonsScreen from './pages/LessonsScreen';
import LessonDetailScreen from './pages/LessonDetailScreen';
import ContentManagementScreen from './pages/ContentManagementScreen';
import ProgressScreen from './pages/ProgressScreen';
import HymnScreen from './pages/HymnScreen';
import HymnReviewScreen from './pages/HymnReviewScreen';
import ExamTakingScreen from './pages/ExamTakingScreen';
import ExamResultsScreen from './pages/ExamResultsScreen';

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user) return <Navigate to="/login" replace />;
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
            <Route path="/change-password" element={<ChangePasswordScreen />} />
            <Route path="/register-student" element={<ProtectedRoute><RegisterStudentScreen /></ProtectedRoute>} />
            <Route path="/students" element={<ProtectedRoute><StudentListScreen /></ProtectedRoute>} />
            <Route path="/students/:id" element={<ProtectedRoute><StudentDetailScreen /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
            <Route path="/lessons" element={<ProtectedRoute><LessonsScreen /></ProtectedRoute>} />
            <Route path="/lessons/:id" element={<ProtectedRoute><LessonDetailScreen /></ProtectedRoute>} />
            <Route path="/content" element={<ProtectedRoute><ContentManagementScreen /></ProtectedRoute>} />
            <Route path="/progress" element={<ProtectedRoute><ProgressScreen /></ProtectedRoute>} />
            <Route path="/hymns" element={<ProtectedRoute><HymnScreen /></ProtectedRoute>} />
            <Route path="/hymns/review" element={<ProtectedRoute><HymnReviewScreen /></ProtectedRoute>} />
            <Route path="/exams/:id" element={<ProtectedRoute><ExamTakingScreen /></ProtectedRoute>} />
            <Route path="/exams/:id/results" element={<ProtectedRoute><ExamResultsScreen /></ProtectedRoute>} />
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

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import LoginScreen from './pages/LoginScreen';
import ChangePasswordScreen from './pages/ChangePasswordScreen';
import RegisterStudentScreen from './pages/RegisterStudentScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/change-password" element={<ChangePasswordScreen />} />
        <Route path="/register-student" element={<RegisterStudentScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

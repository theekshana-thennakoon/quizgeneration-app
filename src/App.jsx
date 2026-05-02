import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import QuizGenerator from './pages/QuizGenerator';
import QuizTaking from './pages/QuizTaking';
import QuizResults from './pages/QuizResults';
import SharedQuiz from './pages/SharedQuiz';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/auth" replace />;
  return children;
};

const AuthRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Public Routes */}
            <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/shared/:shareId" element={<SharedQuiz />} />

            {/* Protected Routes */}
            <Route path="/dashboard"  element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/upload"     element={<ProtectedRoute><Upload /></ProtectedRoute>} />
            <Route path="/configure"  element={<ProtectedRoute><QuizGenerator /></ProtectedRoute>} />
            <Route path="/take-quiz"  element={<ProtectedRoute><QuizTaking /></ProtectedRoute>} />
            <Route path="/results"    element={<ProtectedRoute><QuizResults /></ProtectedRoute>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;

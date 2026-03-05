import React, { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Error Boundary
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#f1f5f9', fontFamily: 'Inter, sans-serif', padding: '2rem', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Something went wrong</h2>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>
                            {this.state.error?.message || 'Unknown error'}
                        </p>
                        <p style={{ color: '#64748b', fontSize: '0.75rem' }}>
                            Please check your <strong>.env</strong> file has valid Firebase credentials and refresh the page.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{ marginTop: '1.5rem', padding: '0.5rem 1.5rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}
                        >
                            Reload
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// Pages
import Login from './pages/Login';
import Signup from './pages/Signup';
import StudentDashboard from './pages/student/StudentDashboard';
import ComplaintsPage from './pages/student/ComplaintsPage';
import AnnouncementsPage from './pages/student/AnnouncementsPage';
import NotesHub from './pages/student/NotesHub';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageComplaints from './pages/admin/ManageComplaints';
import ManageAnnouncements from './pages/admin/ManageAnnouncements';
import ManageNotes from './pages/admin/ManageNotes';
import StudentList from './pages/admin/StudentList';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherComplaints from './pages/teacher/TeacherComplaints';

function LoadingScreen() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30 animate-pulse-slow">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    </svg>
                </div>
                <p className="text-gray-400 text-sm font-medium">Loading SmartCampus...</p>
            </div>
        </div>
    );
}

// Protected route for students
function StudentRoute({ children }) {
    const { currentUser, userRole, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!currentUser) return <Navigate to="/login" replace />;
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'classTeacher') return <Navigate to="/teacher" replace />;
    return children;
}

// Protected route for admins
function AdminRoute({ children }) {
    const { currentUser, userRole, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!currentUser) return <Navigate to="/login" replace />;
    if (userRole === 'student') return <Navigate to="/student" replace />;
    if (userRole === 'classTeacher') return <Navigate to="/teacher" replace />;
    return children;
}

// Protected route for class teachers
function TeacherRoute({ children }) {
    const { currentUser, userRole, loading } = useAuth();
    if (loading) return <LoadingScreen />;
    if (!currentUser) return <Navigate to="/login" replace />;
    if (userRole === 'student') return <Navigate to="/student" replace />;
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    return children;
}

function AppRoutes() {
    const { currentUser, userRole } = useAuth();

    return (
        <Routes>
            <Route
                path="/"
                element={
                    currentUser
                        ? userRole === 'admin'
                            ? <Navigate to="/admin" replace />
                            : userRole === 'classTeacher'
                                ? <Navigate to="/teacher" replace />
                                : <Navigate to="/student" replace />
                        : <Navigate to="/login" replace />
                }
            />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Student Routes */}
            <Route path="/student" element={<StudentRoute><StudentDashboard /></StudentRoute>} />
            <Route path="/student/complaints" element={<StudentRoute><ComplaintsPage /></StudentRoute>} />
            <Route path="/student/announcements" element={<StudentRoute><AnnouncementsPage /></StudentRoute>} />
            <Route path="/student/notes" element={<StudentRoute><NotesHub /></StudentRoute>} />

            {/* Teacher Routes */}
            <Route path="/teacher" element={<TeacherRoute><TeacherDashboard /></TeacherRoute>} />
            <Route path="/teacher/complaints" element={<TeacherRoute><TeacherComplaints /></TeacherRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/complaints" element={<AdminRoute><ManageComplaints /></AdminRoute>} />
            <Route path="/admin/announcements" element={<AdminRoute><ManageAnnouncements /></AdminRoute>} />
            <Route path="/admin/notes" element={<AdminRoute><ManageNotes /></AdminRoute>} />
            <Route path="/admin/students" element={<AdminRoute><StudentList /></AdminRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <AppRoutes />
                        <Toaster
                            position="top-right"
                            toastOptions={{
                                duration: 3000,
                                style: { borderRadius: '12px', fontSize: '13px', fontWeight: 500 },
                            }}
                        />
                    </BrowserRouter>
                </AuthProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
}

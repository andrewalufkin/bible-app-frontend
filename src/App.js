// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BibleProvider } from './contexts/BibleContext';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import BibleReader from './components/bible/BibleReader';
import SearchPage from './pages/SearchPage';
import NotesPage from './pages/NotesPage';
import FriendsPage from './pages/FriendsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import InsightsPage from './pages/InsightsPage';
import BookmarksPage from './pages/BookmarksPage';
import { useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Authentication Router Guard
const AuthGuard = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    const publicPaths = ['/login', '/register'];
    
    if (!isAuthenticated && !publicPaths.includes(location.pathname)) {
      // Save the current location they were trying to go to
      navigate('/login', { 
        state: { from: location },
        replace: true 
      });
    }
  }, [isAuthenticated, location, navigate]);

  return children;
};

function AppContent() {
  return (
    <AuthGuard>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Public Route - Now Protected */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <BibleReader />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Bible Routes - Now Protected */}
        <Route path="/bible/:book/:chapter" element={
          <ProtectedRoute>
            <MainLayout>
              <BibleReader />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Insights Route */}
        <Route path="/insights/:book/:chapter" element={
          <ProtectedRoute>
            <MainLayout>
              <InsightsPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Protected & Premium Routes */}
        <Route path="/search" element={
          <ProtectedRoute>
            <MainLayout>
              <SearchPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/notes" element={
          <ProtectedRoute>
            <MainLayout>
              <NotesPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/friends" element={
          <ProtectedRoute>
            <MainLayout>
              <FriendsPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        <Route path="/bookmarks" element={
          <ProtectedRoute>
            <MainLayout>
              <BookmarksPage />
            </MainLayout>
          </ProtectedRoute>
        } />

        {/* Protected but not Premium Route */}
        <Route path="/settings" element={
          <ProtectedRoute>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </AuthGuard>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <BibleProvider>
          <AppContent />
        </BibleProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
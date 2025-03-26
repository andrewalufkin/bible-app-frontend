// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { useAuth } from './contexts/AuthContext';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      {/* Public Route */}
      <Route path="/" element={
        <MainLayout>
          <BibleReader />
        </MainLayout>
      } />

      {/* Bible Routes */}
      <Route path="/bible/:book/:chapter" element={
        <MainLayout>
          <BibleReader />
        </MainLayout>
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

      {/* Protected but not Premium Route */}
      <Route path="/settings" element={
        <ProtectedRoute>
          <MainLayout>
            <SettingsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
    </Routes>
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
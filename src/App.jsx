import React, { useLocation } from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './Sidebar';
import VerseSelector from './VerseSelector';
import BibleReader from './BibleReader';
import SearchPage from './SearchPage';
import FriendsPage from './FriendsPage';
import SettingsPage from './SettingsPage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

const App = () => {
  const location = useLocation();
  const isBibleRoute = location.pathname === '/';

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 h-screen overflow-y-auto">
        {/* Only show verse selector on Bible route */}
        {isBibleRoute && (
          <div className="bg-white border-b">
            <VerseSelector />
          </div>
        )}
        <main className="p-4">
          <Routes>
            <Route path="/" element={<BibleReader />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App; 
// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SettingsPage = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [noteSettings, setNoteSettings] = useState({
    can_view_friend_notes: true,
    share_notes_with_friends: true
  });

  useEffect(() => {
    if (user) {
      setNoteSettings({
        can_view_friend_notes: user.can_view_friend_notes,
        share_notes_with_friends: user.share_notes_with_friends
      });
    }
  }, [user]);

  const handleNoteSettingsChange = async (setting) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Before update - User settings:', user?.can_view_friend_notes, user?.share_notes_with_friends);
      console.log('Updating with setting:', setting);

      const response = await fetch(`${API_BASE_URL}/auth/settings/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...noteSettings,
          ...setting
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const updatedUser = await response.json();
      console.log('After update - Updated user:', updatedUser);
      
      updateUser(updatedUser);
      setNoteSettings({
        can_view_friend_notes: updatedUser.can_view_friend_notes,
        share_notes_with_friends: updatedUser.share_notes_with_friends
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/delete-account`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          logout();
          navigate('/login');
        } else {
          throw new Error('Failed to delete account');
        }
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="font-medium">Username</label>
            <p className="text-gray-600">{user?.username}</p>
          </div>
          <div>
            <label className="font-medium">Email</label>
            <p className="text-gray-600">{user?.email}</p>
          </div>
          <div>
            <label className="font-medium">Account Type</label>
            <p className="text-gray-600">{user?.is_premium ? 'Premium' : 'Basic'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Note Privacy Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">View Friends' Notes</label>
              <p className="text-sm text-gray-600">Allow viewing study notes from your friends</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={noteSettings.can_view_friend_notes}
                onChange={(e) => handleNoteSettingsChange({ can_view_friend_notes: e.target.checked })}
                disabled={isLoading}
                className="sr-only peer"
                id="view-notes"
              />
              <label
                htmlFor="view-notes"
                className="flex w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium">Share Notes with Friends</label>
              <p className="text-sm text-gray-600">Allow friends to see your study notes</p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={noteSettings.share_notes_with_friends}
                onChange={(e) => handleNoteSettingsChange({ share_notes_with_friends: e.target.checked })}
                disabled={isLoading}
                className="sr-only peer"
                id="share-notes"
              />
              <label
                htmlFor="share-notes"
                className="flex w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          onClick={handleLogout}
          className="w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
        >
          Log Out
        </button>

        <button
          onClick={handleDeleteAccount}
          className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
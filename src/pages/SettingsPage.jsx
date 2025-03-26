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
  const [aiPreferences, setAiPreferences] = useState({
    model_temperature: 0.7,
    response_length: 300,
    writing_style: 'devotional',
    preferred_topics: [],
    challenge_level: 0.5,
    depth_level: 'intermediate',
    time_orientation: 0.5,
    user_context: {}
  });
  const [topicInput, setTopicInput] = useState('');
  const [userContextKey, setUserContextKey] = useState('');
  const [userContextValue, setUserContextValue] = useState('');

  useEffect(() => {
    if (user) {
      setNoteSettings({
        can_view_friend_notes: user.can_view_friend_notes,
        share_notes_with_friends: user.share_notes_with_friends
      });
      
      if (user.ai_preferences) {
        setAiPreferences({
          ...aiPreferences,
          ...user.ai_preferences,
          challenge_level: typeof user.ai_preferences.challenge_level === 'number' ? user.ai_preferences.challenge_level : 0.5,
          time_orientation: typeof user.ai_preferences.time_orientation === 'number' ? user.ai_preferences.time_orientation : 0.5,
          user_context: user.ai_preferences.user_context || {}
        });
      }
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

  const handleAiPreferenceChange = (name, value) => {
    setAiPreferences(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveAiPreferences = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/auth/settings/ai`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(aiPreferences)
      });

      if (!response.ok) {
        throw new Error('Failed to update AI preferences');
      }

      const result = await response.json();
      
      // Update the user in context with new AI preferences
      updateUser({
        ...user,
        ai_preferences: result.ai_preferences
      });
      
      alert('AI preferences saved successfully!');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addTopic = () => {
    if (topicInput.trim() && !aiPreferences.preferred_topics.includes(topicInput.trim())) {
      handleAiPreferenceChange('preferred_topics', [...aiPreferences.preferred_topics, topicInput.trim()]);
      setTopicInput('');
    }
  };

  const removeTopic = (topic) => {
    handleAiPreferenceChange(
      'preferred_topics', 
      aiPreferences.preferred_topics.filter(t => t !== topic)
    );
  };

  const addUserContext = () => {
    if (userContextKey.trim() && userContextValue.trim()) {
      handleAiPreferenceChange('user_context', {
        ...(aiPreferences.user_context || {}),
        [userContextKey.trim()]: userContextValue.trim()
      });
      setUserContextKey('');
      setUserContextValue('');
    }
  };

  const removeUserContext = (key) => {
    const newContext = { ...(aiPreferences.user_context || {}) };
    delete newContext[key];
    handleAiPreferenceChange('user_context', newContext);
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

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">AI Insights Preferences</h2>
        <div className="space-y-6">
          {/* Writing Style */}
          <div>
            <label className="font-medium block mb-2">Writing Style</label>
            <select
              value={aiPreferences.writing_style}
              onChange={(e) => handleAiPreferenceChange('writing_style', e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="devotional">Devotional</option>
              <option value="academic">Academic</option>
              <option value="casual">Casual</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">The tone and approach of AI-generated insights</p>
          </div>

          {/* Knowledge Depth */}
          <div>
            <label className="font-medium block mb-2">Depth Level</label>
            <select
              value={aiPreferences.depth_level}
              onChange={(e) => handleAiPreferenceChange('depth_level', e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="scholarly">Scholarly</option>
            </select>
            <p className="text-sm text-gray-600 mt-1">Level of theological and analytical depth</p>
          </div>

          {/* Response Length */}
          <div>
            <label className="font-medium block mb-2">
              Response Length: {aiPreferences.response_length} characters
            </label>
            <input
              type="range"
              min="100"
              max="4000"
              step="100"
              value={aiPreferences.response_length}
              onChange={(e) => handleAiPreferenceChange('response_length', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Shorter</span>
              <span>Longer</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Controls the length of AI-generated insights in characters</p>
          </div>

          {/* Challenge Level */}
          <div>
            <label className="font-medium block mb-2">
              Challenge Level: {isNaN(aiPreferences.challenge_level) ? 50 : Math.round(aiPreferences.challenge_level * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isNaN(aiPreferences.challenge_level) ? 0.5 : aiPreferences.challenge_level}
              onChange={(e) => handleAiPreferenceChange('challenge_level', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Affirming</span>
              <span>Challenging</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">How much the AI should challenge your existing understanding</p>
          </div>

          {/* Time Orientation */}
          <div>
            <label className="font-medium block mb-2">
              Time Orientation: {isNaN(aiPreferences.time_orientation) ? 50 : Math.round(aiPreferences.time_orientation * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={isNaN(aiPreferences.time_orientation) ? 0.5 : aiPreferences.time_orientation}
              onChange={(e) => handleAiPreferenceChange('time_orientation', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-sm text-gray-600 mt-1">
              <span>Historical Focus</span>
              <span>Modern Application</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">Balance between original context and modern relevance</p>
          </div>

          {/* Preferred Topics */}
          <div>
            <label className="font-medium block mb-2">Preferred Topics</label>
            <div className="flex mb-2">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Add a topic (e.g., prayer, forgiveness)"
                className="flex-1 p-2 border border-gray-300 rounded-l-md focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={addTopic}
                className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {aiPreferences.preferred_topics.map(topic => (
                <div key={topic} className="px-3 py-1 bg-blue-100 rounded-full flex items-center">
                  <span>{topic}</span>
                  <button 
                    onClick={() => removeTopic(topic)}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                  >
                    ×
                  </button>
                </div>
              ))}
              {aiPreferences.preferred_topics.length === 0 && (
                <p className="text-sm text-gray-500 italic">No preferred topics added</p>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">Topics you want the AI to focus on in its insights</p>
          </div>

          {/* User Context */}
          <div>
            <label className="font-medium block mb-2">Personal Context</label>
            <p className="text-sm text-gray-600 mb-2">Add information about yourself to make insights more personalized</p>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="text"
                value={userContextKey}
                onChange={(e) => setUserContextKey(e.target.value)}
                placeholder="Label (e.g., occupation)"
                className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                value={userContextValue}
                onChange={(e) => setUserContextValue(e.target.value)}
                placeholder="Value (e.g., teacher)"
                className="p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={addUserContext}
              className="px-4 py-2 mb-4 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add Context
            </button>
            
            <div className="space-y-2">
              {Object.entries(aiPreferences.user_context || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{key}:</span> {value}
                  </div>
                  <button 
                    onClick={() => removeUserContext(key)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {Object.keys(aiPreferences.user_context || {}).length === 0 && (
                <p className="text-sm text-gray-500 italic">No personal context added</p>
              )}
            </div>
          </div>

          <button
            onClick={saveAiPreferences}
            disabled={isLoading}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save AI Preferences'}
          </button>
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
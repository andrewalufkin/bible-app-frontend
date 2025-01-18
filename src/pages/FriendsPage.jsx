// src/pages/FriendsPage.jsx
import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LoadingState = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-16 bg-gray-200 rounded"></div>
    <div className="h-16 bg-gray-200 rounded"></div>
    <div className="h-16 bg-gray-200 rounded"></div>
  </div>
);

const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/friends/`, {
          headers: getAuthHeaders()
        }),
        fetch(`${API_BASE_URL}/friends/requests/`, {
          headers: getAuthHeaders()
        })
      ]);
      
      if (!friendsRes.ok || !requestsRes.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const friendsData = await friendsRes.json();
      const requestsData = await requestsRes.json();
      
      console.log('Raw friend requests data:', requestsData);
      console.log('Friend requests IDs:', requestsData.map(req => req.id));
      
      setFriends(friendsData);
      setFriendRequests(requestsData);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to fetch friends data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSendRequest = async () => {
    if (!username.trim()) return;

    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/friends/request/${username}/`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage(data.message);
        setUsername('');
        // Refresh the lists after sending a request
        fetchData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setError('');
      console.log('Accepting friend request with ID:', requestId);
      const response = await fetch(`${API_BASE_URL}/friends/accept/${requestId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Friend request accepted');
        // Refresh the lists after accepting
        fetchData();
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to accept friend request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/friends/reject/${requestId}/`, {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setSuccessMessage('Friend request rejected');
        // Refresh the lists after rejecting
        fetchData();
      }
    } catch (err) {
      setError('Failed to reject friend request');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      setError('');
      const response = await fetch(`${API_BASE_URL}/friends/${friendId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setSuccessMessage('Friend removed successfully');
        // Refresh the lists after removing
        fetchData();
      }
    } catch (err) {
      setError('Failed to remove friend');
    }
  };

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Friends</h1>
      
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {/* Friend Request Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Send Friend Request</h2>
        <div className="flex gap-4">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={handleSendRequest}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Send Request
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          {/* Pending Friend Requests */}
          {friendRequests.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Pending Friend Requests</h2>
              <div className="space-y-4">
                {friendRequests.map(request => (
                  <div 
                    key={request.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium">{request.from.username}</span>
                    <div className="space-x-2">
                      <button 
                        onClick={() => handleAcceptRequest(request.id)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRejectRequest(request.id)}
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Friends List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">My Friends</h2>
            <div className="space-y-4">
              {friends.map(friend => (
                <div 
                  key={friend.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${friend.online ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="font-medium">{friend.username}</span>
                  </div>
                  <button 
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="text-gray-600 hover:text-red-500"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {friends.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No friends added yet. Send a friend request to get started!
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FriendsPage;
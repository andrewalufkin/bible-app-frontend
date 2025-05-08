import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL || ''}/api`; // Ensure REACT_APP_BACKEND_URL is defined or fallback

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn("No auth token found for API request.");
    // For GET requests, some might proceed without auth, but POST/DELETE usually require it.
    // Depending on API, might return {} or throw error.
    return { 'Content-Type': 'application/json' };
  }
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const useBookmarks = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookmarks = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/bookmarks/`, { headers: getAuthHeaders() });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errData.message || 'Failed to fetch bookmarks');
      }
      const data = await response.json();
      setBookmarks(data);
    } catch (err) {
      console.error("Error fetching bookmarks:", err);
      setError(err.message);
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) { // Only fetch if user is available
      fetchBookmarks();
    } else {
      setBookmarks([]); // Clear bookmarks if user logs out
      setError(null);
    }
  }, [user, fetchBookmarks]); // Rerun if user or fetchBookmarks changes

  const addBookmark = useCallback(async (verseDetails) => {
    if (!user) {
      setError("User not authenticated");
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        book: verseDetails.book,
        chapter: parseInt(verseDetails.chapter, 10),
        verse: parseInt(verseDetails.verse, 10),
        text_preview: verseDetails.text, // Use verseDetails.text for text_preview
        notes: verseDetails.notes // If notes are ever added to verseDetails
      };

      const response = await fetch(`${API_BASE_URL}/bookmarks/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errData.message || 'Failed to add bookmark');
      }
      const newBookmark = await response.json();
      setBookmarks(prev => [...prev, newBookmark]);
      return newBookmark;
    } catch (err) {
      console.error("Error adding bookmark:", err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const removeBookmark = useCallback(async (verseIdentifier) => {
    if (!user) {
      setError("User not authenticated");
      return false;
    }
    
    const bookmarkToRemove = bookmarks.find(
      b => b.book === verseIdentifier.book && 
           b.chapter === parseInt(verseIdentifier.chapter, 10) && 
           b.verse === parseInt(verseIdentifier.verse, 10)
    );

    if (!bookmarkToRemove) {
      console.warn("Attempted to remove a bookmark that doesn't exist locally:", verseIdentifier);
      // Optionally, could try to call backend anyway if an ID is somehow passed, but current logic depends on local find.
      // setError("Bookmark not found locally to get ID for deletion");
      return false; 
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/bookmarks/${bookmarkToRemove.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errData.message || 'Failed to remove bookmark');
      }
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkToRemove.id));
      return true;
    } catch (err) {
      console.error("Error removing bookmark:", err);
      setError(err.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, bookmarks]);

  const isBookmarked = useCallback((verseIdentifier) => {
    if (!verseIdentifier) return false;
    const { book, chapter, verse } = verseIdentifier;
    return bookmarks.some(
      b => b.book === book && 
           b.chapter === parseInt(chapter, 10) && 
           b.verse === parseInt(verse, 10)
    );
  }, [bookmarks]);

  return {
    bookmarks,
    isLoading,
    error,
    fetchBookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
    // setBookmarks // Generally avoid exposing setBookmarks directly unless for specific reset/init scenarios
  };
}; 
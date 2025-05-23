import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

export const useHighlights = () => {
  const { user, token, logout } = useAuth(); // Ensure token and logout are correctly destructured and available.
  const [highlights, setHighlights] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHighlights = useCallback(async (book, chapter) => {
    if (!book || !chapter) {
      setError('Book and chapter are required to fetch highlights.'); // Ensure error is a string
      setHighlights([]);
      return;
    }
    // Check for token FIRST, before attempting to use user object
    if (!token) {
      console.warn('[useHighlights] No token found. User might not be authenticated. Cannot fetch highlights.');
      setError('Authentication token not found. Please log in.'); // Ensure error is a string
      // It's possible that if there's no token, we should trigger logout to clear any potentially inconsistent state.
      // However, AuthGuard should ideally prevent unauthenticated users from reaching this point for protected routes.
      // If a token was previously present but is now gone (e.g. cleared by another tab), logout would be appropriate.
      // For now, let's assume if there's no token, user is effectively logged out.
      // If issues persist where user object is present but token is missing, uncommenting logout() might be needed.
      // logout(); 
      setHighlights([]);
      return;
    }
    if (!user) { // This check might be redundant if token implies user, but good for safety.
      console.warn('[useHighlights] User object not available, though token exists. Cannot fetch highlights.');
      setError('User not available. Please log in.'); // Ensure error is a string
      setHighlights([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Use token directly in headers
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      const response = await fetch(`${API_BASE_URL}/api/highlights/chapter/${book}/${chapter}`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout(); // Call logout on 401
          // It's often good to throw an error here too, so the calling component knows the fetch failed.
          // The logout action will trigger navigation, but the component might still try to process a non-existent response.
          throw new Error('Session expired. Please log in again.'); 
        }
        const errorData = await response.json().catch(() => ({ message: 'Failed to fetch highlights and parse error response' }));
        // Ensure a string message is passed to setError
        const errorMessage = errorData?.message || `HTTP error! status: ${response.status}`;
        console.error('[useHighlights] API Error:', errorMessage, 'Response:', response);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setHighlights(data);
    } catch (err) {
      console.error('[useHighlights] Error fetching highlights:', err.message); // Log err.message
      // If the error is due to a 401 that triggered logout, err.message might be "Session expired..."
      // Avoid setting a generic error if logout has already handled the session expiry.
      // However, if logout() itself doesn't immediately unmount/redirect, setting an error might still be useful.
      // For now, we'll keep setError, as the component might still be mounted briefly.
      setError(err.message || 'Failed to fetch highlights.');
      setHighlights([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, token, logout]); // Added logout to dependencies

  // Function to update the local highlights state for a specific verse
  // with data received from the server (which is the complete set of highlights for that verse).
  const updateHighlightsForVerse = useCallback((verseIdentifier, updatedVerseHighlights) => {
    if (!verseIdentifier || !verseIdentifier.book || verseIdentifier.chapter == null || verseIdentifier.verse == null) {
      console.warn('[useHighlights] updateHighlightsForVerse called without complete verseIdentifier:', verseIdentifier);
      return;
    }
    if (!Array.isArray(updatedVerseHighlights)) {
      console.warn('[useHighlights] updateHighlightsForVerse received non-array data for verse highlights:', updatedVerseHighlights);
      return; 
    }

    setHighlights(prevChapterHighlights => {
      // Filter out all existing highlights for the specific verse being updated
      const otherVerseHighlights = prevChapterHighlights.filter(h => 
        !(h.book === verseIdentifier.book && 
          parseInt(h.chapter, 10) === parseInt(verseIdentifier.chapter, 10) && 
          parseInt(h.verse, 10) === parseInt(verseIdentifier.verse, 10))
      );

      // Combine the highlights from other verses with the new highlights for the updated verse
      const newCombinedHighlights = [...otherVerseHighlights, ...updatedVerseHighlights];
      
      // Sort highlights to maintain order
      newCombinedHighlights.sort((a, b) => {
        const bookComp = String(a.book).localeCompare(String(b.book));
        if (bookComp !== 0) return bookComp;
        
        const chapA = parseInt(a.chapter, 10);
        const chapB = parseInt(b.chapter, 10);
        if (chapA !== chapB) return chapA - chapB;

        const verseA = parseInt(a.verse, 10);
        const verseB = parseInt(b.verse, 10);
        if (verseA !== verseB) return verseA - verseB;
        
        return parseInt(a.start_offset, 10) - parseInt(b.start_offset, 10);
      });

      return newCombinedHighlights;
    });
  }, []);

  // Function to clear highlights, e.g., when book/chapter changes before new ones are loaded
  const clearHighlights = useCallback(() => {
    setHighlights([]);
  }, []);


  return {
    highlights,
    isLoading,
    error,
    fetchHighlights,
    updateHighlightsForVerse, // Expose the new function
    clearHighlights // Expose clearHighlights
  };
}; 
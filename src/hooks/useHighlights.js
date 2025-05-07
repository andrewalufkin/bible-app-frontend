import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5001';

export const useHighlights = () => {
  const { user, token } = useAuth(); // Ensure token is correctly destructured and available.
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
      setError(err.message || 'Failed to fetch highlights.'); // Ensure error is a string
      setHighlights([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, token]); // Add token to dependency array

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
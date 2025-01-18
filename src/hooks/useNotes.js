import { useState, useCallback } from 'react';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useNotes = () => {
  // Move these states to be specific to each operation
  const [loadingStates, setLoadingStates] = useState({
    fetch: false,
    studyNote: false,
    quickNote: false
  });
  const [errors, setErrors] = useState({
    fetch: null,
    studyNote: null,
    quickNote: null
  });

  // Memoize headers function
  const getAuthHeaders = useCallback(() => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }), []);

  const fetchVerseNotes = useCallback(async (book, chapter, verse) => {
    setLoadingStates(prev => ({ ...prev, fetch: true }));
    setErrors(prev => ({ ...prev, fetch: null }));
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/notes/verse/${book}/${chapter}/${verse}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const notes = await response.json();
      return notes;
    } catch (err) {
      setErrors(prev => ({ ...prev, fetch: err.message }));
      return [];
    } finally {
      setLoadingStates(prev => ({ ...prev, fetch: false }));
    }
  }, [getAuthHeaders]);

  const saveStudyNote = useCallback(async (noteData) => {
    setLoadingStates(prev => ({ ...prev, studyNote: true }));
    setErrors(prev => ({ ...prev, studyNote: null }));
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/notes/study`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(noteData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save study note');
      }

      return await response.json();
    } catch (err) {
      setErrors(prev => ({ ...prev, studyNote: err.message }));
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, studyNote: false }));
    }
  }, [getAuthHeaders]);

  const saveQuickNote = useCallback(async (noteData) => {
    setLoadingStates(prev => ({ ...prev, quickNote: true }));
    setErrors(prev => ({ ...prev, quickNote: null }));
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/notes/quick`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(noteData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save quick note');
      }

      return await response.json();
    } catch (err) {
      setErrors(prev => ({ ...prev, quickNote: err.message }));
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, quickNote: false }));
    }
  }, [getAuthHeaders]);

  return {
    isLoading: {
      fetch: loadingStates.fetch,
      studyNote: loadingStates.studyNote,
      quickNote: loadingStates.quickNote
    },
    error: {
      fetch: errors.fetch,
      studyNote: errors.studyNote,
      quickNote: errors.quickNote
    },
    fetchVerseNotes,
    saveStudyNote,
    saveQuickNote
  };
};
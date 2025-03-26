import { useState, useCallback } from 'react';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useNotes = () => {
  // Move these states to be specific to each operation
  const [loadingStates, setLoadingStates] = useState({
    fetch: false,
    studyNote: false,
    quickNote: false,
    allNotes: false,
    chapterNotes: false
  });
  const [errors, setErrors] = useState({
    fetch: null,
    studyNote: null,
    quickNote: null,
    allNotes: null,
    chapterNotes: null
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

  const fetchChapterNotes = useCallback(async (book, chapter) => {
    setLoadingStates(prev => ({ ...prev, chapterNotes: true }));
    setErrors(prev => ({ ...prev, chapterNotes: null }));
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/notes/chapter/${book}/${chapter}/notes`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch chapter notes');
      }

      const notes = await response.json();
      return notes;
    } catch (err) {
      setErrors(prev => ({ ...prev, chapterNotes: err.message }));
      return [];
    } finally {
      setLoadingStates(prev => ({ ...prev, chapterNotes: false }));
    }
  }, [getAuthHeaders]);

  const fetchAllNotes = useCallback(async (page = 1, limit = 10) => {
    setLoadingStates(prev => ({ ...prev, allNotes: true }));
    setErrors(prev => ({ ...prev, allNotes: null }));
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/notes/all?page=${page}&limit=${limit}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      return await response.json();
    } catch (err) {
      setErrors(prev => ({ ...prev, allNotes: err.message }));
      return { notes: [], pagination: { total: 0, page: 1, limit, pages: 0 } };
    } finally {
      setLoadingStates(prev => ({ ...prev, allNotes: false }));
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

  const saveChapterNote = useCallback(async (noteData) => {
    setLoadingStates(prev => ({ ...prev, chapterNotes: true }));
    setErrors(prev => ({ ...prev, chapterNotes: null }));
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/notes/chapter`,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(noteData)
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save chapter note');
      }

      return await response.json();
    } catch (err) {
      setErrors(prev => ({ ...prev, chapterNotes: err.message }));
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, chapterNotes: false }));
    }
  }, [getAuthHeaders]);

  return {
    isLoading: {
      fetch: loadingStates.fetch,
      studyNote: loadingStates.studyNote,
      quickNote: loadingStates.quickNote,
      allNotes: loadingStates.allNotes,
      chapterNotes: loadingStates.chapterNotes
    },
    error: {
      fetch: errors.fetch,
      studyNote: errors.studyNote,
      quickNote: errors.quickNote,
      allNotes: errors.allNotes,
      chapterNotes: errors.chapterNotes
    },
    fetchVerseNotes,
    fetchChapterNotes,
    fetchAllNotes,
    saveStudyNote,
    saveQuickNote,
    saveChapterNote
  };
};
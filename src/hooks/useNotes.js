import { useState, useCallback } from 'react';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useNotes = () => {
  // Move these states to be specific to each operation
  const [loadingStates, setLoadingStates] = useState({
    fetch: false,
    studyNote: false,
    quickNote: false,
    allNotes: false,
    chapterNotes: false,
    singleChapterNote: false
  });
  const [errors, setErrors] = useState({
    fetch: null,
    studyNote: null,
    quickNote: null,
    allNotes: null,
    chapterNotes: null,
    singleChapterNote: null
  });

  // Added state for caching chapter notes
  const [chapterNotesCache, setChapterNotesCache] = useState({});

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

      // Process and update cache
      setChapterNotesCache(prevCache => {
        const updatedCache = { ...prevCache };
        if (!updatedCache[book]) {
          updatedCache[book] = {};
        }
        if (!updatedCache[book][chapter]) {
          updatedCache[book][chapter] = {};
        }
        
        // Group notes by verse
        const notesByVerse = {};
        notes.forEach(note => {
          if (!notesByVerse[note.verse]) {
            notesByVerse[note.verse] = [];
          }
          notesByVerse[note.verse].push(note);
        });

        updatedCache[book][chapter] = notesByVerse;
        return updatedCache;
      });
      
      return notes; // Still return raw notes for potential direct use
    } catch (err) {
      setErrors(prev => ({ ...prev, chapterNotes: err.message }));
      // Clear cache for this chapter on error? Or leave stale? Leaving for now.
      return [];
    } finally {
      setLoadingStates(prev => ({ ...prev, chapterNotes: false }));
    }
  }, [getAuthHeaders]);

  const fetchSingleChapterNote = useCallback(async (book, chapter) => {
    setLoadingStates(prev => ({ ...prev, singleChapterNote: true }));
    setErrors(prev => ({ ...prev, singleChapterNote: null }));
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/notes/chapter/${book}/${chapter}`,
        {
          headers: getAuthHeaders()
        }
      );

      if (response.ok) {
        return await response.json();
      } else if (response.status === 404) {
        return { content: '' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to load chapter note');
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, singleChapterNote: err.message }));
      throw err;
    } finally {
      setLoadingStates(prev => ({ ...prev, singleChapterNote: false }));
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

      const savedNote = await response.json();

      // Update cache after successful save
      setChapterNotesCache(prevCache => {
        const { book, chapter, verse } = noteData; // Use noteData for location
        const newCache = JSON.parse(JSON.stringify(prevCache)); // Deep copy for safety

        if (!newCache[book]) newCache[book] = {};
        if (!newCache[book][chapter]) newCache[book][chapter] = {};
        if (!newCache[book][chapter][verse]) newCache[book][chapter][verse] = [];

        const verseNotes = newCache[book][chapter][verse];
        const noteIndex = verseNotes.findIndex(
          n => n.user?.is_self && n.note_type === 'study' 
        );

        if (noteData.content.trim()) { 
          // Add or Update note
          const noteToCache = {
            ...savedNote, // Use data from response (like ID)
            content: noteData.content, // Ensure content matches what was sent
            book: String(book), // Ensure keys are strings if needed
            chapter: Number(chapter),
            verse: Number(verse),
            note_type: 'study',
             user: { // Add user info if missing from response (should be there ideally)
              ...(savedNote.user || {}), // Keep existing user data from response
              is_self: true,
              username: savedNote.user?.username || 'You' // Placeholder if needed
            }
          };
          
          if (noteIndex >= 0) {
            verseNotes[noteIndex] = noteToCache;
          } else {
            verseNotes.push(noteToCache);
          }
        } else { 
          // Remove note if content is empty (delete)
          if (noteIndex >= 0) {
            verseNotes.splice(noteIndex, 1);
          }
        }
        
        return newCache;
      });

      return savedNote;
    } catch (err) {
      setErrors(prev => ({ ...prev, studyNote: err.message }));
      throw err; // Re-throw error for caller handling
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

      const savedNote = await response.json();
      return savedNote;
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
      chapterNotes: loadingStates.chapterNotes,
      singleChapterNote: loadingStates.singleChapterNote
    },
    error: {
      fetch: errors.fetch,
      studyNote: errors.studyNote,
      quickNote: errors.quickNote,
      allNotes: errors.allNotes,
      chapterNotes: errors.chapterNotes,
      singleChapterNote: errors.singleChapterNote
    },
    chapterNotesCache,
    fetchVerseNotes,
    fetchChapterNotes,
    fetchSingleChapterNote,
    fetchAllNotes,
    saveStudyNote,
    saveQuickNote,
    saveChapterNote
  };
};
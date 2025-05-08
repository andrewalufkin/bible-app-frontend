import { useState, useCallback, useEffect } from 'react';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const useNotes = () => {
  // Log hook initialization and unmount
  useEffect(() => {
    console.log('[useNotes] Hook instance initialized/mounted.');
    const cacheId = Math.random().toString(36).substring(7);
    console.log('[useNotes] Cache instance ID:', cacheId, 'Current chapterNotesCache keys:', Object.keys(chapterNotesCache));

    return () => {
      console.log('[useNotes] Hook instance unmounting/cleaning up. Cache ID:', cacheId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array means it runs once on mount and cleanup on unmount

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
    console.log(`[fetchChapterNotes] Called for ${book} ${chapter}`);
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
      console.log(`[fetchChapterNotes] Received ${notes.length} notes from API for ${book} ${chapter}.`);

      // Process and update cache
      setChapterNotesCache(prevCache => {
        console.log(`[fetchChapterNotes] setChapterNotesCache for ${book} ${chapter}. PrevCache keys:`, Object.keys(prevCache));
        const updatedCache = { ...prevCache };
        if (!updatedCache[book]) {
          updatedCache[book] = {};
        }
        // Ensure chapter is treated as a number for keying, consistent with other parts
        const chapterNum = Number(chapter);
        if (!updatedCache[book][chapterNum]) {
          updatedCache[book][chapterNum] = {};
        }
        
        // Group notes by verse
        const notesByVerse = {};
        notes.forEach(note => {
          const verseNum = Number(note.verse); // Ensure verse key is a number
          if (!notesByVerse[verseNum]) {
            notesByVerse[verseNum] = [];
          }
          notesByVerse[verseNum].push(note);
        });

        updatedCache[book][chapterNum] = notesByVerse;
        console.log(`[fetchChapterNotes] setChapterNotesCache for ${book} ${chapter}. UpdatedCache keys:`, Object.keys(updatedCache));
        // Deep log the specific part of the cache being set for this chapter
        if (updatedCache[book] && updatedCache[book][chapterNum]) {
          console.log(`[fetchChapterNotes] Cache for ${book}/${chapterNum} now contains:`, JSON.parse(JSON.stringify(updatedCache[book][chapterNum])));
        } else {
          console.log(`[fetchChapterNotes] Cache for ${book}/${chapterNum} is empty or not set as expected.`);
        }
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
    console.log('[saveStudyNote] Called with noteData:', JSON.parse(JSON.stringify(noteData)));
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

      console.log('[saveStudyNote] API Response Status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error JSON' }));
        console.error('[saveStudyNote] API Error Data:', errorData);
        throw new Error(errorData.message || 'Failed to save study note');
      }

      const responseData = await response.json(); 
      console.log('[saveStudyNote] API Response Data (responseData):', JSON.parse(JSON.stringify(responseData)));
      const actualSavedNote = responseData.note; 
      console.log('[saveStudyNote] Extracted actualSavedNote:', JSON.parse(JSON.stringify(actualSavedNote)));

      // Update cache after successful save
      setChapterNotesCache(prevCache => {
        console.log('[saveStudyNote] setChapterNotesCache - prevCache:', JSON.parse(JSON.stringify(prevCache)));
        const { book } = noteData; 
        const chapterNum = Number(noteData.chapter); 
        const verseNum = Number(noteData.verse);     
        console.log(`[saveStudyNote] setChapterNotesCache - Keying with: book=${book}, chapter=${chapterNum}, verse=${verseNum}`);

        const newCache = JSON.parse(JSON.stringify(prevCache)); 

        if (!newCache[book]) newCache[book] = {};
        if (!newCache[book][chapterNum]) newCache[book][chapterNum] = {}; 
        if (!newCache[book][chapterNum][verseNum]) newCache[book][chapterNum][verseNum] = []; 

        const verseNotes = newCache[book][chapterNum][verseNum];
        console.log('[saveStudyNote] setChapterNotesCache - verseNotes before update:', JSON.parse(JSON.stringify(verseNotes)));
        
        let noteIndex = -1;
        if (actualSavedNote && actualSavedNote.id) {
          noteIndex = verseNotes.findIndex(n => n.id === actualSavedNote.id);
        }
        if (noteIndex === -1) { 
          noteIndex = verseNotes.findIndex(
            n => n.user?.is_self && n.note_type === 'study'
          );
        }
        console.log('[saveStudyNote] setChapterNotesCache - Found noteIndex:', noteIndex);

        if (noteData.content.trim()) { 
          const noteToCache = {
            ...actualSavedNote,
            content: actualSavedNote.content || '', 
            book: String(book), 
            chapter: Number(chapterNum),
            verse: Number(verseNum),
            note_type: 'study',
            user: { 
              is_self: true,
            }
          };
          console.log('[saveStudyNote] setChapterNotesCache - noteToCache:', JSON.parse(JSON.stringify(noteToCache)));
          
          if (noteIndex >= 0) {
            verseNotes[noteIndex] = noteToCache;
            console.log('[saveStudyNote] setChapterNotesCache - Updated note in verseNotes.');
          } else {
            verseNotes.push(noteToCache);
            console.log('[saveStudyNote] setChapterNotesCache - Pushed new note to verseNotes.');
          }
        } else { 
          let indexToRemove = -1;
          if (actualSavedNote && actualSavedNote.id) {
            indexToRemove = verseNotes.findIndex(n => n.id === actualSavedNote.id);
          }
          if (indexToRemove === -1) { 
            indexToRemove = verseNotes.findIndex(
              n => n.user?.is_self && n.note_type === 'study'
            );
          }
          console.log('[saveStudyNote] setChapterNotesCache - Found indexToRemove for delete:', indexToRemove);

          if (indexToRemove >= 0) {
            verseNotes.splice(indexToRemove, 1);
            console.log('[saveStudyNote] setChapterNotesCache - Removed note from verseNotes.');
          }
        }
        console.log('[saveStudyNote] setChapterNotesCache - verseNotes after update:', JSON.parse(JSON.stringify(verseNotes)));
        console.log('[saveStudyNote] setChapterNotesCache - newCache to be returned:', JSON.parse(JSON.stringify(newCache)));
        return newCache;
      });

      console.log('[saveStudyNote] Returning responseData:', JSON.parse(JSON.stringify(responseData)));
      return responseData; 
    } catch (err) {
      console.error('[saveStudyNote] Error caught:', err);
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
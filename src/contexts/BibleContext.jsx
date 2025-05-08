// src/contexts/BibleContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { BOOK_CHAPTER_COUNTS } from '../constants/bibleData';

const BibleContext = createContext();

export const BibleProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // chapterCount was unused, removing for now to simplify context value
  // const [chapterCount, setChapterCount] = useState({}); 

  const API_BASE_URL = useMemo(() => `${process.env.REACT_APP_BACKEND_URL}/api/bible`, []);
  // console.log('Using API URL:', API_BASE_URL); // Debug log can be re-enabled if needed

  const fetchWithTimeout = useCallback(async (url, options = {}, timeout = 30000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    const fetchOptions = {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };
    
    try {
      const response = await fetch(url, fetchOptions);
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }, []); // Empty dependency array as it doesn't depend on provider state/props

  const handleApiResponse = useCallback(async (response, errorMessage) => {
    if (!response.ok) {
      throw new Error(`${errorMessage}: ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    // console.log('Raw response:', text); 
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error('JSON parse error:', err);
      throw new Error(`Failed to parse response: ${err.message}`);
    }
  }, []); // Empty dependency array

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true); // Set loading true at the start of fetchBooks
      try {
        // console.log('Fetching books from:', `${API_BASE_URL}/books`);
        const response = await fetchWithTimeout(`${API_BASE_URL}/books`, {}, 60000);
        const data = await handleApiResponse(response, 'Failed to fetch books');
        // console.log('Parsed books data for /api/bible/books:', data);
        
        if (Array.isArray(data)) {
          const bookNames = data.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null && typeof item.name === 'string') return item.name;
            if (typeof item === 'object' && item !== null && typeof item.book_name === 'string') return item.book_name;
            console.warn('[BibleContext] Book item is not a string or a recognized object:', item);
            return null;
          }).filter(name => name !== null);

          setBooks(bookNames);
          
          if (bookNames.length > 0) {
            const firstBookName = bookNames[0];
            // console.log('[BibleContext] Setting current book to:', firstBookName);
            // setCurrentBook will trigger its own fetchVerses via another useEffect
            setCurrentBook(firstBookName); 
            // Chapter count is derived, not set directly here anymore for chapterCount state
            // if (BOOK_CHAPTER_COUNTS[firstBookName]) {
            //   setCurrentChapter(1); // This is implicitly handled by setCurrentBook if it changes chapter
            // }
          } else {
            console.warn('[BibleContext] No valid book names found after processing API response.');
            setError('No valid books found.');
            setBooks([]);
            setCurrentBook(null); // Clear current book if no books are found
            setCurrentChapter(1);
          }
        } else {
          console.error('[BibleContext] /api/bible/books did not return an array. Received:', data);
          setError('Invalid book data format from server.');
          setBooks([]);
          setCurrentBook(null);
          setCurrentChapter(1);
        }
      } catch (err) {
        const errorMsg = `Failed to load Bible books: ${err.message}`;
        console.error(errorMsg);
        setError(errorMsg);
      } finally {
        setIsLoading(false); // Set loading false at the end
      }
    };
    
    fetchBooks();
  }, [API_BASE_URL, fetchWithTimeout, handleApiResponse]);

  const fetchVerses = useCallback(async (book, chapter) => {
    if (!book || (typeof book !== 'string')) {
      console.warn('[BibleContext] fetchVerses called with invalid book:', book);
      setVerses([]);
      setIsLoading(false); // Ensure loading is set to false
      return;
    }
    if (!chapter || (typeof chapter !== 'number' && typeof chapter !== 'string')) {
        console.warn('[BibleContext] fetchVerses called with invalid chapter:', chapter);
        setVerses([]);
        setIsLoading(false); // Ensure loading is set to false
        return;
    }
    
    setIsLoading(true);
    setError(null); // Clear previous errors before fetching verses
    try {
      const endpoint = `${API_BASE_URL}/verses/${book}/${chapter}`;
      // console.log('Fetching verses from:', endpoint);
      
      const response = await fetchWithTimeout(endpoint, {}, 60000);
      const data = await handleApiResponse(response, 'Failed to fetch verses');
      // console.log('Parsed verses data:', data);
      
      const processedVerses = Array.isArray(data) ? data.map(v => ({
        ...v,
        text: typeof v.text === 'string' ? v.text : '[Invalid Verse Text]'
      })) : [];
      if (!Array.isArray(data)) {
        console.error('[BibleContext] Verses API did not return an array:', data);
        setError('Invalid verse data format from server.');
      }
      setVerses(processedVerses);
    } catch (err) {
      const errorMsg = `Failed to load verses for ${book} ${chapter}: ${err.message}`;
      console.error(errorMsg);
      setError(errorMsg);
      setVerses([]);
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL, fetchWithTimeout, handleApiResponse]); 

  useEffect(() => {
    if (currentBook && currentChapter) {
        // console.log(`[BibleContext] useEffect detected change in currentBook (${currentBook}) or currentChapter (${currentChapter}), calling fetchVerses.`);
        fetchVerses(currentBook, currentChapter);
    }
  }, [currentBook, currentChapter, fetchVerses]);

  const getChapterCount = useCallback((book) => {
    if (!book || typeof book !== 'string') return 1; // Ensure book is a string
    return BOOK_CHAPTER_COUNTS[book] || 1;
  }, []);

  const chapterOptions = useMemo(() => {
    if (!currentBook) return [];
    const count = getChapterCount(currentBook);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [currentBook, getChapterCount]);

  // Stable setters from useState don't need to be in useMemo deps for the value object itself
  // if the functions themselves are passed directly. But if you are creating new functions
  // (e.g. wrapped setters) then they would need useCallback and be in deps.
  // Here, setCurrentBook and setCurrentChapter are directly from useState.
  const value = useMemo(() => ({
    books,
    currentBook,
    currentChapter,
    verses,
    isLoading,
    error,
    setCurrentBook,
    setCurrentChapter,
    chapterOptions,
    fetchVerses,
    getChapterCount
  }), [
    books,
    currentBook,
    currentChapter,
    verses,
    isLoading,
    error,
    setCurrentBook, // technically stable, but good practice if value depends on it
    setCurrentChapter, // technically stable
    chapterOptions,
    fetchVerses,
    getChapterCount
  ]);

  return (
    <BibleContext.Provider value={value}>
      {children}
    </BibleContext.Provider>
  );
};

export const useBible = () => {
  const context = useContext(BibleContext);
  if (context === undefined) {
    throw new Error('useBible must be used within a BibleProvider');
  }
  return context;
};

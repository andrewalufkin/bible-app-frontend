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
  const [chapterCount, setChapterCount] = useState({}); // Store chapter counts for each book

  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api/bible`;
  console.log('Using API URL:', API_BASE_URL); // Debug log

  // Helper function for fetch with timeout
  const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
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
  };

  // Helper function to handle API responses
  const handleApiResponse = async (response, errorMessage) => {
    if (!response.ok) {
      throw new Error(`${errorMessage}: ${response.status} ${response.statusText}`);
    }
    
    // Get the raw text first
    const text = await response.text();
    console.log('Raw response:', text); // Debug log
    
    try {
      // Try to parse the JSON
      return JSON.parse(text);
    } catch (err) {
      console.error('JSON parse error:', err);
      throw new Error(`Failed to parse response: ${err.message}`);
    }
  };

  // Fetch list of books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        console.log('Fetching books from:', `${API_BASE_URL}/books`);
        const response = await fetchWithTimeout(`${API_BASE_URL}/books`, {}, 60000);
        const data = await handleApiResponse(response, 'Failed to fetch books');
        console.log('Parsed books data for /api/bible/books:', data);
        
        // Ensure data is an array before proceeding
        if (Array.isArray(data)) {
          // Assuming the API should return an array of strings (book names)
          // or an array of objects where each object has a string property for the book name.
          const bookNames = data.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null && typeof item.name === 'string') return item.name;
            if (typeof item === 'object' && item !== null && typeof item.book_name === 'string') return item.book_name; // Common alternative
            console.warn('[BibleContext] Book item is not a string or a recognized object:', item);
            return null; // Or handle as an error
          }).filter(name => name !== null); // Filter out any nulls from unrecognized items

          setBooks(bookNames);
          
          if (bookNames.length > 0) {
            const firstBookName = bookNames[0]; // This is now guaranteed to be a string
            console.log('[BibleContext] Setting current book to:', firstBookName);
            setCurrentBook(firstBookName);
            
            const count = BOOK_CHAPTER_COUNTS[firstBookName] || 1;
            setChapterCount(prev => ({
              ...prev,
              [firstBookName]: count
            }));
            
            if (count > 0) {
              setCurrentChapter(1);
            }
          } else {
            console.warn('[BibleContext] No valid book names found after processing API response.');
            setError('No valid books found.'); // Set an error if no books could be processed
          }
        } else {
          console.error('[BibleContext] /api/bible/books did not return an array. Received:', data);
          setError('Invalid book data format from server.');
          setBooks([]); // Clear books if data format is incorrect
        }
        
        // setError(null); // This was here, but error might be set above.
                       // Let specific errors persist if set.
      } catch (err) {
        const errorMsg = `Failed to load Bible books: ${err.message}`;
        console.error(errorMsg);
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBooks();
  }, [API_BASE_URL]); // Added API_BASE_URL to dependencies as it's used inside

  // Fetch verses when book or chapter changes
  const fetchVerses = useCallback(async (book, chapter) => { // Made this a useCallback to be passed to BibleReader
    if (!book || (typeof book !== 'string')) { // Ensure book is a string
      console.warn('[BibleContext] fetchVerses called with invalid book:', book);
      setVerses([]); // Clear verses if book is invalid
      return;
    }
    if (!chapter || (typeof chapter !== 'number' && typeof chapter !== 'string')) { // Ensure chapter is valid
        console.warn('[BibleContext] fetchVerses called with invalid chapter:', chapter);
        setVerses([]);
        return;
    }
    
    setIsLoading(true);
    try {
      const endpoint = `${API_BASE_URL}/verses/${book}/${chapter}`;
      console.log('Fetching verses from:', endpoint);
      
      const response = await fetchWithTimeout(endpoint, {}, 60000);
      const data = await handleApiResponse(response, 'Failed to fetch verses');
      console.log('Parsed verses data:', data);
      
      // Ensure verse text is a string
      const processedVerses = Array.isArray(data) ? data.map(v => ({
        ...v,
        text: typeof v.text === 'string' ? v.text : '[Invalid Verse Text]'
      })) : [];
      if (!Array.isArray(data)) {
        console.error('[BibleContext] Verses API did not return an array:', data);
        setError('Invalid verse data format from server.');
      }

      setVerses(processedVerses);
      // setError(null); // Clear previous errors if successful
    } catch (err) {
      const errorMsg = `Failed to load verses for ${book} ${chapter}: ${err.message}`;
      console.error(errorMsg);
      setError(errorMsg);
      setVerses([]); // Clear verses on error
    } finally {
      setIsLoading(false);
    }
  }, [API_BASE_URL]); // Added API_BASE_URL to dependencies

  // Effect to call fetchVerses when currentBook or currentChapter changes
  useEffect(() => {
    if (currentBook && currentChapter) {
        fetchVerses(currentBook, currentChapter);
    }
  }, [currentBook, currentChapter, fetchVerses]);

  // Function to get chapter count for a book
  const getChapterCount = useCallback((book) => {
    if (!book) return 1;
    return BOOK_CHAPTER_COUNTS[book] || 1;
  }, []);

  // Generate chapter options for the current book
  const chapterOptions = useMemo(() => {
    if (!currentBook) return [];
    const count = getChapterCount(currentBook);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [currentBook, getChapterCount]);

  const value = {
    books,
    currentBook,
    currentChapter,
    verses,
    isLoading,
    error,
    setCurrentBook, // Make sure this correctly sets a string
    setCurrentChapter,
    chapterOptions,
    fetchVerses, // Provide the wrapped fetchVerses
    getChapterCount
    // loadChapter was removed as its logic is covered by setCurrentBook/setCurrentChapter and the useEffect for fetchVerses
  };

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

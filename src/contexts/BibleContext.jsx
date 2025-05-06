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
        console.log('Fetching books from:', `${API_BASE_URL}/books`); // Debug log
        
        const response = await fetchWithTimeout(`${API_BASE_URL}/books`, {}, 60000); // Increased timeout to 60s
        
        const data = await handleApiResponse(response, 'Failed to fetch books');
        console.log('Parsed books data:', data); // Debug log
        
        setBooks(data);
        
        // Set Genesis as default book if available
        if (data && data.length > 0) {
          const firstBook = data[0]; // Usually Genesis
          setCurrentBook(firstBook);
          
          // Set chapter count for the first book using our constant
          const count = BOOK_CHAPTER_COUNTS[firstBook] || 1;
          setChapterCount(prev => ({
            ...prev,
            [firstBook]: count
          }));
          
          if (count > 0) {
            setCurrentChapter(1);
          }
        }
        
        setError(null);
      } catch (err) {
        const errorMsg = `Failed to load Bible books: ${err.message}`;
        console.error(errorMsg);
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBooks();
  }, []);

  // Fetch verses when book or chapter changes
  useEffect(() => {
    const fetchVerses = async () => {
      if (!currentBook) return;
      
      setIsLoading(true);
      try {
        const endpoint = `${API_BASE_URL}/verses/${currentBook}/${currentChapter}`;
        console.log('Fetching verses from:', endpoint); // Debug log
        
        const response = await fetchWithTimeout(endpoint, {}, 60000); // Increased timeout to 60s
        
        const data = await handleApiResponse(response, 'Failed to fetch verses');
        console.log('Parsed verses data:', data); // Debug log
        
        setVerses(data);
        setError(null);
      } catch (err) {
        const errorMsg = `Failed to load verses: ${err.message}`;
        console.error(errorMsg);
        setError(errorMsg);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerses();
  }, [currentBook, currentChapter]);

  // Function to get chapter count for a book
  const getChapterCount = useCallback((book) => {
    if (!book) return 1;
    return BOOK_CHAPTER_COUNTS[book] || 1;
  }, []);

  // Load specific book and chapter
  const loadChapter = useCallback(async (book, chapter) => {
    if (!book) return Promise.resolve();
    
    setCurrentBook(book);
    setCurrentChapter(chapter);
    
    // Set chapter count for the book using our constant
    const count = BOOK_CHAPTER_COUNTS[book] || 1;
    setChapterCount(prev => ({
      ...prev,
      [book]: count
    }));
    
    return Promise.resolve();
  }, []);

  // Generate chapter options for the current book
  const chapterOptions = useMemo(() => {
    if (!currentBook) return [];
    
    const count = BOOK_CHAPTER_COUNTS[currentBook] || 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [currentBook]);

  const value = {
    books,
    currentBook,
    currentChapter,
    verses,
    isLoading,
    error,
    setCurrentBook,
    setCurrentChapter,
    chapterOptions,
    loadChapter,
    getChapterCount
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
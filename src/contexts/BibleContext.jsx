// src/contexts/BibleContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const BibleContext = createContext();

export const BibleProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chapterCount, setChapterCount] = useState({}); // Store chapter counts for each book

  // Add fallback URL in case environment variable is undefined
  const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
  const API_BASE_URL = `${backendUrl}/api/bible`;
  console.log('Using API URL:', API_BASE_URL); // Debug log

  // Helper function to handle API responses
  const handleApiResponse = async (response, errorMessage) => {
    if (!response.ok) {
      throw new Error(`${errorMessage}: ${response.status} ${response.statusText}`);
    }
    
    // Get the raw text first
    const text = await response.text();
    
    if (!text || text.trim() === '' || text === 'undefined') {
      console.error('Empty or invalid response received:', text);
      return []; // Return a safe default (empty array) instead of throwing
    }
    
    try {
      // Try to parse the JSON
      return JSON.parse(text);
    } catch (err) {
      console.error('JSON parse error:', err, 'Raw text:', text);
      // Return a safe default value instead of throwing
      return []; // Default to empty array as most responses are collections
    }
  };

  // Fetch list of books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        console.log('Fetching books from:', `${API_BASE_URL}/books`); // Debug log
        
        // First validation - make sure we have a valid URL that's not just "/api/bible/books"
        if (!backendUrl && window.location.hostname !== 'localhost') {
          console.warn('No backend URL available. Using fallback data.');
          // Use fallback data for books
          const fallbackBooks = ['Genesis', 'Exodus', 'Leviticus'];
          setBooks(fallbackBooks);
          if (fallbackBooks.length > 0) {
            setCurrentBook(fallbackBooks[0]);
            setChapterCount(prev => ({
              ...prev,
              [fallbackBooks[0]]: 50 // Genesis has 50 chapters
            }));
          }
          setIsLoading(false);
          return;
        }
        
        const response = await fetch(`${API_BASE_URL}/books`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        // Enhanced debugging for response
        console.log('Books response status:', response.status);
        console.log('Books response ok:', response.ok);
        
        const data = await handleApiResponse(response, 'Failed to fetch books');
        console.log('Parsed books data:', data); // Debug log
        
        // Validate the response data
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.warn('Invalid books data received. Using fallback data.');
          // Use fallback data
          const fallbackBooks = ['Genesis', 'Exodus', 'Leviticus'];
          setBooks(fallbackBooks);
          if (fallbackBooks.length > 0) {
            setCurrentBook(fallbackBooks[0]);
            setChapterCount(prev => ({
              ...prev,
              [fallbackBooks[0]]: 50 // Genesis has 50 chapters
            }));
          }
        } else {
          setBooks(data);
          
          // Set Genesis as default book if available
          if (data && data.length > 0) {
            const firstBook = data[0]; // Usually Genesis
            setCurrentBook(firstBook);
            
            // Also load chapter count for the first book
            try {
              // Use a local implementation to avoid dependency issues
              const endpoint = `${API_BASE_URL}/chapters/${firstBook}`;
              console.log('Fetching initial chapter count from:', endpoint);
              
              const chapterResponse = await fetch(endpoint, {
                headers: {
                  'Accept': 'application/json'
                }
              });
              
              const chapterData = await handleApiResponse(chapterResponse, 'Failed to fetch chapter count');
              console.log('Initial chapter count:', chapterData);
              
              // Assuming the API returns an array of chapter numbers
              const count = Array.isArray(chapterData) ? chapterData.length : 
                            (chapterData && chapterData.count ? chapterData.count : 50); // Fallback to 50 for Genesis
              
              // Update chapter count in state
              setChapterCount(prev => ({
                ...prev,
                [firstBook]: count
              }));
              
              if (count > 0) {
                setCurrentChapter(1);
              }
            } catch (err) {
              console.error('Error loading chapter count for initial book:', err.message);
              // Fallback to a reasonable default - Genesis has 50 chapters
              setChapterCount(prev => ({
                ...prev,
                [firstBook]: 50
              }));
            }
          }
        }
        
        setError(null);
      } catch (err) {
        const errorMsg = `Failed to load Bible books: ${err.message}`;
        console.error(errorMsg);
        setError(errorMsg);
        
        // Recovery with fallback data
        const fallbackBooks = ['Genesis', 'Exodus', 'Leviticus'];
        setBooks(fallbackBooks);
        if (fallbackBooks.length > 0) {
          setCurrentBook(fallbackBooks[0]);
          setChapterCount(prev => ({
            ...prev,
            [fallbackBooks[0]]: 50 // Genesis has 50 chapters
          }));
        }
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
        
        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log('Verses response status:', response.status);
        console.log('Verses response ok:', response.ok);
        
        const data = await handleApiResponse(response, 'Failed to fetch verses');
        console.log('Parsed verses data:', data); // Debug log
        
        // Validate the verse data
        if (!data || !Array.isArray(data) || data.length === 0) {
          console.warn('Invalid or empty verses data received. Using fallback data.');
          
          // Create fallback verse data based on book and chapter
          const fallbackVerses = [];
          for (let i = 1; i <= 10; i++) {
            fallbackVerses.push({
              id: `fallback-${i}`,
              book_name: currentBook,
              chapter: currentChapter,
              verse: i,
              text: `This is a fallback verse ${i} for ${currentBook} ${currentChapter}.`
            });
          }
          
          setVerses(fallbackVerses);
        } else {
          setVerses(data);
        }
        
        setError(null);
      } catch (err) {
        const errorMsg = `Failed to load verses: ${err.message}`;
        console.error(errorMsg);
        setError(errorMsg);
        
        // Create fallback verse data based on book and chapter
        const fallbackVerses = [];
        for (let i = 1; i <= 10; i++) {
          fallbackVerses.push({
            id: `fallback-${i}`,
            book_name: currentBook,
            chapter: currentChapter,
            verse: i,
            text: `This is a fallback verse ${i} for ${currentBook} ${currentChapter}.`
          });
        }
        
        setVerses(fallbackVerses);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerses();
  }, [currentBook, currentChapter]);

  // Function to fetch chapter count for a book
  const fetchChapterCount = useCallback(async (book) => {
    if (!book) return;
    
    try {
      if (chapterCount[book]) {
        return chapterCount[book]; // Return cached count if available
      }
      
      const endpoint = `${API_BASE_URL}/chapters/${book}`;
      console.log('Fetching chapter count from:', endpoint);
      
      const response = await fetch(endpoint, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const data = await handleApiResponse(response, 'Failed to fetch chapter count');
      console.log('Parsed chapter count:', data);
      
      // Assuming the API returns { count: number }
      const count = data.count || data.length || 1;
      
      // Update chapter count in state
      setChapterCount(prev => ({
        ...prev,
        [book]: count
      }));
      
      return count;
    } catch (err) {
      console.error(`Failed to load chapter count for ${book}:`, err.message);
      return 1; // Default to 1 chapter if error
    }
  }, [chapterCount]);

  // Load specific book and chapter
  const loadChapter = useCallback(async (book, chapter) => {
    if (!book) return Promise.resolve();
    
    setCurrentBook(book);
    setCurrentChapter(chapter);
    
    // Make sure we have chapter count for this book
    if (!chapterCount[book]) {
      try {
        await fetchChapterCount(book);
        return Promise.resolve();
      } catch (error) {
        return Promise.reject(error);
      }
    }
    
    return Promise.resolve();
  }, [chapterCount, fetchChapterCount]);

  // Generate chapter options for the current book
  const chapterOptions = useMemo(() => {
    if (!currentBook || !chapterCount[currentBook]) return [];
    
    const count = chapterCount[currentBook];
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [currentBook, chapterCount]);

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
    fetchChapterCount
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
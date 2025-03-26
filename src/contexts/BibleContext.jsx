// src/contexts/BibleContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const BibleContext = createContext();

// Fallback data for when API fails
const FALLBACK_BOOKS = ["Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy"];
const FALLBACK_CHAPTERS = {
  "Genesis": 50,
  "Exodus": 40,
  "Leviticus": 27,
  "Numbers": 36,
  "Deuteronomy": 34
};

export const BibleProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chapterCount, setChapterCount] = useState({}); // Store chapter counts for each book
  const [useFallback, setUseFallback] = useState(false);

  // Construct API URL with safeguards
  const getApiBaseUrl = useCallback(() => {
    // Get the base URL
    const baseUrl = process.env.REACT_APP_BACKEND_URL;
    
    // Log the raw environment variable
    console.log('Raw REACT_APP_BACKEND_URL:', baseUrl);
    
    if (!baseUrl) {
      console.error('REACT_APP_BACKEND_URL is undefined');
      return null;
    }
    
    // Make sure no trailing slash
    const cleanBaseUrl = baseUrl.endsWith('/') 
      ? baseUrl.slice(0, -1) 
      : baseUrl;
      
    return `${cleanBaseUrl}/api/bible`;
  }, []);
  
  const API_BASE_URL = getApiBaseUrl();
  console.log('Using API URL:', API_BASE_URL); // Debug log

  // Helper function to handle API responses
  const handleApiResponse = async (response, errorMessage, fallbackData = null) => {
    console.log('Response headers:', Object.fromEntries([...response.headers]));
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`${errorMessage}: ${response.status} ${response.statusText}`);
    }
    
    // Get the raw text first
    let text;
    try {
      text = await response.text();
      console.log('Raw response text length:', text.length);
      console.log('Raw response preview:', text.substring(0, 100)); // Show first 100 chars
    } catch (err) {
      console.error('Error reading response text:', err);
      if (fallbackData) {
        console.warn('Using fallback data due to text extraction error');
        setUseFallback(true);
        return fallbackData;
      }
      throw err;
    }
    
    // Check for empty or invalid responses
    if (!text || text.trim() === '' || text.includes('undefined')) {
      console.error('Received invalid response:', text);
      if (fallbackData) {
        console.warn('Using fallback data due to invalid response');
        setUseFallback(true);
        return fallbackData;
      }
      throw new Error(`Invalid API response: ${text}`);
    }
    
    try {
      // Try to parse the JSON
      return JSON.parse(text);
    } catch (err) {
      console.error('JSON parse error:', err, 'for text:', text);
      if (fallbackData) {
        console.warn('Using fallback data due to JSON parse error');
        setUseFallback(true);
        return fallbackData;
      }
      throw new Error(`Failed to parse response: ${err.message}`);
    }
  };

  // Fetch list of books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        if (!API_BASE_URL) {
          throw new Error('API base URL is not available');
        }
        
        const endpoint = `${API_BASE_URL}/books`;
        console.log('Fetching books from:', endpoint);
        console.log('Environment:', process.env.NODE_ENV);
        
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          const data = await handleApiResponse(
            response, 
            'Failed to fetch books', 
            FALLBACK_BOOKS
          );
          
          console.log('Parsed books data:', data);
          setBooks(data);
          
          // Set Genesis as default book if available
          if (data && data.length > 0) {
            const firstBook = data[0]; // Usually Genesis
            setCurrentBook(firstBook);
            
            // Also load chapter count for the first book
            try {
              if (useFallback) {
                // Use fallback chapter count
                setChapterCount(prev => ({
                  ...prev,
                  [firstBook]: FALLBACK_CHAPTERS[firstBook] || 50
                }));
                setCurrentChapter(1);
              } else {
                // Try to get real chapter count
                const chapterEndpoint = `${API_BASE_URL}/chapters/${firstBook}`;
                console.log('Fetching initial chapter count from:', chapterEndpoint);
                
                const chapterResponse = await fetch(chapterEndpoint, {
                  headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache'
                  }
                });
                
                const chapterData = await handleApiResponse(
                  chapterResponse, 
                  'Failed to fetch chapter count',
                  Array.from({length: FALLBACK_CHAPTERS[firstBook] || 50}, (_, i) => i + 1)
                );
                
                console.log('Initial chapter count:', chapterData);
                
                // Assuming the API returns an array of chapter numbers
                const count = chapterData.length || 1;
                
                // Update chapter count in state
                setChapterCount(prev => ({
                  ...prev,
                  [firstBook]: count
                }));
                
                setCurrentChapter(1);
              }
            } catch (err) {
              console.error('Error loading chapter count for initial book:', err.message);
              // Fallback to hard-coded chapter count
              setChapterCount(prev => ({
                ...prev,
                [firstBook]: FALLBACK_CHAPTERS[firstBook] || 50
              }));
              setCurrentChapter(1);
            }
          }
          
          setError(null);
        } catch (fetchErr) {
          console.error('Fetch failed:', fetchErr);
          throw fetchErr;
        }
      } catch (err) {
        const errorMsg = `Failed to load Bible books: ${err.message}`;
        console.error(errorMsg);
        setError(errorMsg);
        
        // Use fallback data if we have a critical error
        setBooks(FALLBACK_BOOKS);
        setCurrentBook(FALLBACK_BOOKS[0]);
        setChapterCount(FALLBACK_CHAPTERS);
        setUseFallback(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBooks();
  }, [API_BASE_URL, useFallback]);

  // Fetch verses when book or chapter changes
  useEffect(() => {
    const fetchVerses = async () => {
      if (!currentBook) return;
      
      setIsLoading(true);
      try {
        if (useFallback) {
          console.log('Using fallback verses data');
          // Provide simple fallback verses when API access fails
          const fallbackVerses = Array.from({length: 31}, (_, i) => ({
            id: `fallback-${i+1}`,
            book: currentBook,
            chapter: currentChapter,
            verse: i+1,
            text: `Fallback verse ${i+1} content for ${currentBook} ${currentChapter}:${i+1}`
          }));
          
          setVerses(fallbackVerses);
          setError(null);
          setIsLoading(false);
          return;
        }
        
        if (!API_BASE_URL) {
          throw new Error('API base URL is not available');
        }
        
        const endpoint = `${API_BASE_URL}/verses/${currentBook}/${currentChapter}`;
        console.log('Fetching verses from:', endpoint);
        console.log('Environment:', process.env.NODE_ENV);
        console.log('Current book:', currentBook);
        console.log('Current chapter:', currentChapter);
        
        try {
          const response = await fetch(endpoint, {
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache'
            }
          });
          
          // Log response status before parsing
          console.log('Response status:', response.status, response.statusText);
          
          // Create fallback verses data
          const fallbackVerses = Array.from({length: 31}, (_, i) => ({
            id: `fallback-${i+1}`,
            book: currentBook,
            chapter: currentChapter,
            verse: i+1,
            text: `Fallback verse ${i+1} content for ${currentBook} ${currentChapter}:${i+1}`
          }));
          
          const data = await handleApiResponse(
            response, 
            'Failed to fetch verses',
            fallbackVerses
          );
          
          console.log('Parsed verses data length:', data.length);
          if (data.length > 0) {
            console.log('First verse sample:', data[0]);
          }
          
          setVerses(data);
          setError(null);
        } catch (fetchErr) {
          console.error('Verses fetch failed:', fetchErr);
          throw fetchErr;
        }
      } catch (err) {
        const errorMsg = `Failed to load verses: ${err.message}`;
        console.error(errorMsg);
        setError(errorMsg);
        
        // Use fallback verses when API fails
        const fallbackVerses = Array.from({length: 31}, (_, i) => ({
          id: `fallback-${i+1}`,
          book: currentBook,
          chapter: currentChapter,
          verse: i+1,
          text: `Fallback verse ${i+1} content for ${currentBook} ${currentChapter}:${i+1}`
        }));
        
        setVerses(fallbackVerses);
        setUseFallback(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVerses();
  }, [currentBook, currentChapter, API_BASE_URL, useFallback]);

  // Function to fetch chapter count for a book
  const fetchChapterCount = useCallback(async (book) => {
    if (!book) return 1;
    
    try {
      if (chapterCount[book]) {
        return chapterCount[book]; // Return cached count if available
      }
      
      if (useFallback) {
        const count = FALLBACK_CHAPTERS[book] || 30;
        setChapterCount(prev => ({
          ...prev,
          [book]: count
        }));
        return count;
      }
      
      if (!API_BASE_URL) {
        throw new Error('API base URL is not available');
      }
      
      const endpoint = `${API_BASE_URL}/chapters/${book}`;
      console.log('Fetching chapter count from:', endpoint);
      
      try {
        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        // Fallback chapter list if needed
        const fallbackChapters = Array.from(
          {length: FALLBACK_CHAPTERS[book] || 30}, 
          (_, i) => i + 1
        );
        
        const data = await handleApiResponse(
          response, 
          'Failed to fetch chapter count',
          fallbackChapters
        );
        
        console.log('Parsed chapter count:', data);
        
        // Assuming the API returns an array of chapter numbers
        const count = data.count || data.length || 1;
        
        // Update chapter count in state
        setChapterCount(prev => ({
          ...prev,
          [book]: count
        }));
        
        return count;
      } catch (fetchErr) {
        console.error('Chapter count fetch failed:', fetchErr);
        throw fetchErr;
      }
    } catch (err) {
      console.error(`Failed to load chapter count for ${book}:`, err.message);
      
      // Use fallback chapter count
      const fallbackCount = FALLBACK_CHAPTERS[book] || 30;
      setChapterCount(prev => ({
        ...prev,
        [book]: fallbackCount
      }));
      
      return fallbackCount;
    }
  }, [chapterCount, API_BASE_URL, useFallback]);

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
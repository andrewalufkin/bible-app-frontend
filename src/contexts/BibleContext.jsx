// src/contexts/BibleContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const BibleContext = createContext();

export const BibleProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api/bible`;
  console.log('Using API URL:', API_BASE_URL); // Debug log

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
        
        const response = await fetch(`${API_BASE_URL}/books`, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        const data = await handleApiResponse(response, 'Failed to fetch books');
        console.log('Parsed books data:', data); // Debug log
        
        setBooks(data);
        
        // Set Genesis as default book if available
        if (data && data.length > 0) {
          setCurrentBook(data[0]);
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
        
        const response = await fetch(endpoint, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
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

  const value = {
    books,
    currentBook,
    currentChapter,
    verses,
    isLoading,
    error,
    setCurrentBook,
    setCurrentChapter,
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
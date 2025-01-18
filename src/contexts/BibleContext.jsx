// src/contexts/BibleContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const BibleContext = createContext();

const API_BASE_URL = 'http://localhost:5001/api/bible';

export const BibleProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch list of books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/books`);
        if (!response.ok) throw new Error('Failed to fetch books');
        const data = await response.json();
        setBooks(data);
        
        // Set Genesis as default book
        const firstBook = data[0];
        if (firstBook) {
          setCurrentBook(firstBook);
        }
      } catch (err) {
        setError('Failed to load Bible books');
        console.error('Error fetching books:', err);
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
        const response = await fetch(
          `${API_BASE_URL}/verses/${currentBook}/${currentChapter}`
        );
        if (!response.ok) throw new Error('Failed to fetch verses');
        const data = await response.json();
        setVerses(data);
        setError(null);
      } catch (err) {
        setError('Failed to load verses');
        console.error('Error fetching verses:', err);
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
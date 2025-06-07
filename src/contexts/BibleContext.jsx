// src/contexts/BibleContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { BOOK_CHAPTER_COUNTS } from '../constants/bibleData';

const BIBLICAL_BOOKS = [
  'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
  'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel', '1 Kings',
  '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra', 'Nehemiah',
  'Esther', 'Job', 'Psalms', 'Proverbs', 'Ecclesiastes',
  'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
  'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos', 'Obadiah',
  'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai',
  'Zechariah', 'Malachi',
  'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
  '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
  'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
  '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
  'James', '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
  'Jude', 'Revelation'
];

const BibleContext = createContext();

export const BibleProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [currentBook, setCurrentBook] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [verses, setVerses] = useState([]);
  // Simple in-memory cache to avoid refetching verses we've already loaded
  const [versesCache, setVersesCache] = useState({});
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
        // No API call needed, use the constant
        const bookNames = BIBLICAL_BOOKS;
        
        setBooks(bookNames);
        
        if (bookNames.length > 0) {
          const firstBookName = bookNames[0];
          setCurrentBook(firstBookName); 
        } else {
          console.warn('[BibleContext] No valid book names found in BIBLICAL_BOOKS constant.');
          setError('No valid books found.');
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
  }, []); // Removed API_BASE_URL, fetchWithTimeout, handleApiResponse from dependencies

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
    const chapterKey = Number(chapter);
    const cached = versesCache[book]?.[chapterKey];
    if (cached) {
      setVerses(cached);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null); // Clear previous errors before fetching verses
    try {
      const endpoint = `${API_BASE_URL}/verses/${book}/${chapter}`;
      const response = await fetchWithTimeout(endpoint, {}, 60000);
      const data = await handleApiResponse(response, 'Failed to fetch verses');

      const processedVerses = Array.isArray(data) ? data.map(v => ({
        ...v,
        text: typeof v.text === 'string' ? v.text : '[Invalid Verse Text]'
      })) : [];
      if (!Array.isArray(data)) {
        console.error('[BibleContext] Verses API did not return an array:', data);
        setError('Invalid verse data format from server.');
      }
      setVerses(processedVerses);
      // Update cache
      setVersesCache(prev => {
        const newCache = { ...prev };
        if (!newCache[book]) newCache[book] = {};
        newCache[book][chapterKey] = processedVerses;
        return newCache;
      });
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
    versesCache,
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
    versesCache,
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

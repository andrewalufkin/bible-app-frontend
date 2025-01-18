import React, { useState, useEffect } from 'react';
import BibleVerseWithNotes from '../components/BibleVerseWithNotes';

const API_BASE_URL = 'http://localhost:5001/api';

const BiblePage = () => {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('');
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [verses, setVerses] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  useEffect(() => {
    fetchBooks();
  }, []);

  useEffect(() => {
    if (selectedBook) {
      fetchChapters(selectedBook);
    }
  }, [selectedBook]);

  useEffect(() => {
    if (selectedBook && selectedChapter) {
      fetchVerses(selectedBook, selectedChapter);
    }
  }, [selectedBook, selectedChapter]);

  const fetchBooks = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bible/books`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch books');
      const data = await response.json();
      setBooks(data);
      if (data.length > 0) setSelectedBook(data[0]);
    } catch (err) {
      setError('Failed to load books');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChapters = async (book) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bible/chapters/${book}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch chapters');
      const data = await response.json();
      setChapters(data);
      if (data.length > 0) setSelectedChapter(data[0]);
    } catch (err) {
      setError('Failed to load chapters');
    }
  };

  const fetchVerses = async (book, chapter) => {
    try {
      const response = await fetch(`${API_BASE_URL}/bible/verses/${book}/${chapter}`, {
        headers: getAuthHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch verses');
      const data = await response.json();
      setVerses(data);
    } catch (err) {
      setError('Failed to load verses');
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex gap-4">
        <select
          value={selectedBook}
          onChange={(e) => setSelectedBook(e.target.value)}
          className="p-2 border rounded"
        >
          {books.map(book => (
            <option key={book} value={book}>{book}</option>
          ))}
        </select>

        <select
          value={selectedChapter}
          onChange={(e) => setSelectedChapter(e.target.value)}
          className="p-2 border rounded"
        >
          {chapters.map(chapter => (
            <option key={chapter} value={chapter}>Chapter {chapter}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        {verses.map(verse => (
          <BibleVerseWithNotes key={verse.id} verse={verse} />
        ))}
      </div>
    </div>
  );
};

export default BiblePage; 
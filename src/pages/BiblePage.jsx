import React from 'react';
import BibleVerseWithNotes from '../components/BibleVerseWithNotes';
import { useBible } from '../contexts/BibleContext';

const BiblePage = () => {
  const { books, currentBook, currentChapter, verses, isLoading, error, setCurrentBook, setCurrentChapter } = useBible();

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6 flex gap-4">
        <select
          value={currentBook || ''}
          onChange={(e) => setCurrentBook(e.target.value)}
          className="p-2 border rounded"
        >
          {books.map(book => (
            <option key={book} value={book}>{book}</option>
          ))}
        </select>

        <select
          value={currentChapter}
          onChange={(e) => setCurrentChapter(parseInt(e.target.value, 10))}
          className="p-2 border rounded"
        >
          {Array.from({ length: 150 }, (_, i) => i + 1).map(chapter => (
            <option key={chapter} value={chapter}>Chapter {chapter}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow">
        {verses.map(verse => (
          <BibleVerseWithNotes key={verse.id} verse={verse} />
        ))}
      </div>
    </div>
  );
};

export default BiblePage; 
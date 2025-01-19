import React, { useEffect, useState } from 'react';
import { useBible } from '../contexts/BibleContext';

const VerseSelector = () => {
  const { books, currentBook, currentChapter, setCurrentBook, setCurrentChapter } = useBible();

  return (
    <div className="flex items-center gap-4 p-2">
      <div className="flex-1 max-w-xs">
        <select
          value={currentBook || ''}
          onChange={(e) => setCurrentBook(e.target.value)}
          className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a book</option>
          {books.map((book) => (
            <option key={book} value={book}>
              {book}
            </option>
          ))}
        </select>
      </div>

      {currentBook && (
        <div className="w-24">
          <select
            value={currentChapter || ''}
            onChange={(e) => setCurrentChapter(Number(e.target.value))}
            className="w-full px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Chapter</option>
            {Array.from({ length: 150 }, (_, i) => i + 1).map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default VerseSelector; 
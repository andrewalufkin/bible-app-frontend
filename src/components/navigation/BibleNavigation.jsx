// src/components/navigation/BibleNavigation.jsx
import React, { useEffect, useState } from 'react';
import { useBible } from '../../contexts/BibleContext';

const Select = ({ options, value, onChange, placeholder, labelFunction }) => (
  <select 
    className="w-full p-2 border rounded hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
    value={value}
    onChange={onChange}
  >
    <option value="" disabled>{placeholder}</option>
    {options.map(option => {
      const optionValue = typeof option === 'object' ? option.id : option;
      const label = labelFunction ? labelFunction(option) : (typeof option === 'object' ? option.name : option);
      return (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      );
    })}
  </select>
);

const LoadingState = () => (
  <div className="p-4">
    <div className="animate-pulse space-y-4">
      <div className="h-10 bg-gray-200 rounded"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  </div>
);

const BibleNavigation = () => {
  const {
    books,
    currentBook,
    currentChapter,
    isLoading,
    setCurrentBook,
    setCurrentChapter,
  } = useBible();
  
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleBookChange = (e) => {
    const selectedBook = e.target.value;
    setCurrentBook(selectedBook);
    setCurrentChapter(1); // Reset chapter when book changes
  };

  const handleChapterChange = (e) => {
    setCurrentChapter(Number(e.target.value));
  };

  if (isLoading || !currentBook) {
    return <LoadingState />;
  }

  // Get number of chapters for current book
  const chapters = Array.from(
    { length: 50 }, // Default to 50 chapters as maximum
    (_, i) => i + 1
  );

  return (
    <div className="w-full h-full bg-gray-100 border-r flex flex-col">
      <div className="p-4 overflow-y-auto flex-1">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
            <Select 
              options={books}
              value={currentBook || ''}
              onChange={handleBookChange}
              placeholder="Select Book"
              labelFunction={(book) => book}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chapter</label>
            <Select 
              options={chapters}
              value={currentChapter}
              onChange={handleChapterChange}
              placeholder="Select Chapter"
              labelFunction={(chapter) => `Chapter ${chapter}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BibleNavigation;
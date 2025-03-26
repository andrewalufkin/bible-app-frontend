// src/components/navigation/BibleNavigation.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useBible } from '../../contexts/BibleContext';
import { ChevronDown, Book } from 'lucide-react';

const Select = ({ options, value, onChange, placeholder, labelFunction, className = "" }) => (
  <select 
    className={`p-2 border rounded hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${className}`}
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
  <div className="flex items-center space-x-2">
    <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
    <div className="animate-pulse h-8 w-32 bg-gray-200 rounded"></div>
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
  
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Compact trigger button */}
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <Book size={16} className="text-blue-600" />
        <span className="font-medium">{currentBook} {currentChapter}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${showDropdown ? 'transform rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-72 bg-white border rounded-lg shadow-lg p-4 animate-fadeIn">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Book</label>
              <Select 
                options={books}
                value={currentBook || ''}
                onChange={handleBookChange}
                placeholder="Select Book"
                labelFunction={(book) => book}
                className="w-full"
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
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BibleNavigation;
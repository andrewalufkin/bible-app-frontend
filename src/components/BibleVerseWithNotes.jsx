import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';

const BibleVerseWithNotes = ({ verse, onOpenSidePanel, isActive }) => {
  const { fetchVerseNotes } = useNotes();
  const [hoveredVerse, setHoveredVerse] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if viewport is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  return (
    <div className="flex w-full">
      <div className="flex-1 bg-white dark:bg-transparent">
        <div 
          className={`relative p-4 transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
          onMouseEnter={() => !isMobile && setHoveredVerse(true)}
          onMouseLeave={() => !isMobile && setHoveredVerse(false)}
        >
          <div className="flex items-start gap-2">
            <span className="text-gray-500 text-sm min-w-[20px] dark:text-gray-400">{verse.verse}</span>
            <div className="flex-1">
              <div className={`${isMobile ? 'flex flex-col' : 'flex items-start justify-between'}`}>
                <div className={`flex-1 ${isMobile ? 'w-full' : 'max-w-[calc(100%-96px)]'}`}>
                  <p className={`${isMobile ? 'text-base' : 'text-lg'} dark:text-gray-100`}>
                    {verse.text}
                  </p>
                </div>
                
                <div className={`flex gap-2 ${isMobile ? 'mt-3' : 'ml-4 min-w-[80px] justify-end'} ${!isMobile && !hoveredVerse ? 'invisible' : ''}`}>
                  <button 
                    onClick={() => onOpenSidePanel(verse)}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${isActive ? 'bg-blue-200 dark:bg-blue-800' : ''}`}
                    title="Study note"
                  >
                    <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BibleVerseWithNotes;
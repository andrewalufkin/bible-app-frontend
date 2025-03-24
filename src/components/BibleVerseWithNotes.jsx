import React, { useState, useEffect } from 'react';
import { Edit3, MessageSquare, Check, X } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import AutoExpandingTextarea from './AutoExpandingTextarea';

const BibleVerseWithNotes = ({ verse, onOpenSidePanel, isActive }) => {
  const { fetchVerseNotes, saveQuickNote, isLoading } = useNotes();
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const [editedQuickNote, setEditedQuickNote] = useState('');
  const [hoveredVerse, setHoveredVerse] = useState(false);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const notes = await fetchVerseNotes(verse.book, verse.chapter, verse.verse);
        const quickNote = notes.find(note => note.note_type === 'quick');
        if (quickNote) {
          setQuickNote(quickNote.content);
          setEditedQuickNote(quickNote.content);
        } else {
          setQuickNote('');
          setEditedQuickNote('');
        }
      } catch (err) {
        console.error('Failed to check for notes:', err);
      }
    };

    if (showQuickNote) {
      loadNotes();
    }
  }, [verse.book, verse.chapter, verse.verse, fetchVerseNotes, showQuickNote]);

  const handleQuickNoteClick = () => {
    setShowQuickNote(!showQuickNote);
    if (!showQuickNote) {
      setEditedQuickNote(quickNote);
    }
  };

  const handleSaveQuickNote = async () => {
    try {
      const savedNote = await saveQuickNote({
        book: verse.book,
        chapter: String(verse.chapter),
        verse: String(verse.verse),
        content: editedQuickNote
      });
      
      setQuickNote(savedNote.content);
      setShowQuickNote(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelQuickNote = () => {
    setEditedQuickNote(quickNote);
    setShowQuickNote(false);
    setError(null);
  };

  return (
    <div className="flex w-full">
      <div className="flex-1 bg-white">
        <div 
          className={`relative p-4 transition-colors ${isActive ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
          onMouseEnter={() => !isMobile && setHoveredVerse(true)}
          onMouseLeave={() => !isMobile && setHoveredVerse(false)}
        >
          <div className="flex items-start gap-2">
            <span className="text-gray-500 text-sm min-w-[20px]">{verse.verse}</span>
            <div className="flex-1">
              <div className={`${isMobile ? 'flex flex-col' : 'flex items-start justify-between'}`}>
                {/* Added a container with responsive max-width */}
                <div className={`flex-1 ${isMobile ? 'w-full' : 'max-w-[calc(100%-96px)]'}`}>
                  <p className={`${isMobile ? 'text-base' : 'text-lg'}`}>
                    {verse.text}
                  </p>
                </div>
                
                {/* Note Icons Container - now more responsive */}
                <div className={`flex gap-2 ${isMobile ? 'mt-3' : 'ml-4 min-w-[80px] justify-end'} ${!isMobile && !hoveredVerse ? 'invisible' : ''}`}>
                  <button 
                    onClick={handleQuickNoteClick}
                    className="p-1.5 rounded hover:bg-gray-200"
                    title="Quick note"
                  >
                    <Edit3 className="w-4 h-4 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => onOpenSidePanel(verse)}
                    className={`p-1.5 rounded hover:bg-gray-200 ${isActive ? 'bg-blue-200' : ''}`}
                    title="Study note"
                  >
                    <MessageSquare className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              
              {/* Quick Note Input - Improved mobile layout */}
              {showQuickNote && (
                <div className={`mt-2 pl-4 border-l-2 border-blue-400 ${isMobile ? 'max-w-full' : ''}`}>
                  {error && (
                    <div className="text-red-600 text-sm mb-2">
                      {error}
                    </div>
                  )}
                  <div className="relative">
                    <AutoExpandingTextarea
                      value={editedQuickNote}
                      onChange={(e) => setEditedQuickNote(e.target.value)}
                      placeholder="Add a quick note..."
                      className={`w-full p-2 ${isMobile ? 'pr-2 mb-10' : 'pr-16'} border rounded focus:outline-none focus:ring-2 focus:ring-blue-400`}
                      disabled={isLoading}
                      minRows={2}
                    />
                    <div className={`${isMobile ? 'position-none flex justify-end mt-2' : 'absolute right-2 top-2 flex gap-1'}`}>
                      <button
                        onClick={handleSaveQuickNote}
                        className="p-1 rounded hover:bg-green-100 text-green-600"
                        title="Save quick note"
                        disabled={isLoading}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleCancelQuickNote}
                        className="p-1 rounded hover:bg-red-100 text-red-600"
                        title="Cancel"
                        disabled={isLoading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BibleVerseWithNotes;
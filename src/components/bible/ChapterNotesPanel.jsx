import React, { useState, useEffect } from 'react';
import { X, Edit2, Check, XCircle } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

const ChapterNotesPanel = ({ book, chapter, onClose }) => {
  const { 
    fetchChapterNotes, 
    saveChapterNote, 
    isLoading: { chapterNotes: isLoading },
    error: { chapterNotes: apiError }
  } = useNotes();
  
  const [chapterNote, setChapterNote] = useState('');
  const [editedNote, setEditedNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
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

  // Load chapter note when component mounts
  useEffect(() => {
    const loadChapterNote = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND_URL}/api/notes/chapter/${book}/${chapter}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const note = await response.json();
          setChapterNote(note.content);
          setEditedNote(note.content);
        } else if (response.status !== 404) {
          // Only show error if it's not a 404 (no note found)
          setError('Failed to load chapter note');
        }
      } catch (err) {
        setError('Failed to load chapter note');
        console.error('Error loading chapter note:', err);
      }
    };
    
    loadChapterNote();
  }, [book, chapter]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    try {
      const trimmedNote = editedNote.trim();
      const noteData = {
        book,
        chapter: String(chapter),
        content: trimmedNote
      };
      
      const savedNote = await saveChapterNote(noteData);
      
      if (savedNote) {
        setChapterNote(savedNote.content);
        setEditedNote(savedNote.content);
      } else {
        setChapterNote('');
        setEditedNote('');
      }
      
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to save chapter note');
      console.error('Error saving chapter note:', err);
    }
  };

  const handleCancel = () => {
    setEditedNote(chapterNote);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className={`${isMobile ? 'w-full' : 'w-96'} border-l bg-gray-50 p-4 h-screen fixed right-0 top-0 overflow-y-auto z-50`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Chapter Notes</h3>
        <button 
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        {book} {chapter}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-600">Your Chapter Notes</h4>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="p-1 rounded hover:bg-gray-200 text-gray-600"
                title="Edit note"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="p-1 rounded hover:bg-green-100 text-green-600"
                  title="Save changes"
                  disabled={isLoading}
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 rounded hover:bg-red-100 text-red-600"
                  title="Cancel changes"
                  disabled={isLoading}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {error && (
            <div className="text-red-600 text-sm mb-2">
              {error}
            </div>
          )}
          
          {isEditing ? (
            <AutoExpandingTextarea
              value={editedNote}
              onChange={(e) => setEditedNote(e.target.value)}
              placeholder="Add your chapter notes here..."
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={isLoading}
              minRows={6}
            />
          ) : (
            <div className="w-full p-3 bg-white border rounded min-h-[150px]">
              {chapterNote ? (
                <p className="text-gray-600 whitespace-pre-wrap">{chapterNote}</p>
              ) : (
                <p className="text-gray-400 italic">No chapter notes yet. Click the edit button to add one.</p>
              )}
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <p className="text-sm text-gray-600 mb-2">
            Chapter notes help you summarize the main themes and messages of the entire chapter.
            They are also used to enhance AI insights.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChapterNotesPanel; 
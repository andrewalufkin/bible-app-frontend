import React, { useState, useEffect } from 'react';
import { X, Edit2, Check, XCircle } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import AutoExpandingTextarea from '../AutoExpandingTextarea';

const ChapterNotesPanel = ({ book, chapter, onClose }) => {
  const { 
    fetchSingleChapterNote,
    saveChapterNote, 
    isLoading: { singleChapterNote: isLoadingNote, chapterNotes: isSavingNote },
    error: { singleChapterNote: fetchError, chapterNotes: saveError }
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

  // Load chapter note using the hook function
  useEffect(() => {
    let isMounted = true;
    const loadChapterNote = async () => {
      setError(null);
      try {
        const note = await fetchSingleChapterNote(book, chapter);
        if (isMounted) {
          setChapterNote(note.content);
          setEditedNote(note.content);
        }
      } catch (err) {
        if (isMounted) {
          setError(fetchError || err.message || 'Failed to load chapter note');
          console.error('Error loading chapter note:', err);
        }
      }
    };
    
    loadChapterNote();

    return () => { isMounted = false; };
  }, [book, chapter, fetchSingleChapterNote, fetchError]);

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    try {
      const trimmedNote = editedNote.trim();
      const noteData = {
        book,
        chapter: String(chapter),
        content: trimmedNote
      };
      
      const savedNoteResponse = await saveChapterNote(noteData);
      
      const noteContent = savedNoteResponse.note?.content || '';
      setChapterNote(noteContent);
      setEditedNote(noteContent);
      setIsEditing(false);
    } catch (err) {
      setError(saveError || err.message || 'Failed to save chapter note');
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
                disabled={isLoadingNote}
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
                  disabled={isSavingNote}
                >
                  {isSavingNote ? <div className="w-4 h-4 border-t-2 border-green-600 rounded-full animate-spin"></div> : <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 rounded hover:bg-red-100 text-red-600"
                  title="Cancel changes"
                  disabled={isSavingNote}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {(error || fetchError || saveError) && (
            <div className="text-red-600 text-sm mb-2">
              {error || fetchError || saveError}
            </div>
          )}
          
          {isLoadingNote ? (
            <div className="w-full p-3 bg-white border rounded min-h-[150px] animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ) : isEditing ? (
            <AutoExpandingTextarea
              value={editedNote}
              onChange={(e) => setEditedNote(e.target.value)}
              placeholder="Add your chapter notes here..."
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={isSavingNote}
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
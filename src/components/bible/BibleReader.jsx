// src/components/bible/BibleReader.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useBible } from '../../contexts/BibleContext';
import BibleVerseWithNotes from '../BibleVerseWithNotes';
import { X, Edit2, Check, XCircle } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import AutoExpandingTextarea from '../AutoExpandingTextarea';
import TruncatedText from '../TruncatedText';
import { useAuth } from '../../contexts/AuthContext';

const LoadingState = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
  </div>
);

const FriendNote = ({ friend, note }) => (
  <div className="bg-white p-3 rounded border mb-3">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
        <span className="text-xs text-blue-600">
          {friend.username.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <span className="text-sm font-medium">{friend.username}</span>
    </div>
    <TruncatedText text={note.content} maxLines={3} />
  </div>
);

const FriendNotesList = ({ notes, initialCount = 2 }) => {
  const [showAll, setShowAll] = useState(false);
  const displayedNotes = showAll ? notes : notes.slice(0, initialCount);
  const hasMore = notes.length > initialCount;

  return (
    <div>
      {displayedNotes.map((note, index) => (
        <FriendNote 
          key={note.id} 
          friend={note.user}
          note={note}
        />
      ))}
      
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-blue-600 hover:text-blue-700 text-sm mt-1 focus:outline-none w-full text-center py-2 border rounded-lg hover:bg-gray-50"
        >
          {showAll ? 'Show less' : `See ${notes.length - initialCount} more notes`}
        </button>
      )}
    </div>
  );
};

const StudyNotesSidePanel = ({ verse, onClose }) => {

  console.log('StudyNotesSidePanel rendering', new Date().toISOString());
  
  const { user } = useAuth();
  const { fetchVerseNotes, saveStudyNote, isLoading: { studyNote: isSavingNote, fetch: isLoadingNotes }, error: { studyNote: studyNoteError, fetch: fetchError }} = useNotes();
  
  const [studyNote, setStudyNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState('');
  const [error, setError] = useState(null);
  const [friendNotes, setFriendNotes] = useState([]);

  // Memoize the loadNotes function
  const loadNotes = useCallback(async () => {
    if (!verse) return;
    
    try {
      const notes = await fetchVerseNotes(verse.book, verse.chapter, verse.verse);
      console.log('Notes fetched:', notes.length, 'notes');
      
      // Find user's own study note
      const ownStudyNote = notes.find(note => note.user.is_self && note.note_type === 'study');
      if (ownStudyNote) {
        setStudyNote(ownStudyNote.content);
        setEditedNote(ownStudyNote.content);
      } else {
        setStudyNote('');
        setEditedNote('');
      }

      // Filter out friend's study notes
      const friendStudyNotes = notes.filter(note => !note.user.is_self && note.note_type === 'study');
      setFriendNotes(friendStudyNotes);
    } catch (err) {
      console.error('Error loading notes:', err);
      setError('Failed to load notes');
    }
  }, [verse?.book, verse?.chapter, verse?.verse, fetchVerseNotes]);

  // Only fetch notes when the panel first opens or verse changes
  useEffect(() => {
    console.log('Notes effect running', new Date().toISOString());
    
    // Create a flag to track if the component is mounted
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      await loadNotes();
    };

    fetchData();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [loadNotes]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!verse) return;
    
    try {
      const savedNote = await saveStudyNote({
        book: verse.book,
        chapter: String(verse.chapter),
        verse: String(verse.verse),
        content: editedNote.trim()
      });
      
      if (savedNote.content) {
        setStudyNote(savedNote.content);
      } else {
        setStudyNote('');
        setEditedNote('');
      }
      
      setIsEditing(false);
      setError(null);
      
      // Reload notes to get updated friend notes
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  }, [verse, editedNote, saveStudyNote, loadNotes]);

  const handleCancel = useCallback(() => {
    setEditedNote(studyNote);
    setIsEditing(false);
    setError(null);
  }, [studyNote]);

  // Memoize the friend notes list to prevent unnecessary rerenders
  const memoizedFriendNotesList = useMemo(() => (
    user?.can_view_friend_notes && (
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-600 mb-2">Friend's Notes</h4>
        {isLoadingNotes ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 rounded"></div>
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        ) : friendNotes.length > 0 ? (
          <FriendNotesList 
            notes={friendNotes}
            initialCount={2}
          />
        ) : (
          <div className="text-gray-500 text-sm italic text-center py-4 border rounded">
            No friend notes for this verse yet
          </div>
        )}
      </div>
    )
  ), [user?.can_view_friend_notes, isLoadingNotes, friendNotes]);

  return (
    <div className="w-96 border-l bg-gray-50 p-4 h-screen fixed right-0 top-0 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Study Notes</h3>
        <button 
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="text-sm text-gray-600 mb-4">
        {verse.book} {verse.chapter}:{verse.verse}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-600">Your Notes</h4>
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
                  disabled={isSavingNote}
                >
                  <Check className="w-4 h-4" />
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
          
          {error && (
            <div className="text-red-600 text-sm mb-2">
              {error}
            </div>
          )}
          
          {isEditing ? (
            <AutoExpandingTextarea
              value={editedNote}
              onChange={(e) => setEditedNote(e.target.value)}
              placeholder="Add your study notes..."
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={isSavingNote}
              minRows={4}
            />
          ) : (
            <div className="w-full p-3 bg-white border rounded min-h-[100px]">
              {studyNote ? (
                <p className="text-gray-600 whitespace-pre-wrap">{studyNote}</p>
              ) : (
                <p className="text-gray-400 italic">No notes yet. Click the edit button to add one.</p>
              )}
            </div>
          )}
        </div>

        {/* Friend's Notes Section */}
        {memoizedFriendNotesList}

        {/* AI Insights Section */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-600 mb-2">AI Insights</h4>
          <div className="bg-white p-3 rounded border">
            <TruncatedText 
              text="Consider how this connects to John 1:1 and Colossians 1:16. The phrase 'in the beginning' appears in both Genesis and John's Gospel, creating a powerful connection between the Old and New Testaments. This parallel emphasizes the eternal nature of God and His Word, and establishes Jesus' role in creation as described in Colossians."
              maxLines={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const BibleReader = () => {
  const { currentBook, currentChapter, verses, isLoading, error } = useBible();
  const [activeVerse, setActiveVerse] = useState(null);

  const handleOpenSidePanel = (verse) => {
    setActiveVerse(verse);
  };

  const handleCloseSidePanel = () => {
    setActiveVerse(null);
  };

  useEffect(() => {
    if (activeVerse) {
      // Scroll the active verse into view when it's selected
      const element = document.getElementById(`verse-${activeVerse.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activeVerse]);

  if (error) {
    return (
      <div className="text-red-600 p-4">
        <p>{error}</p>
      </div>
    );
  }

  if (!currentBook) {
    return <LoadingState />;
  }

  // Split verses into sections based on active verse
  const getVerseSections = () => {
    if (!activeVerse) {
      return { beforeVerses: [], activeVerse: null, afterVerses: verses };
    }

    const activeIndex = verses.findIndex(v => v.id === activeVerse.id);
    return {
      beforeVerses: verses.slice(0, activeIndex),
      activeVerse: verses[activeIndex],
      afterVerses: verses.slice(activeIndex + 1)
    };
  };

  const { beforeVerses, activeVerse: currentActiveVerse, afterVerses } = getVerseSections();

  return (
    <div className={`relative transition-all duration-300 ${activeVerse ? 'mr-96' : ''}`}>
      <div className="px-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold">
            {currentBook} {currentChapter}
          </h1>
          <p className="text-gray-600">King James Version</p>
        </div>
        <div className="prose max-w-none">
          {isLoading ? (
            <LoadingState />
          ) : (
            <>
              {/* Verses before active verse */}
              <div>
                {beforeVerses.map(verse => (
                  <BibleVerseWithNotes 
                    key={verse.id}
                    verse={verse}
                    onOpenSidePanel={handleOpenSidePanel}
                    isActive={false}
                  />
                ))}
              </div>

              {/* Active verse - sticky */}
              {currentActiveVerse && (
                <div 
                  id={`verse-${currentActiveVerse.id}`}
                  className="sticky top-0 bg-white shadow-md z-10"
                >
                  <BibleVerseWithNotes 
                    verse={currentActiveVerse}
                    onOpenSidePanel={handleOpenSidePanel}
                    isActive={true}
                  />
                </div>
              )}

              {/* Verses after active verse */}
              <div>
                {afterVerses.map(verse => (
                  <BibleVerseWithNotes 
                    key={verse.id}
                    verse={verse}
                    onOpenSidePanel={handleOpenSidePanel}
                    isActive={false}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {activeVerse && (
        <StudyNotesSidePanel 
          verse={activeVerse}
          onClose={handleCloseSidePanel}
        />
      )}
    </div>
  );
};

export default BibleReader;
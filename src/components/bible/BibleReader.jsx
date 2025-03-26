// src/components/bible/BibleReader.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useBible } from '../../contexts/BibleContext';
import BibleVerseWithNotes from '../BibleVerseWithNotes';
import { X, Edit2, Check, XCircle, BookOpen } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import AutoExpandingTextarea from '../AutoExpandingTextarea';
import TruncatedText from '../TruncatedText';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChapterNotesPanel from './ChapterNotesPanel';

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
  const { 
    fetchVerseNotes, 
    fetchChapterNotes, 
    saveStudyNote, 
    isLoading: { 
      studyNote: isSavingNote, 
      fetch: isLoadingNotes,
      chapterNotes: isLoadingChapterNotes
    }, 
    error: { 
      studyNote: studyNoteError, 
      fetch: fetchError,
      chapterNotes: chapterNotesError
    }
  } = useNotes();
  
  const [studyNote, setStudyNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState('');
  const [error, setError] = useState(null);
  const [friendNotes, setFriendNotes] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [chapterNotesCache, setChapterNotesCache] = useState({});

  // Check if viewport is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Load all chapter notes once when component mounts or book/chapter changes
  useEffect(() => {
    if (!verse) return;
    
    // Create a flag to track if the component is mounted
    let isMounted = true;
    
    const fetchAllChapterNotes = async () => {
      try {
        const notes = await fetchChapterNotes(verse.book, verse.chapter);
        if (!isMounted) return;
        
        // Process and cache all notes for this chapter
        const notesCache = {};
        notes.forEach(note => {
          if (!notesCache[note.verse]) {
            notesCache[note.verse] = [];
          }
          notesCache[note.verse].push(note);
        });
        
        setChapterNotesCache(notesCache);
        
        // Initialize the current verse's notes
        const currentVerseNotes = notesCache[verse.verse] || [];
        
        // Find user's own study note for this verse
        const ownStudyNote = currentVerseNotes.find(
          note => note.user.is_self && note.note_type === 'study'
        );
        
        if (ownStudyNote) {
          setStudyNote(ownStudyNote.content);
          setEditedNote(ownStudyNote.content);
        } else {
          setStudyNote('');
          setEditedNote('');
        }

        // Filter out friend's study notes for this verse
        const friendStudyNotes = currentVerseNotes.filter(
          note => !note.user.is_self && note.note_type === 'study'
        );
        setFriendNotes(friendStudyNotes);
      } catch (err) {
        if (isMounted) {
          console.error('Error loading chapter notes:', err);
          setError('Failed to load notes');
        }
      }
    };

    fetchAllChapterNotes();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [verse?.book, verse?.chapter, fetchChapterNotes]);

  // Update notes when verse changes (using cached data)
  useEffect(() => {
    if (!verse || !chapterNotesCache[verse.verse]) return;
    
    const currentVerseNotes = chapterNotesCache[verse.verse];
    
    // Find user's own study note for this verse
    const ownStudyNote = currentVerseNotes.find(
      note => note.user.is_self && note.note_type === 'study'
    );
    
    if (ownStudyNote) {
      setStudyNote(ownStudyNote.content);
      setEditedNote(ownStudyNote.content);
    } else {
      setStudyNote('');
      setEditedNote('');
    }

    // Filter out friend's study notes for this verse
    const friendStudyNotes = currentVerseNotes.filter(
      note => !note.user.is_self && note.note_type === 'study'
    );
    setFriendNotes(friendStudyNotes);
  }, [verse?.verse, chapterNotesCache]);

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
      
      // Update the cache with the new note
      setChapterNotesCache(prevCache => {
        const updatedCache = { ...prevCache };
        
        if (!updatedCache[verse.verse]) {
          updatedCache[verse.verse] = [];
        }
        
        // Find and update or add the note
        const noteIndex = updatedCache[verse.verse].findIndex(
          note => note.user.is_self && note.note_type === 'study'
        );
        
        if (noteIndex >= 0) {
          // Update existing note
          updatedCache[verse.verse][noteIndex] = {
            ...updatedCache[verse.verse][noteIndex],
            content: savedNote.content
          };
        } else if (savedNote.content) {
          // Add new note
          updatedCache[verse.verse].push({
            ...savedNote,
            user: {
              id: savedNote.user?.id,
              username: savedNote.user?.username || 'You',
              is_self: true
            }
          });
        }
        
        return updatedCache;
      });
    } catch (err) {
      setError(err.message);
    }
  }, [verse, editedNote, saveStudyNote]);

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
        {isLoadingChapterNotes ? (
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
  ), [user?.can_view_friend_notes, isLoadingChapterNotes, friendNotes]);

  return (
    <div className={`${isMobile ? 'w-full' : 'w-96'} border-l bg-gray-50 p-4 h-screen fixed right-0 top-0 overflow-y-auto z-50`}>
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
  const { currentBook, currentChapter, verses, isLoading, error, books = [], chapterOptions = [], loadChapter } = useBible();
  const [activeVerse, setActiveVerse] = useState(null);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showChapterNotes, setShowChapterNotes] = useState(false);

  const handleOpenSidePanel = (verse) => {
    setActiveVerse(verse);
    setShowChapterNotes(false);
  };

  const handleCloseSidePanel = () => {
    setActiveVerse(null);
  };

  const handleOpenChapterNotes = () => {
    setActiveVerse(null);
    setShowChapterNotes(true);
  };

  const handleCloseChapterNotes = () => {
    setShowChapterNotes(false);
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

  const handleBookChange = (book) => {
    setIsLoadingChapters(true);
    loadChapter(book, 1).finally(() => {
      setIsLoadingChapters(false);
    });
  };

  const handleChapterChange = (chapter) => {
    loadChapter(currentBook, chapter);
  };

  // Split verses into sections: before active verse, active verse, and after active verse
  const { beforeVerses, currentActiveVerse, afterVerses } = useMemo(() => {
    if (!activeVerse || !verses) {
      return {
        beforeVerses: verses || [],
        currentActiveVerse: null,
        afterVerses: []
      };
    }

    const activeIndex = verses.findIndex(v => v.id === activeVerse.id);
    if (activeIndex === -1) {
      return {
        beforeVerses: verses,
        currentActiveVerse: null,
        afterVerses: []
      };
    }

    return {
      beforeVerses: verses.slice(0, activeIndex),
      currentActiveVerse: verses[activeIndex],
      afterVerses: verses.slice(activeIndex + 1)
    };
  }, [verses, activeVerse]);

  useEffect(() => {
    // If we have a book but no chapter options, try to load the first chapter
    if (currentBook && (!chapterOptions || chapterOptions.length === 0)) {
      loadChapter(currentBook, 1);
    }
  }, [currentBook, chapterOptions, loadChapter]);

  if (error) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full transition-all duration-300 ${activeVerse || showChapterNotes ? 'mr-96' : ''}`}>
      <div className="px-4 md:px-8 h-full">
        <div className="prose max-w-none">
          {isLoading ? (
            <LoadingState />
          ) : (
            <>
              {/* Chapter toolbar */}
              <div className="flex justify-between items-center bg-white z-20 py-2 border-b mb-4">
                <h2 className="text-2xl font-bold m-0">{currentBook} {currentChapter}</h2>
                <button
                  onClick={handleOpenChapterNotes}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg"
                  title="Chapter Notes"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">Chapter Notes</span>
                </button>
              </div>
              
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

      {showChapterNotes && currentBook && currentChapter && (
        <ChapterNotesPanel
          book={currentBook}
          chapter={currentChapter}
          onClose={handleCloseChapterNotes}
        />
      )}
    </div>
  );
};

export default BibleReader;
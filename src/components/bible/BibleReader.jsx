// src/components/bible/BibleReader.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useBible } from '../../contexts/BibleContext';
import BibleVerseWithNotes from '../BibleVerseWithNotes';
import { X, Edit2, Check, XCircle, BookOpen } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import AutoExpandingTextarea from '../AutoExpandingTextarea';
import TruncatedText from '../TruncatedText';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import ChapterNotesPanel from './ChapterNotesPanel';

const LoadingState = () => (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
  </div>
);

const FriendNote = ({ friend, note }) => (
  <div className="bg-white dark:bg-gray-700 p-3 rounded border dark:border-gray-600 mb-3">
    <div className="flex items-center gap-2 mb-2">
      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
        <span className="text-xs text-blue-600 dark:text-blue-300">
          {friend.username.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <span className="text-sm font-medium dark:text-gray-100">{friend.username}</span>
    </div>
    <TruncatedText text={note.content} maxLines={3} className="dark:text-gray-300" />
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
          className="text-blue-600 hover:text-blue-700 text-sm mt-1 focus:outline-none w-full text-center py-2 border rounded-lg hover:bg-gray-50 dark:text-blue-400 dark:hover:text-blue-300 dark:border-gray-600 dark:hover:bg-gray-600"
        >
          {showAll ? 'Show less' : `See ${notes.length - initialCount} more notes`}
        </button>
      )}
    </div>
  );
};

const StudyNotesSidePanel = ({ verse, onClose, chapterNotesCache, isLoadingChapterNotes, isSavingNote, saveStudyNote, error }) => {

  console.log('StudyNotesSidePanel rendering', new Date().toISOString());
  
  const { user } = useAuth();
  const [internalError, setInternalError] = useState(null);
  const [studyNote, setStudyNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedNote, setEditedNote] = useState('');
  const [friendNotes, setFriendNotes] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoadingInitialVerseNote, setIsLoadingInitialVerseNote] = useState(true);

  // Check if viewport is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Update notes when verse changes (using cached data passed via props)
  useEffect(() => {
    if (!verse) return;
    
    setIsLoadingInitialVerseNote(true);
    setInternalError(null);

    const currentVerseNotes = chapterNotesCache?.[verse.book]?.[verse.chapter]?.[verse.verse] || [];
    
    // Find user's own study note for this verse
    const ownStudyNote = currentVerseNotes.find(
      note => note.user.is_self && note.note_type === 'study'
    );
    
    const initialNoteContent = ownStudyNote ? ownStudyNote.content : '';
    setStudyNote(initialNoteContent);
    setEditedNote(initialNoteContent);
    setIsEditing(false);

    // Filter out friend's study notes for this verse
    const friendStudyNotes = currentVerseNotes.filter(
      note => !note.user.is_self && note.note_type === 'study'
    );
    setFriendNotes(friendStudyNotes);
    
    setIsLoadingInitialVerseNote(false);

  }, [verse?.book, verse?.chapter, verse?.verse, chapterNotesCache]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setInternalError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!verse) return;
    
    setInternalError(null);
    try {
      const savedNoteData = {
        book: verse.book,
        chapter: String(verse.chapter),
        verse: String(verse.verse),
        content: editedNote.trim()
      };
      
      const savedNote = await saveStudyNote(savedNoteData);
      
      const newContent = savedNote.content || '';
      setStudyNote(newContent);
      setEditedNote(newContent);
      setIsEditing(false);
      
      setInternalError(null);

    } catch (err) {
      setInternalError(err.message || 'Failed to save note');
    }
  }, [verse, editedNote, saveStudyNote]);

  const handleCancel = useCallback(() => {
    setEditedNote(studyNote);
    setIsEditing(false);
    setInternalError(null);
  }, [studyNote]);

  // Memoize the friend notes list to prevent unnecessary rerenders
  const memoizedFriendNotesList = useMemo(() => (
    user?.can_view_friend_notes && (
      <div className="border-t dark:border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Friend's Notes</h4>
        {isLoadingChapterNotes ? (
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ) : friendNotes.length > 0 ? (
          <FriendNotesList 
            notes={friendNotes}
            initialCount={2}
          />
        ) : (
          <div className="text-gray-500 dark:text-gray-400 text-sm italic text-center py-4 border dark:border-gray-600 rounded">
            No friend notes for this verse yet
          </div>
        )}
      </div>
    )
  ), [user?.can_view_friend_notes, isLoadingChapterNotes, friendNotes]);

  return (
    <div className={`${isMobile ? 'w-full' : 'w-96'} border-l bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-4 h-screen fixed right-0 top-0 overflow-y-auto z-50`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium dark:text-gray-100">Study Notes</h3>
        <button 
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 dark:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {verse.book} {verse.chapter}:{verse.verse}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Your Notes</h4>
            {!isEditing && (
              <button
                onClick={handleEdit}
                className="p-1 rounded hover:bg-gray-200 text-gray-600 dark:hover:bg-gray-700 dark:text-gray-300"
                title="Edit note"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {isEditing && (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="p-1 rounded hover:bg-green-100 text-green-600 dark:hover:bg-green-900 dark:text-green-400"
                  title="Save changes"
                  disabled={isSavingNote}
                >
                  {isSavingNote ? <div className="w-4 h-4 border-t-2 border-green-600 dark:border-green-400 rounded-full animate-spin"></div> : <Check className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 rounded hover:bg-red-100 text-red-600 dark:hover:bg-red-900 dark:text-red-400"
                  title="Cancel changes"
                  disabled={isSavingNote}
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {(internalError || error) && (
            <div className="text-red-600 dark:text-red-400 text-sm mb-2">
              {internalError || error}
            </div>
          )}
          
          {isLoadingInitialVerseNote ? (
            <div className="w-full p-3 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded min-h-[100px] animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-5/6"></div>
            </div>
          ) : isEditing ? (
            <AutoExpandingTextarea
              value={editedNote}
              onChange={(e) => setEditedNote(e.target.value)}
              placeholder="Add your study notes..."
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:focus:ring-blue-500"
              disabled={isSavingNote}
              minRows={4}
            />
          ) : (
            <div className="w-full p-3 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded min-h-[100px]">
              {studyNote ? (
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{studyNote}</p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic">No notes yet. Click the edit button to add one.</p>
              )}
            </div>
          )}
        </div>

        {memoizedFriendNotesList}
      </div>
    </div>
  );
};

const BibleReader = () => {
  const {
    books,
    currentBook,
    currentChapter,
    verses,
    isLoading: isBibleLoading,
    bibleError,
    loadChapter,
    setCurrentBook,
    setCurrentChapter,
    chapterOptions,
  } = useBible();

  const {
    chapterNotesCache,
    isLoadingChapterNotes,
    isSavingNote,
    studyNoteError,
    saveStudyNote,
    fetchChapterNotes
  } = useNotes();

  const [activeVerse, setActiveVerse] = useState(null);

  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [isChapterNotesOpen, setIsChapterNotesOpen] = useState(false);
  
  const { book: urlBook, chapter: urlChapter } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (urlBook && urlChapter) {
      const decodedBook = decodeURIComponent(urlBook);
      const chapterNumber = parseInt(urlChapter, 10);

      if (decodedBook !== currentBook || chapterNumber !== currentChapter) {
        if (books && books.includes(decodedBook)) {
          console.log(`Syncing context from URL: Book=${decodedBook}, Chapter=${chapterNumber}`);
          setCurrentBook(decodedBook); 
          setCurrentChapter(chapterNumber);
        } else {
          console.warn(`Book "${decodedBook}" from URL not found in available books.`);
        }
      }
    } else if (currentBook && currentChapter) {
      if (!verses || verses.length === 0) {
        loadChapter(currentBook, currentChapter);
      }
    }
  }, [urlBook, urlChapter, currentBook, currentChapter, books, setCurrentBook, setCurrentChapter, navigate, loadChapter, verses]);

  useEffect(() => {
    if (currentBook && currentChapter) {
      fetchChapterNotes(currentBook, currentChapter);
    }
  }, [currentBook, currentChapter, fetchChapterNotes]);

  const handleOpenSidePanel = (verse) => {
    setActiveVerse(verse);
    setIsChapterNotesOpen(false);
  };

  const handleCloseSidePanel = () => {
    setActiveVerse(null);
  };

  const handleOpenChapterNotes = () => {
    setActiveVerse(null);
    setIsChapterNotesOpen(true);
  };

  const handleCloseChapterNotes = () => {
    setIsChapterNotesOpen(false);
  };

  useEffect(() => {
    if (activeVerse) {
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
    if (currentBook && (!chapterOptions || chapterOptions.length === 0)) {
      loadChapter(currentBook, 1);
    }
  }, [currentBook, chapterOptions, loadChapter]);

  const displayError = bibleError || studyNoteError;

  if (displayError) {
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded">
        Error: {displayError}
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full transition-all duration-300 ${activeVerse || isChapterNotesOpen ? 'mr-96' : ''}`}>
      <div className="px-4 md:px-8 h-full">
        <div className="prose max-w-none">
          {isBibleLoading ? (
            <LoadingState />
          ) : (
            <>
              <div className="flex justify-between items-center bg-white z-20 py-2 border-b mb-4 dark:bg-gray-800 dark:border-gray-700">
                <h2 className="text-2xl font-bold m-0 pl-4 dark:text-gray-100">{currentBook} {currentChapter}</h2>
                <button
                  onClick={handleOpenChapterNotes}
                  className="flex items-center gap-1 px-3 py-1.5 mr-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/50 dark:hover:bg-blue-800/50 dark:text-blue-300"
                  title="Chapter Notes"
                >
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm">Chapter Notes</span>
                </button>
              </div>
              
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
          chapterNotesCache={chapterNotesCache}
          isLoadingChapterNotes={isLoadingChapterNotes} 
          isSavingNote={isSavingNote}
          saveStudyNote={saveStudyNote}
          error={studyNoteError}
        />
      )}

      {isChapterNotesOpen && currentBook && currentChapter && (
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
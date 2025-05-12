// src/components/bible/BibleReader.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useBible } from '../../contexts/BibleContext';
import BibleVerseWithNotes from '../BibleVerseWithNotes';
import { X, Edit2, Check, XCircle, BookOpen } from 'lucide-react';
import { useNotes } from '../../hooks/useNotes';
import { useHighlights } from '../../hooks/useHighlights';
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

  // Log studyNote whenever it changes
  useEffect(() => {
    console.log('[StudyNotesSidePanel] studyNote state changed to:', studyNote);
  }, [studyNote]);

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
    console.log('[StudyNotesSidePanel] Verse/Cache useEffect running. verse:', verse, 'chapterNotesCache:', chapterNotesCache ? Object.keys(chapterNotesCache) : null);
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
    
    console.log('[StudyNotesSidePanel] handleSave called.');
    console.log('[StudyNotesSidePanel] current editedNote to save:', editedNote);
    setInternalError(null);
    try {
      const savedNoteData = {
        book: verse.book,
        chapter: String(verse.chapter),
        verse: String(verse.verse),
        content: editedNote.trim()
      };
      console.log('[StudyNotesSidePanel] handleSave - saving data:', JSON.parse(JSON.stringify(savedNoteData)));
      
      const savedResponse = await saveStudyNote(savedNoteData);
      console.log('[StudyNotesSidePanel] handleSave - response from saveStudyNote:', JSON.parse(JSON.stringify(savedResponse)));
      
      const newContent = savedResponse.note.content || '';
      console.log('[StudyNotesSidePanel] handleSave - newContent from response:', newContent);
      
      console.log('[StudyNotesSidePanel] handleSave - studyNote BEFORE setStudyNote:', studyNote);
      setStudyNote(newContent);
      // Logging studyNote immediately after setStudyNote will show the old value due to async nature.
      // The useEffect above will log the new value after re-render.
      console.log('[StudyNotesSidePanel] handleSave - called setStudyNote with:', newContent);

      setEditedNote(newContent);
      setIsEditing(false);
      
      setInternalError(null);
      console.log('[StudyNotesSidePanel] handleSave completed successfully.');

    } catch (err) {
      console.error('[StudyNotesSidePanel] handleSave - error:', err);
      setInternalError(err.message || 'Failed to save note');
    }
  }, [verse, editedNote, saveStudyNote, studyNote]);

  const handleCancel = useCallback(() => {
    setEditedNote(studyNote);
    setIsEditing(false);
    setInternalError(null);
  }, [studyNote]);

  const errorToDisplay = internalError || (typeof error === 'string' ? error : null);

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
          
          {errorToDisplay && (
            <div className="text-red-600 dark:text-red-400 text-sm mb-2">
              {errorToDisplay}
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
  const { user } = useAuth();
  const { currentBook, currentChapter, currentVerseNum, selectVerse, books, chapters, verses, isLoading: bibleIsLoading, error: bibleError, clearError: clearBibleError, fetchVerses } = useBible();
  const {
    fetchChapterNotes,
    saveStudyNote,
    chapterNotesCache,
    loadingStates = {},
    errors = {},
    clearAllNotesError,
    clearChapterNotesError,
    clearStudyNoteError,
    clearQuickNoteError,
    saveQuickNote,
    chapterHasOwnNote,
    fetchChapterHasOwnNote,
    isCheckingChapterNote,
  } = useNotes();

  // console.log("[BibleReader] Value of 'errors' after destructuring from useNotes():", errors); // chaperone_added_log
  // console.log('[BibleReader] Value of chapterNotesCache from useNotes:', chapterNotesCache);

  const [selectedVerse, setSelectedVerse] = useState(null);

  const {
    highlights,
    isLoading: isLoadingHighlights,
    error: highlightsError,
    fetchHighlights,
    updateHighlightsForVerse,
    clearHighlights
  } = useHighlights();

  const navigate = useNavigate();
  const { bookName: urlBookName, chapterNumber: urlChapterNumber } = useParams();

  const [activeVerse, setActiveVerse] = useState(null);
  const [sidePanelVerse, setSidePanelVerse] = useState(null);
  const [isChapterNotesPanelOpen, setIsChapterNotesPanelOpen] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false); // Local loading state for nav

  // Effect to fetch verses when book or chapter changes
  useEffect(() => {
    if (currentBook && currentChapter) {
      // console.log(\`[BibleReader] Fetching verses for ${currentBook} ${currentChapter}\`);
      fetchVerses(currentBook, currentChapter);
    }
  }, [currentBook, currentChapter, fetchVerses]);

  // Effect to fetch highlights when book or chapter changes
  useEffect(() => {
    if (currentBook && currentChapter) {
      // console.log(\`[BibleReader] Clearing and fetching highlights for ${currentBook} ${currentChapter}\`);
      clearHighlights(); // Clear previous highlights
      fetchHighlights(currentBook, currentChapter);
    }
  }, [currentBook, currentChapter, fetchHighlights, clearHighlights]);

  // Effect to fetch all notes for the current chapter
  useEffect(() => {
    if (currentBook && currentChapter) {
      fetchChapterNotes(currentBook, currentChapter);
    }
  }, [currentBook, currentChapter, fetchChapterNotes]);

  useEffect(() => {
    // This effect tries to load chapter 1 if no verses are loaded for currentBook.
    // It might conflict with URL param handling or initial load logic.
    // Let's refine this or rely on the primary fetch in BibleContext.
    // if (currentBook && (!verses || verses.length === 0) && !bibleIsLoading) {
    // console.log(`[BibleReader] Attempting to load chapter 1 for ${currentBook} as no verses are present.`);
    // fetchVerses(currentBook, 1);
    // }
  }, [currentBook, verses, bibleIsLoading, fetchVerses]);

  useEffect(() => {
    // console.log('[BibleReader] Component MOUNTED');
    // const readerId = Math.random().toString(36).substring(7);
    // console.log('[BibleReader] Instance ID:', readerId);
    return () => {
      // console.log('[BibleReader] Component WILL UNMOUNT. Instance ID:', readerId);
    };
  }, []); // Empty dependency array ensures this runs only on mount and unmount

  const getErrorMessage = (error) => {
    if (!error) return null;
    if (typeof error === 'string') return error;
    if (typeof error.message === 'string') return error.message;
    // Attempt to stringify if it's an object with other details, or provide a generic message
    // This handles the case where error might be { fetch: "message", ... } or other structures
    if (typeof error.fetch === 'string') return error.fetch;
    if (typeof error.studyNote === 'string') return error.studyNote;
    if (typeof error.quickNote === 'string') return error.quickNote;
    // Added check for chapterNotes property, in case the whole error object from useNotes is passed
    if (typeof error.chapterNotes === 'string') return error.chapterNotes;
    // Add more specific checks if other error structures are common from your hooks
    // console.warn("[BibleReader] Received error object that couldn't be parsed into a specific message. Structure:", error);
    return 'An unexpected error occurred.'; // Fallback generic message
  };

  const finalDisplayError = getErrorMessage(bibleError) ||
                            getErrorMessage(errors.chapterNotes) ||
                            getErrorMessage(highlightsError);

  if (finalDisplayError) { // Now finalDisplayError should be a string or null
    return (
      <div className="p-4 bg-red-100 text-red-700 rounded m-4">
        <p className="font-bold">Error:</p>
        <p>{finalDisplayError}</p>
      </div>
    );
  }

  // Log to help debug the "Objects are not valid as a React child" error
  if (currentBook !== null && typeof currentBook !== 'string') { // Check if not null AND not a string
    // console.error('[BibleReader] currentBook is not a string (and not null):', currentBook);
  }
  // currentChapter can be a number or string, so the existing check is mostly fine,
  // but let's ensure it's not an object either.
  if (currentChapter !== null && typeof currentChapter !== 'string' && typeof currentChapter !== 'number') {
    // console.error('[BibleReader] currentChapter is not a string or number (and not null):', currentChapter);
  }
  if (finalDisplayError && typeof finalDisplayError !== 'string') { // This should ideally not happen with getErrorMessage
    // console.error('[BibleReader] finalDisplayError is not a string (after getErrorMessage):', finalDisplayError);
  }

  const handleOpenSidePanel = (verse) => {
    // setActiveVerse(verse); // This was causing an issue with the sticky verse logic
    setSidePanelVerse(verse); // Use separate state for the side panel context
    setIsChapterNotesPanelOpen(false);
  };

  const handleCloseSidePanel = () => {
    // setActiveVerse(null);
    setSidePanelVerse(null);
  };

  const handleOpenChapterNotes = () => {
    // setActiveVerse(null);
    setSidePanelVerse(null); // Close verse panel if chapter notes are opened
    setIsChapterNotesPanelOpen(true);
  };

  const handleCloseChapterNotes = () => {
    setIsChapterNotesPanelOpen(false);
  };

  /*
  // This useEffect was causing issues with scrolling and verse activation.
  // The primary active verse for the side panel is now sidePanelVerse.
  // If a different kind of "active verse" for main view is needed, 
  // it should be re-evaluated.
  useEffect(() => {
    if (activeVerse) {
      const element = document.getElementById(`verse-${activeVerse.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activeVerse]);
  */

  // Commenting out this useMemo block as getPreviousChapter and other nav functions are not defined
  /*
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

    // const prevChapterDetails = getPreviousChapter(currentBook, currentChapter);
    // const nextChapterDetails = getNextChapter(currentBook, currentChapter);
    // const prevBookDetails = getPreviousBook(currentBook);
    // const nextBookDetails =getNextBook(currentBook);


    return {
      beforeVerses: verses.slice(0, activeIndex),
      currentActiveVerse: verses[activeIndex],
      afterVerses: verses.slice(activeIndex + 1),
      // prevChapterDetails,
      // nextChapterDetails,
      // prevBookDetails,
      // nextBookDetails
    };
  }, [verses, activeVerse, currentBook, currentChapter]); // Removed getNextChapter etc. from deps for now
  */

  // Simplified navigation handlers (using setCurrentBook/setCurrentChapter from useBible)
  const handleBookChange = (newBook) => {
    if (newBook === currentBook) return;
    setIsLoadingChapters(true);
    setCurrentBook(newBook); // This will trigger fetchVerses for chapter 1 via BibleContext's useEffect
    setCurrentChapter(1);    // Explicitly set to chapter 1 for new book
    // fetchVerses(newBook, 1).finally(() => setIsLoadingChapters(false)); // Direct call might be redundant
    // Let BibleContext handle fetching, just manage UI loading state if needed.
    // We might not even need setIsLoadingChapters if BibleContext.isLoading is sufficient.
  };

  const handleChapterChange = (newChapter) => {
    if (newChapter === currentChapter) return;
    // setIsLoadingChapters(true); // May not be needed if BibleContext.isLoading is used
    setCurrentChapter(newChapter); // This will trigger fetchVerses via BibleContext's useEffect
    // fetchVerses(currentBook, newChapter).finally(() => setIsLoadingChapters(false));
  };

  // useEffect(() => { // MOVED TO TOP
  //   // This effect tries to load chapter 1 if no verses are loaded for currentBook.
  //   // It might conflict with URL param handling or initial load logic.
  //   // Let's refine this or rely on the primary fetch in BibleContext.
  //   // if (currentBook && (!verses || verses.length === 0) && !bibleIsLoading) {
  //   // console.log(`[BibleReader] Attempting to load chapter 1 for ${currentBook} as no verses are present.`);
  //   // fetchVerses(currentBook, 1);
  //   // }
  // }, [currentBook, verses, bibleIsLoading, fetchVerses]);

  return (
    <div className={`relative h-full w-full transition-all duration-300 ${activeVerse || isChapterNotesPanelOpen ? 'mr-96' : ''}`}>
      <div className="px-4 md:px-8 h-full">
        <div className="prose max-w-none">
          <div className="flex justify-between items-center bg-white z-20 py-2 border-b mb-4 dark:bg-gray-800 dark:border-gray-700">
            <h2 className="text-2xl font-bold m-0 pl-4 dark:text-gray-100">
              {typeof currentBook === 'string' ? currentBook : '[Invalid Book]'} {typeof currentChapter === 'string' || typeof currentChapter === 'number' ? currentChapter : '[Invalid Chapter]'}
            </h2>
            <button
              onClick={handleOpenChapterNotes}
              className="flex items-center gap-1 px-3 py-1.5 mr-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg dark:bg-blue-900/50 dark:hover:bg-blue-800/50 dark:text-blue-300"
              title="Chapter Notes"
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-sm">Chapter Notes</span>
            </button>
          </div>
          
          <div className="space-y-1 pb-24 pt-4">
            {bibleIsLoading ? (
              <LoadingState />
            ) : (
              <>
                <div>
                  {verses && verses.length > 0 ? (
                    verses.map((verse, index) => {
                      const verseKey = `${verse.book}-${verse.chapter}-${verse.verse}`;
                      // Ensure numeric comparison for chapter and verse from both sources
                      const highlightsForVerse = highlights.filter(
                        h => h.book === verse.book && 
                             parseInt(String(h.chapter), 10) === parseInt(String(verse.chapter), 10) && 
                             parseInt(String(h.verse), 10) === parseInt(String(verse.verse), 10)
                      );
                      return (
                        <BibleVerseWithNotes
                          key={verseKey}
                          verse={verse}
                          isActive={activeVerse && activeVerse.book === verse.book && activeVerse.chapter === verse.chapter && activeVerse.verse === verse.verse}
                          onOpenSidePanel={handleOpenSidePanel}
                          verseHighlights={highlightsForVerse} // Pass filtered highlights
                          onHighlightCreated={updateHighlightsForVerse} // Pass updateHighlightsForVerse function
                        />
                      );
                    })
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                      No verses available for {currentBook} {currentChapter}.
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {sidePanelVerse && (
        <StudyNotesSidePanel 
          verse={sidePanelVerse}
          onClose={handleCloseSidePanel}
          chapterNotesCache={chapterNotesCache}
          isLoadingChapterNotes={loadingStates.chapterNotes}
          isSavingNote={loadingStates.studyNote}
          saveStudyNote={saveStudyNote}
          error={errors.chapterNotes}
        />
      )}

      {isChapterNotesPanelOpen && currentBook && currentChapter && (
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
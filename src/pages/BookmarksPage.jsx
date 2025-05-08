import React from 'react';
import { useBookmarks } from '../hooks/useBookmarks';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Trash2, AlertTriangle } from 'lucide-react';

const BookmarksPage = () => {
  const { bookmarks, isLoading, error, removeBookmark } = useBookmarks();
  const navigate = useNavigate();

  const handleRemoveBookmark = async (verseIdentifier) => {
    // The removeBookmark hook expects a verseIdentifier object { book, chapter, verse }
    await removeBookmark(verseIdentifier);
    // Optionally, add feedback to the user
  };

  const navigateToVerse = (bookmark) => {
    // Ensure chapter and verse are numbers for the path if necessary, though hook should handle string conversion
    navigate(`/bible/${encodeURIComponent(bookmark.book)}/${bookmark.chapter}`);
    // If you have functionality to scroll to a specific verse, you might pass bookmark.verse as well
    // e.g., navigate(`/bible/${bookmark.book}/${bookmark.chapter}#verse-${bookmark.verse}`);
    // Or manage verse selection via context or state after navigation.
  };

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p>Loading bookmarks...</p>
        {/* You can add a spinner here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-md">
        <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-500 dark:text-red-400" />
        <p className="font-semibold">Error loading bookmarks</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <div className="p-4 text-center">
        <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
        <h1 className="text-2xl font-bold mb-2">No Bookmarks Yet</h1>
        <p className="text-gray-600 dark:text-gray-400">You haven't bookmarked any verses. Start exploring and add some!</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-100">Your Bookmarks</h1>
      <div className="space-y-4">
        {bookmarks.map((bookmark) => (
          <div 
            key={bookmark.id} // Assuming each bookmark has a unique ID from the backend/hook
            className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 
                  className="text-xl font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer mb-1"
                  onClick={() => navigateToVerse(bookmark)}
                >
                  {bookmark.book} {bookmark.chapter}:{bookmark.verse}
                </h2>
                {bookmark.text && (
                  <p className="text-gray-700 dark:text-gray-300 italic truncate">
                    "{bookmark.text.substring(0, 100)}{bookmark.text.length > 100 ? '...' : ''}"
                  </p>
                )}
              </div>
              <button
                onClick={() => handleRemoveBookmark({ book: bookmark.book, chapter: bookmark.chapter, verse: bookmark.verse })}
                className="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors duration-150"
                title="Remove bookmark"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookmarksPage; 
// src/pages/NotesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNotes } from '../hooks/useNotes';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, Clock } from 'lucide-react';

const NotesPage = () => {
  const { fetchAllNotes, isLoading } = useNotes();
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const loadNotes = async (page = 1) => {
    try {
      const response = await fetchAllNotes(page, pagination.limit);
      setNotes(response.notes);
      setPagination(response.pagination);
      setError(null);
    } catch (err) {
      setError('Failed to load notes. Please try again later.');
      console.error('Error loading notes:', err);
    }
  };

  useEffect(() => {
    loadNotes(1);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      loadNotes(newPage);
    }
  };

  const navigateToVerse = (note) => {
    let path = `/bible/${encodeURIComponent(note.book)}/${note.chapter}`;
    if (note.verse) {
      path += `#verse-${note.verse}`;
    }
    navigate(path);
  };

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;

    return (
      <div className="flex items-center justify-center mt-6 gap-2">
        <button 
          onClick={() => handlePageChange(pagination.page - 1)} 
          disabled={pagination.page === 1 || isLoading.allNotes}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
            const pageNum = pagination.page <= 3
              ? i + 1
              : pagination.page >= pagination.pages - 2
                ? pagination.pages - 4 + i
                : pagination.page - 2 + i;
                
            if (pageNum > pagination.pages || pageNum < 1) return null;
            
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                disabled={isLoading.allNotes}
                className={`w-8 h-8 rounded flex items-center justify-center ${
                  pageNum === pagination.page 
                    ? 'bg-blue-100 text-blue-600 font-medium' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>
        
        <button 
          onClick={() => handlePageChange(pagination.page + 1)} 
          disabled={pagination.page === pagination.pages || isLoading.allNotes}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  };

  const getNoteTypeLabel = (type) => {
    return type === 'study' ? 'Study Note' : 'Quick Note';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Your Notes</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      {isLoading.allNotes && notes.length === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-100 p-4 rounded-lg">
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <p className="text-gray-500">You haven't created any notes yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map(note => (
            <div key={note.id} className="border rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-3 flex justify-between items-center border-b">
                <div>
                  <span className="text-sm font-medium">{note.book} {note.chapter}:{note.verse}</span>
                  <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                    {getNoteTypeLabel(note.note_type)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(note.updated_at)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(note.updated_at)}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
              </div>
              <div className="p-3 bg-gray-50 border-t">
                <button
                  onClick={() => navigateToVerse(note)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Go to verse
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {renderPagination()}
    </div>
  );
};

export default NotesPage;

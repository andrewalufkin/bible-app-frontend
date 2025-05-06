import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lightbulb, Edit2, Check, XCircle } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import AutoExpandingTextarea from '../components/AutoExpandingTextarea';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const InsightsPage = () => {
  const { book, chapter } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { saveChapterNote } = useNotes();
  
  const [verses, setVerses] = useState([]);
  const [verseNotes, setVerseNotes] = useState([]);
  const [chapterNote, setChapterNote] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  
  // Chapter note editing state
  const [isEditingChapterNote, setIsEditingChapterNote] = useState(false);
  const [editedChapterNote, setEditedChapterNote] = useState('');
  const [chapterNoteError, setChapterNoteError] = useState(null);
  const [savingChapterNote, setSavingChapterNote] = useState(false);
  const insightsParagraphRef = useRef(null);
  const [showRawContent, setShowRawContent] = useState(false);
  const [testResponse, setTestResponse] = useState(null);

  // Add a test function to check the API response handling
  const testApiResponse = async () => {
    try {
      console.log('Testing API response handling...');
      const testUrl = `${API_BASE_URL}/notes/insights/test`;
      
      const response = await fetch(testUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Test response:', data);
        console.log('Test field length:', data.test_field.length);
        console.log('Expected length:', data.length);
        console.log('Match?', data.test_field.length === data.length);
        setTestResponse({
          received: data.test_field.length,
          expected: data.length,
          match: data.test_field.length === data.length
        });
      } else {
        console.error('Test failed:', response.statusText);
      }
    } catch (err) {
      console.error('Error in test:', err);
    }
  };

  // Simplify state tracking for insights
  useEffect(() => {
    if (insights && insightsParagraphRef.current) {
      // Just ensure the ref is connected - no need for detailed logging
      const domContent = insightsParagraphRef.current.textContent;
    }
  }, [insights]);

  // Fetch Bible verses and notes on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching data for ${book} ${chapter}...`);
        
        // Fetch Bible verses for the chapter
        const versesResponse = await fetch(`${API_BASE_URL}/bible/verses/${book}/${chapter}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!versesResponse.ok) {
          throw new Error(`Failed to fetch Bible verses: ${versesResponse.statusText}`);
        }
        
        const versesData = await versesResponse.json();
        setVerses(versesData);
        console.log(`Fetched ${versesData.length} verses successfully`);
        
        // Fetch all notes for the entire chapter at once
        const notesResponse = await fetch(`${API_BASE_URL}/notes/chapter/${book}/${chapter}/notes`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (notesResponse.ok) {
          const notesData = await notesResponse.json();
          // Filter out empty notes
          const filteredNotes = notesData.filter(note => note.content?.trim());
          setVerseNotes(filteredNotes);

          // Find the chapter note from the fetched notes
          const chapterNoteData = filteredNotes.find(note => note.note_type === 'chapter');
          if (chapterNoteData) {
            setChapterNote(chapterNoteData);
            setEditedChapterNote(chapterNoteData.content || '');
          } else {
            // Handle case where no chapter note exists yet
            setChapterNote(null);
            setEditedChapterNote('');
          }

        } else if (notesResponse.status !== 404) {
          // Only log error if it's not a 404 (no notes found)
          console.error('Failed to fetch chapter notes:', notesResponse.statusText);
        }
        
        // Fetch existing insights for this chapter
        try {
          console.log(`Fetching insights for ${book} ${chapter}...`);
          const insightsUrl = `${API_BASE_URL}/notes/insights?book=${book}&chapter=${chapter}`;
          console.log(`Insights URL: ${insightsUrl}`);
          
          const insightsResponse = await fetch(insightsUrl, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          console.log(`Insights response status: ${insightsResponse.status}`);
          
          if (insightsResponse.ok) {
            const insightsData = await insightsResponse.json();
            
            const formattedInsights = {
              chapter_reference: insightsData.chapter_reference,
              insights: insightsData.content || insightsData.insights || '',
              preferences_used: insightsData.preferences_used,
              created_at: insightsData.created_at
            };
            
            setInsights(formattedInsights);
          } else if (insightsResponse.status === 404) {
            console.log('No existing insights found for this chapter');
          } else {
            console.error(`Error fetching insights: ${insightsResponse.statusText}`);
          }
        } catch (insightsErr) {
          console.error('Failed to fetch insights:', insightsErr);
          // Don't set an error state for this, as we can still show the page
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.message);
        setLoading(false);
      }
    };
    
    if (book && chapter) {
      fetchData();
    }
  }, [book, chapter]);

  const handleEditChapterNote = () => {
    setIsEditingChapterNote(true);
    setChapterNoteError(null);
  };

  const handleSaveChapterNote = async () => {
    try {
      setSavingChapterNote(true);
      setChapterNoteError(null);
      
      const trimmedNote = editedChapterNote.trim();
      
      // If empty, don't save
      if (!trimmedNote) {
        setChapterNoteError("Note content cannot be empty");
        setSavingChapterNote(false);
        return;
      }
      
      const savedNote = await saveChapterNote({
        book,
        chapter: String(chapter),
        content: trimmedNote
      });
      
      if (savedNote) {
        setChapterNote(savedNote);
        setIsEditingChapterNote(false);
        setChapterNoteError(null);
      }
    } catch (err) {
      setChapterNoteError(err.message || "Failed to save chapter note");
      console.error("Error saving chapter note:", err);
    } finally {
      setSavingChapterNote(false);
    }
  };

  const handleCancelEditChapterNote = () => {
    setIsEditingChapterNote(false);
    setEditedChapterNote(chapterNote?.content || '');
    setChapterNoteError(null);
  };

  const generateInsights = async () => {
    try {
      setGenerating(true);
      setError(null);
      
      console.log('Generating insights...');
      
      // Prepare the data for the API request
      const payload = {
        verses: verses.map(verse => ({
          book,
          chapter: String(chapter),
          verse: verse.verse,
          text: verse.text
        })),
        verse_notes: verseNotes.map(note => ({
          book: note.book,
          chapter: note.chapter,
          verse: note.verse,
          content: note.content
        })),
        chapter_note: chapterNote ? {
          book: chapterNote.book,
          chapter: chapterNote.chapter,
          content: chapterNote.content
        } : {},
      };
      
      console.log('Payload for generating insights:', payload);
      
      // Show a temporary generating message
      if (insights) {
        const oldInsights = {...insights};
        setInsights({
          ...oldInsights,
          insights: "Generating new insights based on your preferences... This usually takes 15-30 seconds.",
          isGenerating: true
        });
      }
      
      const insightsUrl = `${API_BASE_URL}/notes/insights`;
      console.log(`POST request to: ${insightsUrl}`);
      
      const response = await fetch(insightsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      console.log(`Generate insights response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`Failed to generate insights: ${response.statusText}`);
      }
      
      const insightsData = await response.json();
      
      // Check if there's an error in the response 
      if (insightsData.error) {
        throw new Error(insightsData.error);
      }
      
      // Fix: Ensure consistent structure between GET and POST responses
      const formattedInsights = {
        chapter_reference: insightsData.chapter_reference,
        insights: insightsData.content || insightsData.insights || '',
        preferences_used: insightsData.preferences_used,
        created_at: insightsData.created_at
      };
      
      setInsights(formattedInsights);
      
    } catch (err) {
      console.error('Error generating insights:', err);
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">AI Insights</h1>
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
          <span className="ml-3">Loading chapter data...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">AI Insights</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-medium">Error generating insights</p>
          <p className="mb-3">{error}</p>
          <div className="flex space-x-3">
            <button 
              onClick={generateInsights}
              className="bg-blue-600 text-white py-1 px-3 rounded hover:bg-blue-700"
              disabled={generating}
            >
              {generating ? 'Retrying...' : 'Try Again'}
            </button>
            <button 
              onClick={() => navigate(`/bible/${book}/${chapter}`)}
              className="bg-gray-600 text-white py-1 px-3 rounded hover:bg-gray-700"
            >
              Return to Bible
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">AI Insights</h1>
      <h2 className="text-xl mb-6 text-gray-600">{book} {chapter}</h2>
      
      {/* Stats about the content */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">Chapter Summary</h3>
          {!isEditingChapterNote && (
            <button
              onClick={handleEditChapterNote}
              className="p-1 rounded hover:bg-gray-200 text-gray-600 flex items-center gap-1"
              title="Edit chapter note"
            >
              <Edit2 className="w-4 h-4" />
              <span className="text-sm">Edit Note</span>
            </button>
          )}
          {isEditingChapterNote && (
            <div className="flex gap-2">
              <button
                onClick={handleSaveChapterNote}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-green-100 text-green-600"
                title="Save changes"
                disabled={savingChapterNote}
              >
                <Check className="w-4 h-4" />
                <span className="text-sm">Save</span>
              </button>
              <button
                onClick={handleCancelEditChapterNote}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-red-100 text-red-600"
                title="Cancel changes"
                disabled={savingChapterNote}
              >
                <XCircle className="w-4 h-4" />
                <span className="text-sm">Cancel</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center mb-4">
          <div>
            <p className="text-lg font-bold">{verses.length}</p>
            <p className="text-sm text-gray-600">Verses</p>
          </div>
          <div>
            <p className="text-lg font-bold">{verseNotes.length}</p>
            <p className="text-sm text-gray-600">Verse Notes</p>
          </div>
          <div>
            <p className="text-lg font-bold">{chapterNote ? 'Yes' : 'No'}</p>
            <p className="text-sm text-gray-600">Chapter Note</p>
          </div>
        </div>
        
        {/* Chapter Note Editor/Viewer */}
        <div>
          {chapterNoteError && (
            <div className="text-red-600 text-sm mb-2">
              {chapterNoteError}
            </div>
          )}
          
          {isEditingChapterNote ? (
            <AutoExpandingTextarea
              value={editedChapterNote}
              onChange={(e) => setEditedChapterNote(e.target.value)}
              placeholder="Add your chapter notes here..."
              className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              disabled={savingChapterNote}
              minRows={4}
            />
          ) : (
            <div className="p-3 bg-white border rounded">
              {chapterNote?.content ? (
                <p className="text-gray-600 whitespace-pre-wrap">{chapterNote.content}</p>
              ) : (
                <p className="text-gray-400 italic">No chapter notes yet. Click 'Edit Note' to add your chapter summary.</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* AI Preferences Summary */}
      {user?.ai_preferences && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">Your AI Preferences</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium">Style</p>
              <p className="text-gray-600 capitalize">{user.ai_preferences.writing_style}</p>
            </div>
            <div>
              <p className="font-medium">Depth</p>
              <p className="text-gray-600 capitalize">{user.ai_preferences.depth_level}</p>
            </div>
            <div>
              <p className="font-medium">Challenge Level</p>
              <p className="text-gray-600">{Math.round(user.ai_preferences.challenge_level * 100)}%</p>
            </div>
            <div>
              <p className="font-medium">Focus</p>
              <p className="text-gray-600">
                {user.ai_preferences.time_orientation < 0.33 
                  ? 'Historical' 
                  : user.ai_preferences.time_orientation > 0.66 
                    ? 'Modern' 
                    : 'Balanced'}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <button 
              onClick={() => navigate('/settings')}
              className="text-blue-600 text-sm hover:underline"
            >
              Customize AI Settings
            </button>
          </div>
        </div>
      )}
      
      {/* Generate Button */}
      {!insights && (
        <div className="flex justify-center my-8">
          <button 
            onClick={generateInsights}
            disabled={generating}
            className={`py-3 px-6 rounded-lg text-lg ${
              generating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {generating ? 'Generating Insights...' : 'Generate AI Insights'}
          </button>
        </div>
      )}
      
      {/* Generated Insights */}
      {insights && (
        <div className="mt-6">
          <div className="bg-white border p-6 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">
                {insights.chapter_reference} Insights
              </h3>
              {insights.created_at && !insights.isGenerating && (
                <span className="text-xs text-gray-500">
                  Generated: {new Date(insights.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="prose max-w-none overflow-auto">
              <div
                ref={insightsParagraphRef}
                className="whitespace-pre-wrap break-words"
                data-testid="insights-content"
              >
                {insights.insights}
              </div>
            </div>
            
            {insights.preferences_used && (
              <div className="mt-6 pt-4 border-t text-sm text-gray-600">
                <p className="font-medium mb-1">Generated using:</p>
                <ul className="flex flex-wrap gap-2">
                  <li className="bg-gray-100 px-2 py-1 rounded-full">
                    Style: {insights.preferences_used.writing_style}
                  </li>
                  <li className="bg-gray-100 px-2 py-1 rounded-full">
                    Depth: {insights.preferences_used.depth_level}
                  </li>
                  <li className="bg-gray-100 px-2 py-1 rounded-full">
                    Challenge: {Math.round(insights.preferences_used.challenge_level * 100)}%
                  </li>
                  <li className="bg-gray-100 px-2 py-1 rounded-full">
                    {insights.preferences_used.time_orientation < 0.33 
                      ? 'Historical Focus' 
                      : insights.preferences_used.time_orientation > 0.66 
                        ? 'Modern Focus' 
                        : 'Balanced Focus'}
                  </li>
                  {insights.preferences_used.response_length && (
                    <li className="bg-gray-100 px-2 py-1 rounded-full">
                      Length: ~{insights.preferences_used.response_length} chars
                    </li>
                  )}
                  {insights.preferences_used.personalized && (
                    <li className="bg-gray-100 px-2 py-1 rounded-full">
                      Personalized
                    </li>
                  )}
                </ul>
              </div>
            )}
            
            {/* Regenerate Button */}
            <div className="mt-4 border-t pt-4">
              <button 
                onClick={generateInsights}
                disabled={generating}
                className={`flex items-center gap-2 py-2 px-4 rounded text-sm ${
                  generating 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Lightbulb size={16} />
                {generating ? 'Regenerating...' : 'Regenerate Insights'}
              </button>
            </div>
          </div>
          
          <div className="flex justify-between mt-6">
            <button 
              onClick={() => navigate(`/bible/${book}/${chapter}`)}
              className="py-2 px-4 bg-gray-100 hover:bg-gray-200 rounded"
            >
              Back to Bible
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsightsPage; 
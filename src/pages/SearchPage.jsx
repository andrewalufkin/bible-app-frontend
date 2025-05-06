// src/pages/SearchPage.jsx
import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SearchResult = ({ verse }) => {
  // URL-encode the book name for the path
  const bookPath = encodeURIComponent(verse.book);
  const chapterPath = verse.chapter; // Chapter number shouldn't need encoding

  return (
    <Link to={`/bible/${bookPath}/${chapterPath}`} className="block no-underline text-inherit hover:no-underline">
      <div className="p-4 border rounded-lg mb-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-150 ease-in-out">
        <div className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
          {verse.book} {verse.chapter}:{verse.verse}
        </div>
        <div className="text-gray-600 dark:text-gray-400">{verse.text}</div>
      </div>
    </Link>
  );
};

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [infoMessage, setInfoMessage] = useState(null); // For non-error messages from AI
  const [hasSearched, setHasSearched] = useState(false);
  const [useAiSearch, setUseAiSearch] = useState(false); // State for AI toggle
  const { isAuthenticated } = useAuth();

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setInfoMessage(null); // Clear previous info messages
    setResults([]); // Clear previous results
    setHasSearched(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Determine the API endpoint based on the toggle state
      const searchEndpoint = useAiSearch ? '/api/bible/ai-search' : '/api/bible/search';
      const apiUrl = `${process.env.REACT_APP_BACKEND_URL}${searchEndpoint}?q=${encodeURIComponent(query.trim())}`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        // Handle specific backend errors if possible, otherwise generic message
        let errorMsg = 'Search failed';
        try {
            const errorData = await response.json();
            errorMsg = errorData.error || (response.status === 401 ? 'Authentication required' : `Search failed (${response.status})`);
        } catch (jsonError) {
            errorMsg = `Search failed (${response.status})`;
        }
        throw new Error(errorMsg);
      }
      
      const data = await response.json();

      // Handle potential info/warning messages from AI endpoint
      if (data.message && data.type) {
          setInfoMessage({ text: data.message, type: data.type });
          setResults([]);
      } else if (Array.isArray(data)) {
        setResults(data);
      } else {
        console.error('Unexpected response format:', data);
        setResults([]);
        setError('Received unexpected data from server.');
      }
    } catch (err) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setHasSearched(false); // Reset search state when user types
  };

  // If not authenticated, show login prompt instead of search form
  if (!isAuthenticated) {
    return (
      <div className="w-full h-full">
        <h1 className="text-3xl font-bold mb-6">Search the Bible</h1>
        <div className="bg-yellow-50 border border-yellow-400 text-yellow-700 px-4 py-5 rounded-lg">
          <p className="mb-3">Authentication is required to use the search feature.</p>
          <Link to="/login" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Sign in
          </Link>
          <span className="mx-2">or</span>
          <Link to="/register" className="inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
            Create an account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Search the Bible</h1>
        <div className="flex items-center">
          <label htmlFor="ai-toggle" className="flex items-center cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                id="ai-toggle" 
                className="sr-only" 
                checked={useAiSearch}
                onChange={() => setUseAiSearch(!useAiSearch)} 
              />
              <div className={`block w-10 h-6 rounded-full transition ${useAiSearch ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
              <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${useAiSearch ? 'translate-x-4' : ''}`}></div>
            </div>
            <div className="ml-3 text-sm text-gray-600">
              Search with AI
            </div>
          </label>
        </div>
      </div>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder={useAiSearch 
              ? "Ask about topics, stories, or ideas (e.g., 'woman at the well')" 
              : "Search Bible text (e.g., 'love thy neighbor')"} 
            className="w-full p-4 pr-12 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:ring-blue-400 dark:focus:border-blue-400"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            <SearchIcon size={24} />
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-20 bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      )}

      {/* Display Info/Warning Messages */}
      {infoMessage && (
        <div className={`px-4 py-3 rounded-lg mb-4 ${infoMessage.type === 'warning' ? 'bg-yellow-50 border border-yellow-400 text-yellow-700' : 'bg-blue-50 border border-blue-400 text-blue-700'}`}>
          {infoMessage.text}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
          {error === 'Authentication required' && (
            <div className="mt-3">
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium">
                Go to login page
              </Link>
            </div>
          )}
        </div>
      )}

      {!isLoading && !error && !infoMessage && results.length > 0 && (
        <div className="space-y-4">
          {useAiSearch && (
            <div className="mb-2 text-sm text-gray-600 italic">
              AI suggested the following results based on your query:
            </div>
          )}
          {results.map((verse, index) => (
            <SearchResult key={index} verse={verse} />
          ))}
        </div>
      )}

      {!isLoading && !error && !infoMessage && hasSearched && results.length === 0 && query && (
        <div className="text-center text-gray-600 py-8">
          No results found for "{query}"
        </div>
      )}

      {!hasSearched && query && (
        <div className="text-center text-gray-600 py-8">
          Press enter or click the search icon to search
        </div>
      )}
    </div>
  );
};

export default SearchPage;
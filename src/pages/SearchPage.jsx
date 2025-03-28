// src/pages/SearchPage.jsx
import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SearchResult = ({ verse }) => (
  <div className="p-4 border rounded-lg mb-4 hover:bg-gray-50">
    <div className="font-semibold text-gray-700 mb-2">
      {verse.book_name} {verse.chapter}:{verse.verse}
    </div>
    <div className="text-gray-600">{verse.text}</div>
  </div>
);

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/bible/search?q=${encodeURIComponent(query.trim())}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(response.status === 401 ? 'Authentication required' : 'Search failed');
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        console.error('Unexpected response format:', data);
        setResults([]);
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
      <h1 className="text-3xl font-bold mb-6">Search the Bible</h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search by topics, stories, or ideas (e.g., 'Samaritan woman at the well')"
            className="w-full p-4 pr-12 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

      {!isLoading && !error && results.length > 0 && (
        <div className="space-y-4">
          {results.map((verse, index) => (
            <SearchResult key={index} verse={verse} />
          ))}
        </div>
      )}

      {!isLoading && !error && hasSearched && results.length === 0 && query && (
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
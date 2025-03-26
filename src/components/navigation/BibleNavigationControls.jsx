import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Lightbulb } from 'lucide-react';
import { useBible } from '../../contexts/BibleContext';
import { useAuth } from '../../contexts/AuthContext';
import BibleNavigation from './BibleNavigation';

const BibleNavigationControls = () => {
  const { currentBook, currentChapter } = useBible();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showInsightsDropdown, setShowInsightsDropdown] = useState(false);
  const insightsDropdownRef = useRef(null);

  // Navigate to AI Insights page
  const handleNavigateToInsights = () => {
    if (currentBook && currentChapter) {
      navigate(`/insights/${currentBook}/${currentChapter}`);
      setShowInsightsDropdown(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (insightsDropdownRef.current && !insightsDropdownRef.current.contains(event.target)) {
        setShowInsightsDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex items-center space-x-3">
      <BibleNavigation />
      
      {isAuthenticated && currentBook && currentChapter && (
        <div className="relative inline-block" ref={insightsDropdownRef}>
          <button 
            onClick={() => setShowInsightsDropdown(!showInsightsDropdown)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Lightbulb size={16} className="text-blue-600" />
            <span className="font-medium">AI Insights</span>
            <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${showInsightsDropdown ? 'transform rotate-180' : ''}`} />
          </button>

          {/* Dropdown panel */}
          {showInsightsDropdown && (
            <div className="absolute z-50 mt-1 w-72 bg-white border rounded-lg shadow-lg p-4 animate-fadeIn">
              <p className="text-sm text-gray-600 mb-3">
                Get AI-powered insights for {currentBook} {currentChapter}
              </p>
              <button
                onClick={handleNavigateToInsights}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none"
              >
                View Insights
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BibleNavigationControls; 
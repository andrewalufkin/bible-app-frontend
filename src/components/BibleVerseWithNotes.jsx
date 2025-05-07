import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MessageSquare } from 'lucide-react';
import { useNotes } from '../hooks/useNotes';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL}/api`; // Added for API calls

const DEFAULT_HIGHLIGHT_COLORS = ['#FFFF00', '#ADFF2F', '#87CEFA', '#FFC0CB', '#FFA500'];

// Helper function to render verse text with highlights
const renderVerseTextWithHighlights = (text, highlightsForVerse, theme) => {
  // Safeguard: Ensure 'text' is a string
  if (typeof text !== 'string') {
    console.error(
      "BibleVerseWithNotes: `verse.text` is not a string. Received:", 
      text, 
      "This likely indicates an issue with data fetching or processing for verses, probably in BibleContext."
    );
    return "[Invalid verse text data]"; // Return a placeholder
  }

  if (!text) return ''; // Should be redundant now if text is validated as string above, but good for empty string.
  if (!highlightsForVerse || highlightsForVerse.length === 0) {
    return text; // No highlights, return plain text (which is now guaranteed to be a string or placeholder)
  }

  // Sort highlights by start_offset to process them in order
  const sortedHighlights = [...highlightsForVerse].sort((a, b) => a.start_offset - b.start_offset);

  let lastIndex = 0;
  const parts = [];

  sortedHighlights.forEach(highlight => {
    // Add text part before the current highlight
    if (highlight.start_offset > lastIndex) {
      parts.push(text.substring(lastIndex, highlight.start_offset));
    }
    // Add the highlighted part
    parts.push(
      <span
        key={`hl-${highlight.id || highlight.start_offset}`}
        style={{
          backgroundColor: highlight.color,
          borderRadius: '3px',
          padding: '0.5px 2px',
          margin: '0 -2px',
          color: theme === 'dark' ? 'black' : 'inherit'
        }}
      >
        {text.substring(highlight.start_offset, highlight.end_offset)}
      </span>
    );
    lastIndex = highlight.end_offset;
  });

  // Add any remaining text part after the last highlight
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};

const BibleVerseWithNotes = ({ verse, onOpenSidePanel, isActive, verseHighlights, onHighlightCreated }) => {
  const { fetchVerseNotes } = useNotes();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [hoveredVerse, setHoveredVerse] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [selectionDetails, setSelectionDetails] = useState(null);
  const [popover, setPopover] = useState({ visible: false, top: 0, left: 0 });
  const verseTextRef = useRef(null);
  const popoverRef = useRef(null);

  // Helper to get auth headers (mirroring useNotes.js)
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    console.log("[DEBUG] Token from localStorage:", token);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Check if viewport is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Clear selection and hide popover if user clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popover.visible &&
        verseTextRef.current &&
        !verseTextRef.current.contains(event.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
      ) {
        setPopover({ visible: false, top: 0, left: 0 });
        setSelectionDetails(null);
        window.getSelection().removeAllRanges();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popover.visible]);

  const handleMouseUp = () => {
    if (!verseTextRef.current) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const selectedText = selection.toString().trim();

      if (selectedText && verseTextRef.current.contains(range.commonAncestorContainer)) {
        const rect = range.getBoundingClientRect();
        const verseRect = verseTextRef.current.getBoundingClientRect();
        
        setSelectionDetails({
          range,
          text: selectedText,
          verseId: `${verse.book}-${verse.chapter}-${verse.verse}`,
          book: verse.book,
          chapter: verse.chapter,
          verseNum: verse.verse,
        });
        setPopover({
          visible: true,
          top: rect.bottom - verseRect.top + window.scrollY + 5,
          left: rect.left - verseRect.left + window.scrollX + (rect.width / 2),
        });
      } else {
        if (popover.visible) {
            setPopover({ visible: false, top: 0, left: 0 });
            setSelectionDetails(null);
        }
      }
    } else {
        if (popover.visible) {
            setPopover({ visible: false, top: 0, left: 0 });
            setSelectionDetails(null);
        }
    }
  };

  const handleHighlight = async (color) => {
    console.log("[DEBUG] handleHighlight entered. Color:", color);

    console.log("[DEBUG] User object:", user);
    console.log("[DEBUG] selectionDetails object:", selectionDetails);
    if (selectionDetails) {
      console.log("[DEBUG] selectionDetails.range:", selectionDetails.range);
    }

    if (!selectionDetails || !selectionDetails.range || !user) {
      console.error("[DEBUG] Exiting: No selection details, range, or user. Details:", {
        hasSelectionDetails: !!selectionDetails,
        hasRange: !!(selectionDetails && selectionDetails.range),
        hasUser: !!user,
      });
      return;
    }

    const { range, book, chapter, verseNum } = selectionDetails;
    
    let startOffset = -1;
    let endOffset = -1;

    // The paragraph element containing the verse text and highlights
    const paragraphElement = verseTextRef.current?.querySelector('p.select-text');

    if (paragraphElement && range) {
        // Create a range that starts at the beginning of the paragraphElement 
        // and ends at the start of the user's actual selection.
        // The length of the text content of this range gives the startOffset.
        const rangeToStartOfSelection = document.createRange();
        rangeToStartOfSelection.selectNodeContents(paragraphElement); // Selects all content within paragraphElement
        // Now, we set the end of our measurement range to the start of the user's actual selection
        rangeToStartOfSelection.setEnd(range.startContainer, range.startOffset);
        startOffset = rangeToStartOfSelection.toString().length;

        // Similarly, create a range that starts at the beginning of the paragraphElement
        // and ends at the end of the user's actual selection.
        // The length of the text content of this range gives the endOffset.
        const rangeToEndOfSelection = document.createRange();
        rangeToEndOfSelection.selectNodeContents(paragraphElement); // Selects all content within paragraphElement
        // Now, we set the end of our measurement range to the end of the user's actual selection
        rangeToEndOfSelection.setEnd(range.endContainer, range.endOffset);
        endOffset = rangeToEndOfSelection.toString().length;

    } else {
        console.error("Could not determine paragraphElement or range for offset calculation.", { paragraphElement, range });
        setPopover({ visible: false, top: 0, left: 0 });
        setSelectionDetails(null);
        window.getSelection().removeAllRanges(); // Clear selection if we can't proceed
        return;
    }

    if (startOffset === -1 || endOffset === -1 || endOffset <= startOffset) {
        console.error("Invalid offsets calculated for highlight or empty selection after processing.", {
             startOffset, 
             endOffset, 
             selectedText: range ? range.toString() : 'N/A',
             selectionStartContainer: range ? range.startContainer : 'N/A',
             selectionStartOffset: range ? range.startOffset : 'N/A',
             selectionEndContainer: range ? range.endContainer : 'N/A',
             selectionEndOffset: range ? range.endOffset : 'N/A',
        });
        setPopover({ visible: false, top: 0, left: 0 });
        setSelectionDetails(null);
        window.getSelection().removeAllRanges(); // Clear selection if offsets are bad
        return;
    }

    const payload = {
      book: book,
      chapter: parseInt(chapter, 10),
      verse: parseInt(verseNum, 10),
      start_offset: startOffset,
      end_offset: endOffset,
      color: color,
    };

    console.log("Highlighting payload:", payload);

    try {
      // alert(`Highlighted with ${color}. API call to be implemented. Payload: ${JSON.stringify(payload)}`);
      const response = await fetch(`${API_BASE_URL}/highlights`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save highlight and parse error response' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const savedHighlightsForVerse = await response.json(); // Response is now an array of all highlights for the verse
      console.log("Highlights processed for verse:", savedHighlightsForVerse);
      
      if (onHighlightCreated) {
        // onHighlightCreated (which is updateHighlightsForVerse from the hook)
        // now expects (verseIdentifier, highlightsArray)
        const verseIdentifier = {
          book: book, // from selectionDetails, originally from verse prop
          chapter: parseInt(chapter, 10), // from selectionDetails, ensure integer
          verse: parseInt(verseNum, 10)   // from selectionDetails, ensure integer
        };
        onHighlightCreated(verseIdentifier, savedHighlightsForVerse); 
      }

    } catch (error) {
      console.error("Failed to save highlight:", error);
      alert(`Failed to save highlight: ${error.message}`);
    }

    setPopover({ visible: false, top: 0, left: 0 });
    setSelectionDetails(null);
    window.getSelection().removeAllRanges();
  };

  // Memoize the rendered verse text to avoid re-calculating on every render if verse text or highlights haven't changed.
  const renderedVerseText = useMemo(() => {
    return renderVerseTextWithHighlights(verse.text, verseHighlights, theme);
  }, [verse.text, verseHighlights, theme]);

  return (
    <div className="flex w-full">
      <div className="flex-1 bg-white dark:bg-transparent relative">
        <div 
          className={`relative p-4 transition-colors ${isActive ? 'bg-blue-50 dark:bg-blue-900/50' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
          onMouseEnter={() => !isMobile && setHoveredVerse(true)}
          onMouseLeave={() => !isMobile && setHoveredVerse(false)}
        >
          <div className="flex items-start gap-2">
            <span className="text-gray-500 text-sm min-w-[20px] dark:text-gray-400">{verse.verse}</span>
            <div className="flex-1">
              <div className={`${isMobile ? 'flex flex-col' : 'flex items-start justify-between'}`}>
                <div ref={verseTextRef} onMouseUp={handleMouseUp} className={`flex-1 ${isMobile ? 'w-full' : 'max-w-[calc(100%-96px)]'}`}>
                  <p className={`${isMobile ? 'text-base' : 'text-lg'} dark:text-gray-100 select-text`}>
                    {renderedVerseText}
                  </p>
                </div>
                
                <div className={`flex gap-2 ${isMobile ? 'mt-3' : 'ml-4 min-w-[80px] justify-end'} ${!isMobile && !hoveredVerse && !popover.visible ? 'invisible' : ''}`}>
                  <button 
                    onClick={() => onOpenSidePanel(verse)}
                    className={`p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 ${isActive ? 'bg-blue-200 dark:bg-blue-800' : ''}`}
                    title="Study note"
                  >
                    <MessageSquare className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          {popover.visible && selectionDetails && (
            <div
              ref={popoverRef}
              style={{
                position: 'absolute',
                top: `${popover.top}px`,
                left: `${popover.left}px`,
                transform: 'translateX(-50%)',
                zIndex: 1000,
              }}
              className="bg-white dark:bg-gray-700 shadow-lg rounded-md p-2 flex gap-1 border dark:border-gray-600"
            >
              {DEFAULT_HIGHLIGHT_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    console.log(`[DEBUG] Color button clicked. Color: ${color}`);
                    handleHighlight(color);
                  }}
                  className="w-6 h-6 rounded-full border dark:border-gray-400 dark:hover:border-gray-200 hover:opacity-80"
                  style={{ backgroundColor: color }}
                  title={`Highlight ${color}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BibleVerseWithNotes;
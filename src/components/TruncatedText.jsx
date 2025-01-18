import React, { useState, useRef, useEffect } from 'react';

const TruncatedText = ({ text, maxLines = 3 }) => {
  const [isTruncated, setIsTruncated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    const checkTruncation = () => {
      const element = textRef.current;
      if (!element) return;

      const lineHeight = parseInt(getComputedStyle(element).lineHeight);
      const maxHeight = lineHeight * maxLines;
      const actualHeight = element.scrollHeight;
      
      setIsTruncated(actualHeight > maxHeight);
    };

    checkTruncation();
    // Recheck on window resize
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [text, maxLines]);

  return (
    <div>
      <p
        ref={textRef}
        className={`text-gray-600 whitespace-pre-wrap ${!isExpanded ? 'line-clamp-3' : ''}`}
      >
        {text}
      </p>
      {isTruncated && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-700 text-sm mt-1 focus:outline-none"
        >
          {isExpanded ? 'See less' : 'See more'}
        </button>
      )}
    </div>
  );
};

export default TruncatedText; 
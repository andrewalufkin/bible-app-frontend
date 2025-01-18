import React, { useEffect, useRef } from 'react';

const AutoExpandingTextarea = ({ value, onChange, placeholder, className, disabled, minRows = 2 }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate minimum height based on minRows
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const minHeight = lineHeight * minRows;
    
    // Set the height to the maximum of minHeight and scrollHeight
    const newHeight = Math.max(minHeight, textarea.scrollHeight);
    textarea.style.height = `${newHeight}px`;
  }, [value, minRows]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      style={{ overflow: 'hidden', resize: 'none' }}
    />
  );
};

export default AutoExpandingTextarea; 
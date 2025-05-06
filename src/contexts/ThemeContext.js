import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Check localStorage for saved theme, default to 'light'
    const savedTheme = localStorage.getItem('theme');
    // Also check system preference
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme || (prefersDark ? 'dark' : 'light');
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const oldTheme = theme === 'dark' ? 'light' : 'dark';

    root.classList.remove(oldTheme);
    root.classList.add(theme);

    // Save theme to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext); 
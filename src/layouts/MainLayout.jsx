// src/layouts/MainLayout.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../components/navigation/Sidebar';
import BibleNavigation from '../components/navigation/BibleNavigation';
import { Menu } from 'lucide-react';

const MainLayout = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [showNav, setShowNav] = useState(false);

  // Check if viewport is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Close nav when clicking outside on mobile
  useEffect(() => {
    if (!isMobile) return;
    
    const handleClickOutside = () => setShowNav(false);
    document.addEventListener('click', handleClickOutside);
    
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobile]);

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Mobile menu button */}
      {isMobile && (
        <div className="fixed top-4 left-4 z-50">
          <button 
            className="p-2 bg-gray-800 rounded-full text-white"
            onClick={(e) => {
              e.stopPropagation();
              setShowNav(!showNav);
            }}
          >
            <Menu size={24} />
          </button>
        </div>
      )}

      {/* Sidebar - fixed on desktop, slide-in on mobile */}
      <div 
        className={`sidebar ${
          isMobile 
            ? `fixed left-0 top-0 h-full transform z-40 transition-transform duration-300 ${showNav ? 'translate-x-0' : '-translate-x-full'}`
            : 'fixed left-0 top-0 h-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <Sidebar />
      </div>

      {/* Main Content with responsive layout */}
      <div className="main-layout flex flex-1 w-full h-full" style={!isMobile ? {marginLeft: '4rem'} : {}}>
        {/* Bible Navigation - fixed on desktop, conditionally shown on mobile */}
        <div 
          className={`bible-navigation ${
            isMobile
              ? `fixed left-16 top-0 h-full transform z-30 transition-transform duration-300 ${showNav ? 'translate-x-0' : '-translate-x-full'}`
              : 'h-full flex-shrink-0 overflow-y-auto'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <BibleNavigation />
        </div>
        
        {/* Content Area with responsive layout */}
        <main className="content-area p-4 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
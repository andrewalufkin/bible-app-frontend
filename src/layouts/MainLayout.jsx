// src/layouts/MainLayout.jsx
import React from 'react';
import Sidebar from '../components/navigation/Sidebar';
import BibleNavigation from '../components/navigation/BibleNavigation';

const MainLayout = ({ children }) => {
  return (
    <div className="h-screen flex">
      {/* Fixed Sidebar Navigation */}
      <div className="fixed left-0 top-0 h-full">
        <Sidebar />
      </div>

      {/* Main Content with Left Padding for Sidebar */}
      <div className="flex ml-16">
        {/* Bible Navigation */}
        <BibleNavigation />
        
        {/* Content Area with Left Padding for Navigation */}
        <main className="flex-1 pl-72 pt-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
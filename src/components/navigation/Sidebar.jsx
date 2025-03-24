// src/components/navigation/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Book, Search, Users, BookOpen, Settings } from 'lucide-react';

const NavItem = ({ icon: Icon, path, isActive, label, showLabels }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className={`p-2 rounded cursor-pointer transition-colors flex items-center ${
        isActive ? 'bg-gray-800' : 'hover:bg-gray-800'
      }`}
      onClick={() => navigate(path)}
    >
      <Icon size={24} />
      {showLabels && (
        <span className="ml-3 text-sm">{label}</span>
      )}
    </div>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  const navItems = [
    { icon: BookOpen, path: '/', label: 'Bible' },
    { icon: Search, path: '/search', label: 'Search' },
    { icon: Users, path: '/friends', label: 'Friends' },
    { icon: Book, path: '/notes', label: 'Notes' },
    { icon: Settings, path: '/settings', label: 'Settings' }
  ];

  return (
    <nav className={`${isMobile ? 'w-screen bg-white border-b py-6' : 'w-16'} bg-gray-900 text-white h-screen flex flex-col items-center py-4`}>
      <div className={`${isMobile ? 'flex justify-around w-full' : 'space-y-8'}`}>
        {navItems.slice(0, isMobile ? navItems.length : -1).map((item) => (
          <NavItem 
            key={item.path}
            icon={item.icon}
            path={item.path}
            label={item.label}
            showLabels={isMobile}
            isActive={location.pathname === item.path}
          />
        ))}
      </div>
      {/* Settings at the bottom for desktop only */}
      {!isMobile && (
        <div className="mt-auto">
          <NavItem 
            icon={Settings}
            path="/settings"
            isActive={location.pathname === '/settings'}
            label="Settings"
            showLabels={false}
          />
        </div>
      )}
    </nav>
  );
};

export default Sidebar;
// src/components/navigation/Sidebar.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Book, Search, Users, BookOpen, Settings } from 'lucide-react';

const NavItem = ({ icon: Icon, path, isActive }) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className={`p-2 rounded cursor-pointer transition-colors ${
        isActive ? 'bg-gray-800' : 'hover:bg-gray-800'
      }`}
      onClick={() => navigate(path)}
    >
      <Icon size={24} />
    </div>
  );
};

const Sidebar = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: BookOpen, path: '/', label: 'Bible' },
    { icon: Search, path: '/search', label: 'Search' },
    { icon: Users, path: '/friends', label: 'Friends' },
    { icon: Book, path: '/notes', label: 'Notes' },
    { icon: Settings, path: '/settings', label: 'Settings' }
  ];

  return (
    <nav className="w-16 bg-gray-900 text-white h-screen flex flex-col items-center py-4">
      <div className="space-y-8">
        {navItems.slice(0, -1).map((item) => (
          <NavItem 
            key={item.path}
            icon={item.icon}
            path={item.path}
            isActive={location.pathname === item.path}
          />
        ))}
      </div>
      {/* Settings at the bottom */}
      <div className="mt-auto">
        <NavItem 
          icon={Settings}
          path="/settings"
          isActive={location.pathname === '/settings'}
        />
      </div>
    </nav>
  );
};

export default Sidebar;
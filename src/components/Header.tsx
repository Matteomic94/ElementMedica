import React from 'react';
import { Menu, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import Notifications from './shared/Notifications';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-30">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 -mb-px">
          {/* Header: Left side */}
          <div className="flex">
            {/* Hamburger button */}
            <button
              className="text-gray-500 hover:text-gray-600 lg:hidden"
              aria-controls="sidebar"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <span className="sr-only">Open sidebar</span>
              <Menu className="w-6 h-6 fill-current" />
            </button>
          </div>

          {/* Header: Right side */}
          <div className="flex items-center space-x-3">
            {/* Sistema di notifiche */}
            <Notifications />
            
            <button className="p-2 text-gray-500 hover:text-gray-600">
              <span className="sr-only">Notifications</span>
              <Bell className="w-5 h-5" />
            </button>
            {/* User button */}
            <Link
              to="#"
              className="flex items-center justify-center bg-blue-100 rounded-full w-8 h-8"
            >
              <span className="text-xs font-medium text-blue-600">JD</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
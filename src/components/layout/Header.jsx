import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Briefcase, Bell, User, LogOut, Settings, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    logout();
    setIsProfileOpen(false);
  };


  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div>
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="relative">
                <Briefcase className="h-8 w-8 text-blue-600 group-hover:text-blue-700 transition-colors" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                JobHub
              </span>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex space-x-8">
            {isAuthenticated ? (
              <>
                <NavLink to="/dashboard" isActive={isActiveRoute('/dashboard')}>
                  Dashboard
                </NavLink>
                <NavLink to="/jobs" isActive={isActiveRoute('/jobs')}>
                  Find Jobs
                </NavLink>
                {user?.role === 'student' && (
                  <NavLink to="/applications" isActive={isActiveRoute('/applications')}>
                    Applications
                  </NavLink>
                )}
                {user?.role === 'recruiter' && (
                  <>
                    <NavLink to="/recruiter" isActive={isActiveRoute('/recruiter')}>
                      Manage Jobs
                    </NavLink>
                    <NavLink to="/post-job" isActive={isActiveRoute('/post-job')}>
                      Post Job
                    </NavLink>
                  </>
                )}
                {user?.role === 'admin' && (
                  <NavLink to="/admin" isActive={isActiveRoute('/admin')}>
                    Admin Panel
                  </NavLink>
                )}
                <NavLink to="/messages" isActive={isActiveRoute('/messages')}>
                  Messages
                </NavLink>
              </>
            ) : (
              <NavLink to="/jobs" isActive={isActiveRoute('/jobs')}>
                Find Jobs
              </NavLink>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 text-gray-700 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                  >
                    <Bell className="h-6 w-6" />
                  </button>

                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Notifications</h3>
                      <p className="text-gray-500 text-center py-4">No notifications</p>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-2 rounded-full hover:bg-blue-50 transition-colors"
                  >
                    {user?.profile?.profilePicture ? (
                      <img
                        src={`/api/files/${user.profile.profilePicture.fileId}`}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden md:block text-sm font-medium text-gray-700">
                      {user?.name}
                    </span>
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
                      <div className="px-3 py-2 border-b border-gray-200">
                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                      </div>
                      <div className="py-1">
                        <ProfileMenuItem to="/profile" icon={User}>
                          Profile
                        </ProfileMenuItem>
                        <ProfileMenuItem to="/messages" icon={MessageSquare}>
                          Messages
                        </ProfileMenuItem>
                        <ProfileMenuItem to="/settings" icon={Settings}>
                          Settings
                        </ProfileMenuItem>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden backdrop-blur-xl bg-white/90 border-t border-white/20">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {isAuthenticated ? (
              <>
                <MobileNavLink to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  Dashboard
                </MobileNavLink>
                <MobileNavLink to="/jobs" onClick={() => setIsMenuOpen(false)}>
                  Find Jobs
                </MobileNavLink>
                {user?.role === 'student' && (
                  <MobileNavLink to="/applications" onClick={() => setIsMenuOpen(false)}>
                    Applications
                  </MobileNavLink>
                )}
                {user?.role === 'recruiter' && (
                  <>
                    <MobileNavLink to="/recruiter" onClick={() => setIsMenuOpen(false)}>
                      Manage Jobs
                    </MobileNavLink>
                    <MobileNavLink to="/post-job" onClick={() => setIsMenuOpen(false)}>
                      Post Job
                    </MobileNavLink>
                  </>
                )}
                <MobileNavLink to="/messages" onClick={() => setIsMenuOpen(false)}>
                  Messages
                </MobileNavLink>
                <MobileNavLink to="/profile" onClick={() => setIsMenuOpen(false)}>
                  Profile
                </MobileNavLink>
              </>
            ) : (
              <>
                <MobileNavLink to="/jobs" onClick={() => setIsMenuOpen(false)}>
                  Find Jobs
                </MobileNavLink>
                <MobileNavLink to="/login" onClick={() => setIsMenuOpen(false)}>
                  Login
                </MobileNavLink>
                <MobileNavLink to="/register" onClick={() => setIsMenuOpen(false)}>
                  Sign Up
                </MobileNavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

const NavLink = ({ to, children, isActive }) => (
  <Link
    to={to}
    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'text-blue-600 bg-blue-50 shadow-sm'
        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
    }`}
  >
    {children}
  </Link>
);

const MobileNavLink = ({ to, children, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
  >
    {children}
  </Link>
);

const ProfileMenuItem = ({ to, icon: Icon, children }) => (
  <Link
    to={to}
    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors"
  >
    <Icon className="h-4 w-4 mr-2" />
    {children}
  </Link>
);

export default Header;
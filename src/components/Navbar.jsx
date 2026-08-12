import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { 
  Sparkles, 
  Code2, 
  Video, 
  BarChart3, 
  Building2, 
  LayoutDashboard, 
  BookOpen, 
  Menu, 
  X, 
  UserCheck, 
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Leaf,
  FileText,
  Brain,
  Layers,
  School
} from 'lucide-react';

import Logo from './Logo';

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const isMentor = userProfile?.role === 'mentor';

  // Scroll listener for sticky header background opacity & depth transition
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu & profile dropdown on location change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location]);

  const mentorNavLinks = [
    { path: '/mentor-dashboard', label: 'Mentor Dashboard', icon: School },
    { path: '/recommendations', label: 'Courses', icon: BookOpen },
  ];

  const studentNavLinks = [
    { path: '/select-field', label: 'Tracks', icon: Layers },
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/companies', label: 'Companies', icon: Building2 },
    { path: '/resume', label: 'Resume Analyzer', icon: FileText },
    { path: '/round/aptitude', label: 'Aptitude', icon: Brain },
    { path: '/round/dsa', label: 'Tech Round', icon: Code2 },
    { path: '/round/interview', label: 'Mock Interview', icon: Video },
    { path: '/results', label: 'Results', icon: BarChart3 },
    { path: '/recommendations', label: 'Courses', icon: BookOpen },
  ];

  const navLinks = isMentor ? mentorNavLinks : studentNavLinks;

  return (
    <>
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 ease-out ${
          scrolled
            ? 'bg-peach-50/92 backdrop-blur-xl border-b border-rust-500/20 shadow-warm-md py-2.5 sm:py-3'
            : 'bg-peach-50/85 backdrop-blur-md border-b border-warmborder/80 shadow-warm-sm py-3.5 sm:py-4.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <Logo size="md" />

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1.5 bg-white/75 backdrop-blur-md p-1.5 rounded-full border border-warmborder/90 shadow-inner">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    className={({ isActive }) =>
                      `relative group flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-rust-500 text-white shadow-glow-rust font-bold scale-[1.02]'
                          : 'text-warmtext-700 hover:text-rust-600 hover:bg-rust-50/80'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-dustyrose-500 group-hover:text-rust-500'}`} />
                        <span>{link.label}</span>

                        {/* Hover Underline Micro-animation for inactive links */}
                        {!isActive && (
                          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-rust-500/80 rounded-full transition-all duration-250 ease-out group-hover:w-2/3" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* User Profile / Auth Action */}
            <div className="hidden sm:flex items-center gap-3">
              {currentUser || userProfile ? (
                <div className="flex items-center gap-2.5">
                  
                  {/* Interactive Profile Pill trigger */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-rust-50/70 border border-warmborder hover:border-rust-500/40 shadow-warm-sm hover:shadow-warm-md transition-all duration-200 cursor-pointer group"
                      title="View Profile Menu"
                    >
                      <div className="w-7 h-7 rounded-full bg-rust-500 text-white flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-105 transition-transform duration-200">
                        {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold text-warmtext-900 leading-tight font-serif group-hover:text-rust-600 transition-colors">
                          {userProfile?.name || 'Candidate User'}
                        </span>
                        <span className="text-[10px] text-dustyrose-500 font-medium">
                          {userProfile?.targetField || 'Software Dev'}
                        </span>
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-warmtext-500 group-hover:text-rust-500 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Interactive Profile Dropdown Menu */}
                    {profileDropdownOpen && (
                      <div 
                        className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 backdrop-blur-xl border border-warmborder shadow-warm-lg p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        <div className="px-3 py-2 border-b border-warmborder/60">
                          <p className="text-xs font-bold text-warmtext-900 font-serif">{userProfile?.name || 'Candidate'}</p>
                          <p className="text-[10px] text-warmtext-500 truncate">{userProfile?.email || 'candidate@placeprep.ai'}</p>
                        </div>

                        <Link
                          to="/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-warmtext-700 hover:bg-rust-50 hover:text-rust-600 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-rust-500" />
                          <span>Candidate Dashboard</span>
                        </Link>

                        <Link
                          to="/resume"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-warmtext-700 hover:bg-rust-50 hover:text-rust-600 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-dustyrose-500" />
                          <span>Resume Analyzer</span>
                        </Link>

                        <button
                          onClick={() => { logout(); setProfileDropdownOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Logout Button */}
                  <button
                    onClick={() => logout()}
                    className="p-2.5 rounded-full bg-white hover:bg-rust-50 text-warmtext-500 hover:text-rust-600 border border-warmborder hover:border-rust-500/30 transition-all duration-200 shadow-warm-sm hover:shadow-warm-md hover:scale-105 active:scale-95 group"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>

                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold rounded-full bg-rust-500 hover:bg-rust-600 text-white shadow-glow-rust hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex lg:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-full text-warmtext-900 hover:bg-dustyrose-100/80 border border-warmborder shadow-warm-sm hover:border-rust-500/40 transition-all duration-200"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6 text-rust-500" /> : <Menu className="w-6 h-6 text-warmtext-700" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-peach-50/95 backdrop-blur-2xl border-b border-warmborder px-4 pt-3 pb-6 space-y-2 shadow-warm-lg animate-in slide-in-from-top duration-200">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-rust-500 text-white font-extrabold shadow-glow-rust'
                        : 'text-warmtext-900 hover:bg-dustyrose-100 hover:text-rust-600'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
            <div className="pt-2 border-t border-warmborder/60">
              {currentUser || userProfile ? (
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-white hover:bg-rust-50 text-rust-600 text-sm font-semibold border border-warmborder shadow-warm-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out ({userProfile?.name || 'User'})</span>
                </button>
              ) : (
                <button
                  onClick={() => { setAuthModalOpen(true); setMobileMenuOpen(false); }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-rust-500 text-white text-sm font-extrabold shadow-glow-rust hover:bg-rust-600 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In / Register</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal Portal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
}

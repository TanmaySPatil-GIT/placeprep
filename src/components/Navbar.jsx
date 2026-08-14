import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import { 
  Home,
  Brain, 
  Code2, 
  Video, 
  FileText, 
  Building2, 
  BarChart3, 
  BookOpen, 
  LayoutDashboard, 
  Menu, 
  X, 
  ChevronDown,
  LogOut,
  User,
  School,
  Sparkles
} from 'lucide-react';

import Logo from './Logo';

export default function Navbar() {
  const { currentUser, userProfile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [prepDropdownOpen, setPrepDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const dropdownRef = useRef(null);
  const prepRef = useRef(null);
  const prepTimeoutRef = useRef(null);
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

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (prepRef.current && !prepRef.current.contains(event.target)) {
        setPrepDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu & dropdowns on location change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    setPrepDropdownOpen(false);
  }, [location]);

  const handlePrepMouseEnter = () => {
    if (prepTimeoutRef.current) clearTimeout(prepTimeoutRef.current);
    setPrepDropdownOpen(true);
  };

  const handlePrepMouseLeave = () => {
    prepTimeoutRef.current = setTimeout(() => {
      setPrepDropdownOpen(false);
    }, 180);
  };

  const prepDropdownItems = [
    { path: '/round/aptitude', label: 'Aptitude', sub: 'Quant & Logic Practice', icon: Brain },
    { path: '/round/dsa', label: 'Tech Round', sub: 'DSA Coding Challenges', icon: Code2 },
    { path: '/round/interview', label: 'Mock Interview', sub: 'Voice AI Simulation', icon: Video },
    { path: '/resume', label: 'Resume Analyzer', sub: 'ATS Keyword Audit', icon: FileText },
  ];

  const prepPaths = prepDropdownItems.map(item => item.path);
  const isPrepActive = prepPaths.includes(location.pathname);

  const mentorNavLinks = [
    { path: '/mentor-dashboard', label: 'Mentor Dashboard', icon: School },
    { path: '/recommendations', label: 'Courses', icon: BookOpen },
  ];

  return (
    <>
      <header 
        className={`sticky top-0 z-50 transition-all duration-300 ease-out animate-fade-down ${
          scrolled
            ? 'bg-peach-50/92 backdrop-blur-xl border-b border-rust-500/20 shadow-warm-md py-2.5 sm:py-3'
            : 'bg-peach-50/85 backdrop-blur-md border-b border-warmborder/80 shadow-warm-sm py-3.5 sm:py-4.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <Logo size="md" />

            {/* Desktop Navigation Links (Simplified to 5 top-level items) */}
            <nav className="hidden lg:flex items-center gap-1.5 bg-white/80 backdrop-blur-md p-1.5 rounded-full border border-warmborder/90 shadow-inner">
              
              {isMentor ? (
                mentorNavLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.path}
                      to={link.path}
                      className={({ isActive }) =>
                        `relative group flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                          isActive
                            ? 'bg-rust-500 text-white shadow-glow-rust font-bold scale-[1.02]'
                            : 'text-warmtext-700 hover:text-rust-600 hover:bg-rust-50/80'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-dustyrose-500 group-hover:text-rust-500'}`} />
                          <span>{link.label}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })
              ) : (
                <>
                  {/* 1. Home */}
                  <NavLink
                    to="/"
                    end
                    className={({ isActive }) =>
                      `relative group flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-rust-500 text-white shadow-glow-rust font-bold scale-[1.02]'
                          : 'text-warmtext-700 hover:text-rust-600 hover:bg-rust-50/80'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Home className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-dustyrose-500 group-hover:text-rust-500'}`} />
                        <span>Home</span>
                      </>
                    )}
                  </NavLink>

                  {/* 2. Preparation (Hover / Click Dropdown) */}
                  <div 
                    className="relative"
                    ref={prepRef}
                    onMouseEnter={handlePrepMouseEnter}
                    onMouseLeave={handlePrepMouseLeave}
                  >
                    <button
                      onClick={() => setPrepDropdownOpen(!prepDropdownOpen)}
                      className={`relative group flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer ${
                        isPrepActive
                          ? 'bg-rust-500 text-white shadow-glow-rust font-bold scale-[1.02]'
                          : 'text-warmtext-700 hover:text-rust-600 hover:bg-rust-50/80'
                      }`}
                    >
                      <Brain className={`w-3.5 h-3.5 ${isPrepActive ? 'text-white' : 'text-dustyrose-500 group-hover:text-rust-500'}`} />
                      <span>Preparation</span>
                      <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${prepDropdownOpen ? 'rotate-180' : ''} ${isPrepActive ? 'text-white' : 'text-warmtext-500'}`} />
                    </button>

                    {/* Dropdown Menu Panel */}
                    {prepDropdownOpen && (
                      <div 
                        className="absolute left-0 mt-2 w-64 rounded-2xl bg-white/95 backdrop-blur-xl border border-warmborder shadow-warm-lg p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                      >
                        <div className="px-3 py-1.5 border-b border-warmborder/60">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-dustyrose-600 font-mono">Interactive Modules</span>
                        </div>

                        {prepDropdownItems.map((item) => {
                          const Icon = item.icon;
                          const isActive = location.pathname === item.path;
                          return (
                            <Link
                              key={item.path}
                              to={item.path}
                              onClick={() => setPrepDropdownOpen(false)}
                              className={`flex items-start gap-3 px-3 py-2.5 rounded-xl transition-all ${
                                isActive 
                                  ? 'bg-rust-500 text-white font-bold' 
                                  : 'hover:bg-rust-50/80 text-warmtext-900'
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                isActive ? 'bg-white/20 text-white' : 'bg-rust-100 text-rust-500 border border-warmborder'
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className={`text-xs font-bold font-heading ${isActive ? 'text-white' : 'text-warmtext-900'}`}>
                                  {item.label}
                                </div>
                                <div className={`text-[10px] truncate ${isActive ? 'text-white/80' : 'text-warmtext-500'}`}>
                                  {item.sub}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 3. Companies */}
                  <NavLink
                    to="/companies"
                    className={({ isActive }) =>
                      `relative group flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-rust-500 text-white shadow-glow-rust font-bold scale-[1.02]'
                          : 'text-warmtext-700 hover:text-rust-600 hover:bg-rust-50/80'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Building2 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-dustyrose-500 group-hover:text-rust-500'}`} />
                        <span>Companies</span>
                      </>
                    )}
                  </NavLink>

                  {/* 4. Results */}
                  <NavLink
                    to="/results"
                    className={({ isActive }) =>
                      `relative group flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-rust-500 text-white shadow-glow-rust font-bold scale-[1.02]'
                          : 'text-warmtext-700 hover:text-rust-600 hover:bg-rust-50/80'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <BarChart3 className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-dustyrose-500 group-hover:text-rust-500'}`} />
                        <span>Results</span>
                      </>
                    )}
                  </NavLink>

                  {/* 5. Courses */}
                  <NavLink
                    to="/recommendations"
                    className={({ isActive }) =>
                      `relative group flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-rust-500 text-white shadow-glow-rust font-bold scale-[1.02]'
                          : 'text-warmtext-700 hover:text-rust-600 hover:bg-rust-50/80'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <BookOpen className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-dustyrose-500 group-hover:text-rust-500'}`} />
                        <span>Courses</span>
                      </>
                    )}
                  </NavLink>
                </>
              )}

            </nav>

            {/* User Profile / Candidate Dashboard Action */}
            <div className="hidden sm:flex items-center gap-3">
              {currentUser || userProfile ? (
                <div className="flex items-center gap-2.5">
                  
                  {/* Dashboard Quick Access Link */}
                  <Link
                    to="/dashboard"
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                      location.pathname === '/dashboard'
                        ? 'bg-rust-500 text-white shadow-glow-rust font-bold'
                        : 'bg-white hover:bg-rust-50 text-warmtext-900 border border-warmborder hover:border-rust-500/40 shadow-warm-sm'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-rust-500" />
                    <span>Dashboard</span>
                  </Link>

                  {/* Profile Dropdown Menu */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white hover:bg-rust-50/70 border border-warmborder hover:border-rust-500/40 shadow-warm-sm hover:shadow-warm-md transition-all duration-200 cursor-pointer group"
                      title="View Profile Menu"
                    >
                      <div className="w-7 h-7 rounded-full bg-rust-500 text-white flex items-center justify-center font-bold text-xs shadow-sm group-hover:scale-105 transition-transform duration-200">
                        {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <ChevronDown className={`w-3.5 h-3.5 text-warmtext-500 group-hover:text-rust-500 transition-transform duration-200 ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Interactive Profile Dropdown */}
                    {profileDropdownOpen && (
                      <div 
                        className="absolute right-0 mt-2 w-56 rounded-2xl bg-white/95 backdrop-blur-xl border border-warmborder shadow-warm-lg p-2 space-y-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                      >
                        <div className="px-3 py-2 border-b border-warmborder/60">
                          <p className="text-xs font-bold text-warmtext-900 font-heading">{userProfile?.name || 'Candidate'}</p>
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
                          to="/select-field"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-warmtext-700 hover:bg-rust-50 hover:text-rust-600 transition-colors"
                        >
                          <Sparkles className="w-4 h-4 text-dustyrose-500" />
                          <span>Career Tracks</span>
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
            <NavLink
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                  isActive ? 'bg-rust-500 text-white font-extrabold shadow-glow-rust' : 'text-warmtext-900 hover:bg-dustyrose-100'
                }`
              }
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                  isActive ? 'bg-rust-500 text-white font-extrabold shadow-glow-rust' : 'text-warmtext-900 hover:bg-dustyrose-100'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Candidate Dashboard</span>
            </NavLink>

            {/* Preparation Mobile Sub-Items */}
            <div className="space-y-1 pl-2 pt-1 border-l-2 border-warmborder">
              <div className="px-3 text-[10px] font-extrabold uppercase text-dustyrose-600 font-mono">Preparation Modules</div>
              {prepDropdownItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isActive ? 'bg-rust-500 text-white font-bold' : 'text-warmtext-700 hover:bg-rust-50'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 text-dustyrose-500" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>

            <NavLink
              to="/companies"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                  isActive ? 'bg-rust-500 text-white font-extrabold shadow-glow-rust' : 'text-warmtext-900 hover:bg-dustyrose-100'
                }`
              }
            >
              <Building2 className="w-4 h-4" />
              <span>Companies & Tracks</span>
            </NavLink>

            <NavLink
              to="/results"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                  isActive ? 'bg-rust-500 text-white font-extrabold shadow-glow-rust' : 'text-warmtext-900 hover:bg-dustyrose-100'
                }`
              }
            >
              <BarChart3 className="w-4 h-4" />
              <span>Results & Scores</span>
            </NavLink>

            <NavLink
              to="/recommendations"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-full text-sm font-semibold transition-colors ${
                  isActive ? 'bg-rust-500 text-white font-extrabold shadow-glow-rust' : 'text-warmtext-900 hover:bg-dustyrose-100'
                }`
              }
            >
              <BookOpen className="w-4 h-4" />
              <span>Courses</span>
            </NavLink>

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

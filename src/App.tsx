import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Camera, MessageSquare, BookOpen, MapPin, 
  ShieldCheck, Info, LogOut, Sun, Moon, Menu, X, ArrowRight, Sparkles,
  BarChart4
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Pages
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Scanner from './pages/Scanner.tsx';
import Chat from './pages/Chat.tsx';
import LearningCenter from './pages/LearningCenter.tsx';
import NearCenters from './pages/NearCenters.tsx';
import ResponsibleAI from './pages/ResponsibleAI.tsx';
import AdminPanel from './pages/AdminPanel.tsx';
import AnalyticsDashboard from './pages/AnalyticsDashboard.tsx';

// Services
import { authService } from './services/api.js';

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(true); // Default to dark for premium SaaS feel
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);

  // Load token on initiation
  useEffect(() => {
    const savedToken = localStorage.getItem('authToken');
    if (savedToken) {
      setToken(savedToken);
      // Fetch authenticated user profile data
      authService.getMe()
        .then(data => {
          setUser(data.user);
        })
        .catch(() => {
          // Token expired, clear storage
          handleLogout();
        })
        .finally(() => {
          setAuthChecked(true);
        });
    } else {
      setAuthChecked(true);
    }
  }, []);

  // Handle successful login
  const handleLoginSuccess = (newToken: string, loggedUser: any) => {
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
    setUser(loggedUser);
    setActiveTab('dashboard');
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
    setUserDropdownOpen(false);
    setActiveTab('dashboard');
  };

  // Toggle theme modes
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Handle sidebar tabs click
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-natural-dark-bg">
        <div className="w-10 h-10 border-4 border-natural-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If unauthenticated, render the visual login layouts
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} darkMode={darkMode} />;
  }

  // Nav sidebars configurations
  const NAVIGATION_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4.5 h-4.5" /> },
    { id: 'scanner', label: 'AI Waste Scanner', icon: <Camera className="w-4.5 h-4.5" /> },
    { id: 'chat', label: 'AI Chat Assistant', icon: <MessageSquare className="w-4.5 h-4.5" /> },
    { id: 'analytics', label: 'Analytics Dashboard', icon: <BarChart4 className="w-4.5 h-4.5" /> },
    { id: 'learning', label: 'Waste Learning Center', icon: <BookOpen className="w-4.5 h-4.5" /> },
    { id: 'maps', label: 'Recycling Centers', icon: <MapPin className="w-4.5 h-4.5" /> },
    { id: 'responsible-ai', label: 'Responsible AI', icon: <Info className="w-4.5 h-4.5" /> },
  ];

  // Expose admin tab if role corresponds
  if (user && user.role === 'admin') {
    NAVIGATION_ITEMS.push({ id: 'admin', label: 'Admin Panel', icon: <ShieldCheck className="w-4.5 h-4.5" /> });
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${
      darkMode ? 'bg-natural-dark-bg text-natural-dark-text' : 'bg-natural-cream text-natural-dark'
    }`}>
      
      {/* 1. COMPACT TOP LEVEL NAVBAR */}
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md px-4 sm:px-6 lg:px-8 py-3.5 transition ${
        darkMode ? 'bg-natural-dark-bg/85 border-natural-dark-border' : 'bg-white/85 border-natural-border shadow-xs'
      }`}>
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          
          {/* Logo Branding, Clicking resets to Dashboard */}
          <div 
            onClick={() => handleTabClick('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer select-none group"
          >
            <div className="p-2 bg-natural-primary/10 text-natural-primary rounded-xl transition group-hover:scale-105 active:scale-95">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight leading-none uppercase text-natural-primary">EcoSmart AI</h1>
              <p className="text-[9px] font-bold text-natural-secondary mt-1 uppercase tracking-widest leading-none">SDG 12 Segregator</p>
            </div>
          </div>
          
          {/* Right Header Navigation tools */}
          <div className="flex items-center space-x-3 relative">
            
            {/* Dark Mode toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2.5 rounded-xl transition cursor-pointer hover:scale-105 active:scale-95 border ${
                darkMode ? 'bg-natural-dark-card border-natural-dark-border text-natural-accent hover:text-white' : 'bg-natural-sand border-natural-border text-natural-muted hover:text-natural-dark'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4 text-natural-accent" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Dropdown */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className={`flex items-center space-x-2 p-1.5 rounded-xl border transition cursor-pointer hover:border-natural-secondary ${
                    darkMode ? 'bg-natural-dark-card border-natural-dark-border' : 'bg-natural-sand border-natural-border'
                  }`}
                >
                  <div className="w-7 h-7 rounded-lg overflow-hidden bg-natural-primary/15 text-natural-primary font-extrabold text-xs flex items-center justify-center shrink-0">
                    {user.profile_image ? (
                      <img src={user.profile_image} alt={user.name} className="w-full h-full object-cover" />
                    ) : user.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xxs font-extrabold pr-1 hidden sm:block truncate max-w-24">{user.name}</span>
                </button>

                {/* Dropdown Menu Overlay */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className={`absolute right-0 mt-2 w-52 p-2 rounded-xl border shadow-2xl relative z-50 text-xs ${
                        darkMode ? 'bg-natural-dark-card border-natural-dark-border text-natural-dark-text' : 'bg-white border-natural-border text-natural-dark'
                      }`}
                    >
                      <div className="p-3.5 border-b border-natural-border/35 dark:border-natural-dark-border mb-1.5">
                        <p className="font-extrabold text-natural-primary text-[11px] truncate">{user.name}</p>
                        <p className="text-xxs text-natural-muted truncate mt-0.5">{user.email}</p>
                        <span className="inline-block mt-2 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-natural-primary/10 text-natural-primary leading-none">
                          {user.role} workspace
                        </span>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full text-left p-2.5 rounded-lg hover:bg-rose-500/15 hover:text-rose-500 transition duration-150 flex items-center space-x-2 shrink-0 cursor-pointer"
                      >
                        <LogOut className="w-4.5 h-4.5 text-rose-500 shrink-0" />
                        <span className="font-semibold text-xxs">Terminate Session</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile menu Toggle buttons */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`p-2.5 rounded-xl transition md:hidden cursor-pointer border ${
                darkMode ? 'bg-natural-dark-card border-natural-dark-border text-natural-dark-text' : 'bg-natural-sand border-natural-border text-natural-muted'
              }`}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

          </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT SHELL WITH SIDEBAR DOCK */}
      <div className="flex-1 flex flex-col md:flex-row max-w-8xl w-full mx-auto">
        
        {/* DESKTOP PERMANENT SIDEBAR */}
        <nav className={`w-64 border-r p-5 space-y-2.5 hidden md:block transition shrink-0 ${
          darkMode ? 'bg-natural-dark-card/25 border-natural-dark-border' : 'bg-natural-sand/65 border-natural-border'
        }`}>
          <div className="text-[10px] font-bold text-natural-muted uppercase tracking-widest pl-3 mb-4 select-none">Navigation Dock</div>
          
          <div className="space-y-1">
            {NAVIGATION_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full p-3 font-semibold text-xs rounded-xl flex items-center space-x-3 transition cursor-pointer shrink-0 ${
                    active 
                      ? 'bg-natural-primary text-white shadow-lg shadow-natural-primary/15 font-bold' 
                      : darkMode 
                        ? 'text-natural-dark-muted hover:text-white hover:bg-natural-dark-card/60' 
                        : 'text-natural-muted hover:text-natural-dark hover:bg-natural-sage-light/30'
                  }`}
                >
                  <span className={active ? 'text-white' : 'text-natural-secondary'}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-24 select-none">
            <div className={`p-4 rounded-xl border text-[10px] leading-relaxed ${darkMode ? 'bg-natural-dark-card/45 border-natural-dark-border text-natural-dark-muted' : 'bg-natural-sand border-natural-border text-natural-muted'}`}>
              <p className="font-bold text-natural-primary mb-1">SDG 12 compliance</p>
              <p>Carbon segregator models actively prevent landfill accumulations.</p>
            </div>
          </div>
        </nav>

        {/* MOBILE OVERLAY DRAWER NAV MENU */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.2 }}
              className={`fixed inset-y-0 left-0 w-64 p-6 shadow-2xl z-50 md:hidden flex flex-col transition border-r ${
                darkMode ? 'bg-natural-dark-bg border-natural-dark-border text-white' : 'bg-natural-cream border-natural-border text-natural-dark'
              }`}
            >
              <div className="flex items-center justify-between mb-8 border-b border-natural-border/20 pb-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-natural-primary" />
                  <span className="font-extrabold text-xs uppercase tracking-wider">Eco Navigation</span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="space-y-1.5 flex-1">
                {NAVIGATION_ITEMS.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full p-3 font-semibold text-xs rounded-xl flex items-center space-x-3 transition cursor-pointer shrink-0 ${
                        active 
                          ? 'bg-natural-primary text-white font-bold' 
                          : darkMode 
                            ? 'text-natural-dark-muted hover:text-white' 
                            : 'text-natural-muted hover:text-natural-dark'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-[10px] text-natural-muted font-mono">ECOSMART AI &bull; SDG 12 PROTOTYPE</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3. WORKING VIEWPORT - RENDERS CORRESPONDING PAGES */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && <Dashboard user={user} darkMode={darkMode} onNavigate={handleTabClick} />}
              {activeTab === 'scanner' && <Scanner darkMode={darkMode} onNavigate={handleTabClick} />}
              {activeTab === 'chat' && <Chat darkMode={darkMode} />}
              {activeTab === 'analytics' && <AnalyticsDashboard user={user} darkMode={darkMode} onNavigate={handleTabClick} />}
              {activeTab === 'learning' && <LearningCenter darkMode={darkMode} />}
              {activeTab === 'maps' && <NearCenters darkMode={darkMode} />}
              {activeTab === 'responsible-ai' && <ResponsibleAI darkMode={darkMode} />}
              {activeTab === 'admin' && <AdminPanel user={user} darkMode={darkMode} />}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

    </div>
  );
}


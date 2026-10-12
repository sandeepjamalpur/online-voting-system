import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { AppView, ElectionSettings } from '../types';
import { VoteEaseLogo } from './VoteEaseLogo';

interface NavbarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  settings: ElectionSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  settings,
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Hysteresis threshold to prevent flickering
      const scrollY = window.scrollY;
      if (scrollY > 40) {
        setIsScrolled(true);
      } else if (scrollY < 10) {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 select-none bg-white/95 backdrop-blur-md border-b transition-shadow duration-200 ${
        isScrolled
          ? 'shadow-sm border-slate-200'
          : 'shadow-xs border-slate-200/70'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo Brand: VoteEase with Official Ballot Leaf Emblem */}
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 focus:outline-hidden group cursor-pointer transition-transform duration-150 hover:scale-[1.02]"
            id="nav-brand-button"
            aria-label="VoteEase Home"
          >
            <VoteEaseLogo size="sm" />
          </button>

          {/* Centered Navigation Links (Home, How it Works, Voter Access, Admin) */}
          <nav
            className="hidden md:flex items-center text-sm font-medium text-slate-600 gap-8"
          >
            <button
              onClick={() => setCurrentView('home')}
              className={`transition-colors duration-150 hover:text-slate-900 cursor-pointer relative py-1 ${
                currentView === 'home'
                  ? 'text-slate-900 font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#0B3B2C] after:rounded-full'
                  : 'hover:-translate-y-0.5'
              }`}
              id="nav-home-btn"
            >
              Home
            </button>

            <button
              onClick={() => setCurrentView('how_it_works')}
              className={`transition-colors duration-150 hover:text-slate-900 cursor-pointer relative py-1 ${
                currentView === 'how_it_works'
                  ? 'text-slate-900 font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#0B3B2C] after:rounded-full'
                  : 'hover:-translate-y-0.5'
              }`}
              id="nav-how-it-works-btn"
            >
              How it Works
            </button>

            <button
              onClick={() => setCurrentView('user_roll')}
              className={`transition-colors duration-150 hover:text-slate-900 cursor-pointer relative py-1 ${
                currentView === 'user_roll' || currentView === 'voting' || currentView === 'success'
                  ? 'text-slate-900 font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#0B3B2C] after:rounded-full'
                  : 'hover:-translate-y-0.5'
              }`}
              id="nav-features-btn"
            >
              Voter Access
            </button>

            <button
              onClick={() => setCurrentView('admin')}
              className={`transition-colors duration-150 hover:text-slate-900 cursor-pointer relative py-1 ${
                currentView === 'admin'
                  ? 'text-slate-900 font-semibold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-[#0B3B2C] after:rounded-full'
                  : 'hover:-translate-y-0.5'
              }`}
              id="nav-admin-link"
            >
              Admin
            </button>
          </nav>

          {/* Right Action Button (Login / Voter Portal) */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (currentView === 'admin') {
                  setCurrentView('user_roll');
                } else {
                  setCurrentView('admin');
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0B3B2C] hover:bg-[#07291F] active:scale-95 text-white font-semibold shadow-xs hover:shadow-md px-5 py-2.5 text-xs sm:text-sm transition-all duration-200 cursor-pointer group"
              id="nav-login-signup-btn"
            >
              <span>{currentView === 'admin' ? 'Voter Portal' : 'Login / Signup'}</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

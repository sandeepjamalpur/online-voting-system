import React, { useState } from 'react';
import { VoteEaseLogo } from './VoteEaseLogo';
import { X, CheckCircle2, ShieldCheck, Sparkles, Building, Info } from 'lucide-react';

interface FooterProps {
  collegeName?: string;
  electionName?: string;
  onNavigateHome?: () => void;
  onNavigateHowItWorks?: () => void;
  onNavigateAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  collegeName = '',
  electionName = 'Student Council Elections 2026',
  onNavigateHome,
  onNavigateHowItWorks,
  onNavigateAdmin,
}) => {
  const [modalType, setModalType] = useState<'pricing' | 'about' | null>(null);

  const handleHomeClick = () => {
    if (onNavigateHome) onNavigateHome();
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFeaturesClick = () => {
    if (onNavigateHowItWorks) onNavigateHowItWorks();
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFaqsClick = () => {
    if (onNavigateHowItWorks) onNavigateHowItWorks();
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Dark Theme Footer Matching Uploaded Template */}
      <footer className="w-full bg-[#212529] text-slate-300 border-t border-[#343a40] select-none relative z-20">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-6 sm:py-7 flex flex-col md:flex-row items-center justify-between gap-5">
          {/* Left: Copyright text */}
          <div className="text-sm text-slate-400 font-normal order-2 md:order-1 text-center md:text-left">
            © {new Date().getFullYear()} VoteEase, Inc
          </div>

          {/* Center: Iconic Brand Logo Emblem matching template centered badge */}
          <div className="order-1 md:order-2 flex items-center justify-center">
            <button
              type="button"
              onClick={handleHomeClick}
              title="VoteEase - Return to Home"
              className="group p-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 hover:border-emerald-400/40 transition-all duration-200 shadow-inner cursor-pointer"
            >
              <VoteEaseLogo size="xs" showText={false} inverted />
            </button>
          </div>

          {/* Right: Navigation Links */}
          <nav className="order-3 flex flex-wrap items-center justify-center gap-6 sm:gap-7 text-sm font-medium text-slate-400">
            <button
              type="button"
              onClick={handleHomeClick}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={handleFeaturesClick}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => setModalType('pricing')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={handleFaqsClick}
              className="hover:text-white transition-colors cursor-pointer"
            >
              FAQs
            </button>
            <button
              type="button"
              onClick={() => setModalType('about')}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About
            </button>
            <a
              href="/VoteEase-Project-Documentation.pdf"
              download="VoteEase-Project-Documentation.pdf"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Documentation (PDF)
            </a>
          </nav>
        </div>
      </footer>

      {/* Pricing Modal */}
      {modalType === 'pricing' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#0B3B2C] border border-emerald-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Institutional Plan</h3>
                <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">Campus License</p>
              </div>
            </div>

            <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B3B2C]">$0</span>
                <span className="text-xs text-slate-500 font-medium">/ 100% Free for Colleges & Universities</span>
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                VoteEase is provided open & accessible for student union elections, departmental representatives, and campus governance.
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Unlimited voter roll records & bulk Excel imports</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Multi-position ballot configuration & candidate profiles</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Single-vote enforcement with unique security access codes</span>
              </li>
              <li className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>One-click certified audit trail export (.xlsx)</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => setModalType(null)}
              className="w-full py-3 rounded-full bg-[#0B3B2C] hover:bg-[#07291F] text-white font-semibold text-sm transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* About Modal */}
      {modalType === 'about' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#0B3B2C] border border-emerald-100 flex items-center justify-center">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">About VoteEase</h3>
                <p className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">{collegeName}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed my-4">
              <p>
                <strong>VoteEase</strong> is a collegiate student election platform engineered for cryptographic ballot privacy, real-time verifiable turnout, and strict single-vote integrity.
              </p>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Election:</span>
                  <span className="text-slate-800 font-medium">{electionName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Institution:</span>
                  <span className="text-slate-800 font-medium">{collegeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Security:</span>
                  <span className="text-emerald-700 font-semibold">256-bit Hash Protected</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalType(null)}
              className="w-full py-3 rounded-full bg-[#0B3B2C] hover:bg-[#07291F] text-white font-semibold text-sm transition-colors shadow-xs"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};

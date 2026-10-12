import React, { useEffect } from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, Users, FileSpreadsheet, Award } from 'lucide-react';
import { VoteEaseLogo } from './VoteEaseLogo';
import { ElectionSettings } from '../types';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ElectionSettings;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose, settings }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Dark Green Accent */}
        <div className="bg-[#0B3B2C] text-white p-6 sm:p-7 relative select-none">
          {/* Subtle curved background decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-10">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              <circle cx="150" cy="50" r="100" stroke="#FFFFFF" strokeWidth="20" fill="none" />
            </svg>
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/10 rounded-2xl border border-white/20 shadow-xs">
                <VoteEaseLogo size="sm" inverted />
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="pt-4 relative z-10">
            <h2 id="about-modal-title" className="text-2xl font-bold tracking-tight text-white">
              About VoteEase
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 leading-relaxed">
              Institutional Student Council Election & Digital Ballot System
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6 overflow-y-auto text-slate-700 text-sm">
          {/* Mission statement */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-slate-800 leading-relaxed text-xs sm:text-sm">
            <span className="font-semibold text-[#0B3B2C]">VoteEase</span> is engineered specifically for colleges and universities to conduct confidential, tamper-evident, and auditable student council elections with total transparency.
          </div>

          {/* Key Pillars */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Core Security & Integrity Pillars
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#0B3B2C] flex items-center justify-center shrink-0 shadow-2xs">
                  <Lock className="w-4 h-4 text-[#0B3B2C]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Secret Ballot</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Zero student identity attached to individual candidate choices.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#0B3B2C] flex items-center justify-center shrink-0 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-[#0B3B2C]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Single-Vote Guarantee</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Strict student roll verification blocks duplicate casting attempts.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#0B3B2C] flex items-center justify-center shrink-0 shadow-2xs">
                  <FileSpreadsheet className="w-4 h-4 text-[#0B3B2C]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Certified Excel Audit</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Real-time turnout tracking and exportable certified audit sheets.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-[#0B3B2C] flex items-center justify-center shrink-0 shadow-2xs">
                  <Award className="w-4 h-4 text-[#0B3B2C]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Instant Receipts</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Cryptographic vote reference code provided upon successful submission.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Institution Info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div>
              <span className="block text-slate-400 font-medium">Configured Institution</span>
              <span className="font-semibold text-slate-900">{settings.collegeName}</span>
            </div>
            <div className="text-right">
              <span className="block text-slate-400 font-medium">Active Election</span>
              <span className="font-semibold text-emerald-800">{settings.electionName}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span>Copyright © 2026 VoteEase. All rights reserved.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#0B3B2C] hover:bg-[#07291F] text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

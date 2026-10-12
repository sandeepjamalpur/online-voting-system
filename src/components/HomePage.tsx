import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  FileText,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { ElectionSettings } from '../types';
import { VOTER_AVATAR_DATA_URI, ADMIN_AVATAR_DATA_URI } from '../assets/avatarData';
import voterAvatarImg from '../assets/images/regenerated_image_1790775548653.png';
import adminAvatarImg from '../assets/images/regenerated_image_1790775550701.png';
import { VoteEaseLogo } from './VoteEaseLogo';

interface HomePageProps {
  onSelectUser: (securityCode?: string) => void;
  onSelectAdmin: () => void;
  onSelectHowItWorks?: () => void;
  settings: ElectionSettings;
}

export const HomePage: React.FC<HomePageProps> = ({
  onSelectUser,
  onSelectAdmin,
  onSelectHowItWorks,
  settings,
}) => {
  // Clear any legacy client-only overrides so that shared links and all devices always display the official avatars
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('voteease_voter_avatar');
        localStorage.removeItem('voteease_admin_avatar');
      } catch {
        // ignore
      }
    }
  }, []);

  // Canonical avatar resolution:
  // 1. Settings from backend (if explicitly customized)
  // 2. Bundled optimized regenerated artwork (voterAvatarImg & adminAvatarImg)
  // 3. Guaranteed inline Base64 Data URI fallback on error
  const voterAvatar = settings?.voterAvatar || voterAvatarImg;
  const adminAvatar = settings?.adminAvatar || adminAvatarImg;

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] bg-[#F8FAF9] overflow-hidden flex flex-col justify-between select-none">
      {/* Dynamic Background Curved Accents (Matching Mockup) */}
      <div className="absolute top-0 right-0 w-[55vw] h-[85vh] pointer-events-none overflow-hidden opacity-60">
        <svg
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover -translate-y-12 translate-x-24"
        >
          {/* Subtle Golden Swoosh */}
          <path
            d="M200 0 C450 150 700 350 800 700 L800 0 Z"
            fill="url(#goldGradient)"
            fillOpacity="0.12"
          />
          {/* Subtle Deep Emerald Swoosh */}
          <path
            d="M350 0 C550 200 720 450 800 600 L800 0 Z"
            fill="url(#greenGradient)"
            fillOpacity="0.08"
          />
          <defs>
            <linearGradient id="goldGradient" x1="200" y1="0" x2="800" y2="700" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F59E0B" />
              <stop offset="1" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="greenGradient" x1="350" y1="0" x2="800" y2="600" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0B3B2C" />
              <stop offset="1" stopColor="#10B981" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Content Area */}
      <main className="relative max-w-7xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-10 lg:py-16 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* LEFT COLUMN: HERO TEXT */}
          <div className="lg:col-span-5 space-y-6">
            {/* Tagline */}
            <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-slate-500 font-sans">
              STUDENT ELECTION PLATFORM
            </p>

            {/* Massive Distinctive Headline (Matching Mockup) */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 leading-[1.05]">
              Your<br />
              Voice<br />
              Matters<span className="text-[#F59E0B]">.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-md">
              A simple, secure and transparent platform for a stronger community.
            </p>

            {/* Primary Action Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onSelectUser()}
                className="inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-[#0B3B2C] hover:bg-[#07291F] text-white font-medium text-sm transition-all duration-150 shadow-md hover:shadow-lg cursor-pointer group"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 3 Core Trust Indicators Row - Modern Collegiate Architecture */}
            <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg">
              {/* Secure Voting */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0B3B2C] border border-emerald-100 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-900 leading-tight">Secret Ballot</span>
                  <span className="text-[11px] text-slate-500 leading-tight">256-bit encrypted</span>
                </div>
              </div>

              {/* Fair Elections */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0B3B2C] border border-emerald-100 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-900 leading-tight">Single Vote</span>
                  <span className="text-[11px] text-slate-500 leading-tight">Roll verification</span>
                </div>
              </div>

              {/* Transparent Process */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#0B3B2C] border border-emerald-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-900 leading-tight">Certified Audit</span>
                  <span className="text-[11px] text-slate-500 leading-tight">Export to Excel</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: DUAL 3D/ILLUSTRATED CARDS (Matching Mockup) */}
          <div className="lg:col-span-7 flex flex-col sm:flex-row gap-6 justify-center lg:justify-end items-stretch">
            
            {/* CARD 1: VOTERS (Dark Forest Green #0B3B2C) */}
            <div
              onClick={() => onSelectUser()}
              className="group flex-1 max-w-sm bg-[#0B3B2C] text-white rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between border border-emerald-700/25 hover:-translate-y-1 overflow-hidden relative"
              id="home-voter-card"
            >
              {/* Top 3D Character Illustration matching uploaded image */}
              <div className="relative w-full min-h-[240px] sm:min-h-[256px] flex items-center justify-center overflow-hidden rounded-2xl bg-[#09261B]/60 border border-emerald-500/20 shadow-inner transition-colors">
                <img
                  src={voterAvatar}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== voterAvatarImg) {
                      target.src = voterAvatarImg;
                    } else if (target.src !== VOTER_AVATAR_DATA_URI) {
                      target.src = VOTER_AVATAR_DATA_URI;
                    }
                  }}
                  alt="Student Voter with Ballot"
                  loading="eager"
                  decoding="sync"
                  className="w-full max-w-[280px] h-60 sm:h-64 object-contain drop-shadow-xl group-hover:scale-[1.02] transition-transform duration-300 block pointer-events-none select-none"
                />
              </div>

              {/* Text Info */}
              <div className="space-y-2 pt-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-emerald-300 uppercase tracking-wider text-[11px] font-semibold">Student Portal</span>
                  <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30 text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Polls Open
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Student Voter
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed font-normal">
                  Cast your confidential vote with your student roll number and election access code.
                </p>
              </div>

              {/* White Pill Button */}
              <div className="pt-5">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-white text-[#0B3B2C] font-semibold text-sm shadow-xs group-hover:bg-emerald-50 transition-colors cursor-pointer"
                >
                  <span>Enter Voting Booth</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* CARD 2: ADMIN (Off-White / Light Cream Card) */}
            <div
              onClick={onSelectAdmin}
              className="group flex-1 max-w-sm bg-white text-slate-900 rounded-3xl p-6 sm:p-7 shadow-md hover:shadow-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between border border-slate-200/90 hover:border-[#0B3B2C] hover:-translate-y-1 overflow-hidden relative"
              id="home-admin-card"
            >
              {/* Top 3D Character Illustration matching uploaded image */}
              <div className="relative w-full min-h-[240px] sm:min-h-[256px] flex items-center justify-center py-2 sm:py-3 overflow-hidden rounded-2xl bg-amber-50/40 border border-slate-200/60 transition-colors">
                <img
                  src={adminAvatar}
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== adminAvatarImg) {
                      target.src = adminAvatarImg;
                    } else if (target.src !== ADMIN_AVATAR_DATA_URI) {
                      target.src = ADMIN_AVATAR_DATA_URI;
                    }
                  }}
                  alt="Election Admin Officer with Tablet"
                  loading="eager"
                  decoding="sync"
                  className="w-full max-w-[260px] h-56 sm:h-60 object-contain rounded-2xl drop-shadow-md group-hover:scale-[1.03] transition-transform duration-300 block pointer-events-none select-none"
                />
              </div>

              {/* Text Info */}
              <div className="space-y-2 pt-3">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-slate-500 uppercase tracking-wider text-[11px] font-semibold">Governance</span>
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200 text-[11px]">
                    Official Access
                  </span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                  Election Admin
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  Manage candidates, supervise ballot rolls, track live turnout, and export certified results.
                </p>
              </div>

              {/* Dark Forest Green Pill Button */}
              <div className="pt-5">
                <button
                  type="button"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#0B3B2C] hover:bg-[#07291F] text-white font-semibold text-sm shadow-xs transition-colors cursor-pointer"
                >
                  <span>Open Admin Console</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

          </div>

        </div>
      </main>

      {/* College & Session Context Bar */}
      <footer className="relative z-10 border-t border-slate-200/60 bg-white/70 backdrop-blur-xs py-4 px-6 sm:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <VoteEaseLogo size="xs" />
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>©2026</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={onSelectHowItWorks}
              className="text-slate-600 hover:text-[#0B3B2C] transition-colors cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={onSelectAdmin}
              className="text-slate-600 hover:text-[#0B3B2C] transition-colors cursor-pointer"
            >
              Admin Console
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

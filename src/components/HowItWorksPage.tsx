import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  Lock,
  Download,
  FileSpreadsheet,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Award,
  Vote,
  FileText,
  KeyRound,
  Check,
} from 'lucide-react';
import { ElectionSettings } from '../types';

interface HowItWorksPageProps {
  onSelectUser: () => void;
  onSelectAdmin: () => void;
  onBackToHome: () => void;
  settings: ElectionSettings;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({
  onSelectUser,
  onSelectAdmin,
  onBackToHome,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'voters' | 'admins' | 'security' | 'faq'>('voters');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const voterSteps = [
    {
      num: '01',
      title: 'Roll Number & Voting Code',
      desc: 'Access the Voter Portal, enter your authorized college Roll Number and the election security code. The system instantly verifies your eligibility against the official student register.',
      badge: 'Zero Password Friction',
    },
    {
      num: '02',
      title: 'Ballot Selection by Position',
      desc: 'Browse approved campus positions (e.g. President, Vice President, Secretary). Compare candidates, candidate IDs, and affiliations, then tap to make your choice.',
      badge: 'One Candidate per Position',
    },
    {
      num: '03',
      title: 'Review Your Choices',
      desc: 'Review your complete ballot summary on a dedicated confirmation screen. Need to adjust a choice? Click "Edit" to quickly change your candidate before sealing.',
      badge: 'Transparent & Verifiable',
    },
    {
      num: '04',
      title: 'Cryptographic Digital Receipt',
      desc: 'Upon final submission, your vote is recorded in the permanent Excel ledger and your roll number is permanently marked as voted. You receive an official Vote Reference ID.',
      badge: 'Tamper-Evident Confirmation',
    },
  ];

  const adminFeatures = [
    {
      num: '01',
      title: 'Multi-Election Management',
      desc: 'Create and configure multiple independent elections (Student Council, Branch Reps, Cultural Secretary) with custom titles, dates, and security codes.',
    },
    {
      num: '02',
      title: 'Student Roster & Roll Lookup',
      desc: 'Manage the eligible voter database. Review real-time participation status (Yes/No voted flag) and ensure only enrolled students can cast a ballot.',
    },
    {
      num: '03',
      title: 'Candidate Nominations & Ballots',
      desc: 'Add and organize candidates under specific election positions with candidate photos, unique candidate IDs, and party or independent affiliations.',
    },
    {
      num: '04',
      title: 'Real-Time Excel Database Sync',
      desc: 'Every voter record, ballot choice, and audit timestamp syncs directly to the live multi-sheet Excel workbook (voting_database.xlsx) with one-click export.',
    },
  ];

  const faqs = [
    {
      q: 'How does VoteEase prevent duplicate votes?',
      a: 'The system validates your unique College Roll Number against the active student register. Once a ballot is submitted, your roll number is permanently flagged as "Has Voted = Yes" with a timestamp in the database. Any subsequent attempt with the same roll number is automatically blocked.',
    },
    {
      q: 'Is my vote truly anonymous and confidential?',
      a: 'Yes. The system maintains strict ballot secrecy. Your roll number is only used to verify eligibility and record participation status. Your individual candidate selections are recorded independently without attaching your name to the ballot choices.',
    },
    {
      q: 'What is the Voting Security Code?',
      a: 'The Voting Security Code is a unique confidential identifier provided by the election commission for each specific election. It ensures that students vote in the appropriate election and branch.',
    },
    {
      q: 'How can election administrators audit the results?',
      a: 'Administrators can download the complete live multi-sheet Excel spreadsheet (voting_database.xlsx) at any moment. The workbook contains structured sheets for Registered Voters, Candidates, Votes Log, and Results Tallies for complete transparency.',
    },
    {
      q: 'Can a student vote after the polls are closed?',
      a: 'No. When the election commissioner pauses or closes an election from the Admin Console, the voter portal immediately displays a "Polls Closed" notice and disables ballot submission.',
    },
  ];

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] bg-[#F8FAF9] flex flex-col justify-between select-none overflow-hidden">
      
      {/* Background Curved Accents (Matching VoteEase Theme) */}
      <div className="absolute top-0 right-0 w-[55vw] h-[75vh] pointer-events-none overflow-hidden opacity-50">
        <svg viewBox="0 0 800 800" fill="none" className="w-full h-full object-cover -translate-y-12 translate-x-24">
          <path d="M200 0 C450 150 700 350 800 700 L800 0 Z" fill="#F59E0B" fillOpacity="0.08" />
          <path d="M350 0 C550 200 720 450 800 600 L800 0 Z" fill="#0B3B2C" fillOpacity="0.08" />
        </svg>
      </div>

      <div className="relative max-w-6xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-10 lg:py-14 space-y-12">
        
        {/* Top Navigation Back */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Return to Home</span>
          </button>

          <span className="text-xs text-slate-400 font-mono">
            {settings.collegeName}
          </span>
        </div>

        {/* HERO SECTION (Matching VoteEase Typography) */}
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-slate-500 font-sans">
            STUDENT ELECTION PLATFORM GUIDE
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 leading-[1.05]">
            How<br />
            VoteEase<br />
            Works<span className="text-[#F59E0B]">.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed pt-1">
            A simple, secure and transparent voting experience from roll authentication to tamper-evident confirmation.
          </p>
        </div>

        {/* NAVIGATION PILL TABS (Matching Mockup Pill Buttons) */}
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('voters')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs ${
              activeTab === 'voters'
                ? 'bg-[#0B3B2C] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>For Voters (Students)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs ${
              activeTab === 'admins'
                ? 'bg-[#0B3B2C] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>For Administrators</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs ${
              activeTab === 'security'
                ? 'bg-[#0B3B2C] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security & Integrity</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs ${
              activeTab === 'faq'
                ? 'bg-[#0B3B2C] text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Frequently Asked Questions</span>
          </button>
        </div>

        {/* TAB CONTENT 1: FOR VOTERS */}
        {activeTab === 'voters' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {voterSteps.map((step) => (
                <div
                  key={step.num}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#0B3B2C] text-white flex items-center justify-center font-bold text-sm font-mono">
                      {step.num}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-[#0B3B2C]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{step.badge}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Voter Action Card (Matching Mockup Style) */}
            <div className="bg-[#0B3B2C] text-white rounded-3xl p-8 sm:p-10 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-lg">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-emerald-300/80">
                  Ready to participate?
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-white">
                  Cast Your Ballot in Under 60 Seconds
                </h3>
                <p className="text-xs sm:text-sm text-emerald-100/70">
                  Have your college roll number and election security code ready. Your selections remain strictly confidential.
                </p>
              </div>

              <button
                type="button"
                onClick={onSelectUser}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#0B3B2C] font-semibold text-xs sm:text-sm shadow-md hover:bg-emerald-50 transition-colors cursor-pointer shrink-0"
              >
                <span>Launch Voter Access</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB CONTENT 2: FOR ADMINISTRATORS */}
        {activeTab === 'admins' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {adminFeatures.map((feat) => (
                <div
                  key={feat.num}
                  className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-10 h-10 rounded-xl bg-slate-100 text-[#0B3B2C] flex items-center justify-center font-bold text-sm font-mono">
                      {feat.num}
                    </span>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Administration
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Admin CTA Card */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/90 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1 max-w-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0B3B2C]">
                  Election Officers
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Open Administration Dashboard
                </h3>
                <p className="text-xs text-slate-500">
                  Monitor live participation rates, update candidates, and download the full Excel workbook.
                </p>
              </div>

              <button
                type="button"
                onClick={onSelectAdmin}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#0B3B2C] hover:bg-[#07291F] text-white font-semibold text-xs sm:text-sm shadow-md transition-colors cursor-pointer shrink-0"
              >
                <span>Enter Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB CONTENT 3: SECURITY & INTEGRITY */}
        {activeTab === 'security' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  One Student, One Vote
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every submission checks the student register and locks the roll number in real-time. Double voting is mathematically and programmatically prohibited.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <FileSpreadsheet className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Direct Excel Records
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Ballot records are maintained in a structured multi-sheet Excel file (<code className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded">voting_database.xlsx</code>) exportable for audit review anytime.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-7 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0B3B2C] flex items-center justify-center">
                  <Lock className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Confidential Secret Ballot
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Student roll numbers are decoupled from cast candidate selections in public reports, ensuring complete confidentiality for every voter.
                </p>
              </div>

            </div>
          </div>
        )}

        {/* TAB CONTENT 4: FAQ */}
        {activeTab === 'faq' && (
          <div className="max-w-3xl space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  >
                    <span className="text-sm font-bold text-slate-900">
                      {faq.q}
                    </span>
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/60 bg-white/70 backdrop-blur-xs py-4 px-6 sm:px-8 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">VoteEase</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{settings.collegeName}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>Platform Documentation</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onSelectUser}
              className="text-slate-600 hover:text-[#0B3B2C] font-medium transition-colors cursor-pointer"
            >
              Voter Access
            </button>
            <button
              onClick={onSelectAdmin}
              className="text-slate-600 hover:text-[#0B3B2C] font-medium transition-colors cursor-pointer"
            >
              Admin Console
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

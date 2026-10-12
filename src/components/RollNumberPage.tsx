import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Building,
  KeyRound,
  Calendar,
  Info,
} from 'lucide-react';
import { VoteEaseLogo } from './VoteEaseLogo';

interface IdentifiedElection {
  id: string;
  electionName: string;
  collegeName: string;
  securityCode: string;
  positions: string[];
  electionStatus: 'Active' | 'Closed';
  candidatesCount?: number;
  totalEligibleVoters?: number;
  isClosed?: boolean;
  scheduledDate?: string;
  dateValidity?: 'open' | 'upcoming' | 'expired';
  dateMessage?: string;
  note?: string;
}

interface RollNumberPageProps {
  onBackToHome: () => void;
  onValidRollNumber: (
    student: { rollNumber: string; studentName: string },
    election: IdentifiedElection
  ) => void;
  initialSecurityCode?: string;
}

export const RollNumberPage: React.FC<RollNumberPageProps> = ({
  onBackToHome,
  onValidRollNumber,
  initialSecurityCode = '',
}) => {
  const [rollNumber, setRollNumber] = useState('');
  const [votingCode, setVotingCode] = useState(initialSecurityCode);
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    'not_found' | 'already_voted' | 'closed' | 'code_invalid' | 'scheduled_upcoming' | 'scheduled_expired' | null
  >(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [scheduledNote, setScheduledNote] = useState<string | null>(null);
  const [scheduledDateStr, setScheduledDateStr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRoll = rollNumber.trim().toUpperCase();
    const cleanCode = votingCode.trim().toUpperCase();

    if (!cleanRoll) {
      setErrorMsg('Please enter your Student Roll Number.');
      setErrorType('not_found');
      return;
    }
    if (!cleanCode) {
      setErrorMsg('Please enter the Voting Security Code.');
      setErrorType('code_invalid');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setErrorType(null);

    try {
      // 1. Verify code
      const codeRes = await fetch('/api/voter/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ securityCode: cleanCode }),
      });
      const codeData = await codeRes.json();
      if (!codeRes.ok || !codeData.valid) {
        setErrorMsg(codeData.message || `Voting code "${cleanCode}" is not recognized.`);
        setErrorType('code_invalid');
        setIsLoading(false);
        return;
      }

      const identifiedElection: IdentifiedElection = codeData.election;
      if (identifiedElection.scheduledDate) {
        setScheduledDateStr(identifiedElection.scheduledDate);
        setScheduledNote(identifiedElection.note || 'Note: This election is valid for that particular date only.');
      }

      // 2. Validate roll number for this election
      const rollRes = await fetch('/api/voter/validate-roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          electionId: identifiedElection.id,
          rollNumber: cleanRoll,
        }),
      });

      const rollData = await rollRes.json();
      if (!rollRes.ok) {
        setErrorMsg(rollData.error || 'Failed to validate roll number.');
        setErrorType('not_found');
        setIsLoading(false);
        return;
      }

      if (!rollData.valid) {
        if (rollData.reason === 'already_voted') {
          setErrorType('already_voted');
          setErrorMsg(rollData.message || 'You have already cast your vote in this election.');
          setStudentDetails(rollData.student);
        } else if (rollData.reason === 'voting_closed') {
          setErrorType('closed');
          setErrorMsg('Voting for this election is currently closed.');
        } else if (rollData.reason === 'election_upcoming') {
          setErrorType('scheduled_upcoming');
          setErrorMsg(rollData.message);
          setScheduledDateStr(rollData.scheduledDate);
          setScheduledNote(rollData.note || 'Note: This election is valid for that particular date only.');
        } else if (rollData.reason === 'election_expired') {
          setErrorType('scheduled_expired');
          setErrorMsg(rollData.message);
          setScheduledDateStr(rollData.scheduledDate);
          setScheduledNote(rollData.note || 'Note: This election is valid for that particular date only.');
        } else {
          setErrorType('not_found');
          setErrorMsg(rollData.message || `Roll number "${cleanRoll}" is not eligible for this election.`);
        }
        setIsLoading(false);
        return;
      }

      // Success! Move to voting ballot
      onValidRollNumber(rollData.student, identifiedElection);
    } catch (err: any) {
      setErrorMsg('Unable to connect to election server. Please check connection.');
      setErrorType('not_found');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] bg-[#F8FAF9] flex items-center justify-center p-4 sm:p-6 lg:p-10 select-none overflow-hidden">
      
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-[50vw] h-[90vh] pointer-events-none opacity-50">
        <svg viewBox="0 0 600 600" fill="none" className="w-full h-full object-cover">
          <path d="M100 0 C300 150 500 350 600 600 L600 0 Z" fill="#F59E0B" fillOpacity="0.08" />
          <path d="M250 0 C450 180 550 400 600 500 L600 0 Z" fill="#0B3B2C" fillOpacity="0.08" />
        </svg>
      </div>

      <div className="relative max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT CARD / BANNER: Deep Forest Green (Matching Mockup Screen 2) */}
        <div className="lg:col-span-4 bg-gradient-to-br from-[#0B3B2C] to-[#06261C] text-white rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[460px]">
          {/* Subtle curved ribbon inside dark card */}
          <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-20">
            <svg viewBox="0 0 200 200" fill="none" className="w-full h-full">
              <circle cx="150" cy="50" r="100" stroke="#F59E0B" strokeWidth="20" fill="none" />
            </svg>
          </div>

          <div className="space-y-6 relative z-10">
            {/* Logo */}
            <div className="flex items-center justify-between">
              <VoteEaseLogo size="sm" inverted />
              <button
                type="button"
                onClick={onBackToHome}
                className="text-xs text-emerald-200/80 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
            </div>

            <div className="pt-8 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-300/80">
                STUDENT COUNCIL ELECTIONS 2026
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                Your<br />Voice<br />Matters
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/70 leading-relaxed pt-1">
                Be a part of the change.<br />
                Make your vote count.
              </p>
            </div>
          </div>

          {/* Carousel dots indicator (Matching Mockup: dash + dot) */}
          <div className="flex items-center gap-2 pt-8 relative z-10">
            <span className="w-6 h-1.5 rounded-full bg-[#F59E0B]" />
            <span className="w-2 h-1.5 rounded-full bg-white/40" />
            <span className="w-2 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>

        {/* CENTER FLOATING CARD: Voter Access Form (Matching Mockup Screen 2) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Voter Access
            </h1>
            <p className="text-xs text-slate-500">
              Election: Student Council Elections 2026
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input 1: User / Roll Number */}
            <div className="space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={rollNumber}
                  onChange={(e) => {
                    setRollNumber(e.target.value.toUpperCase());
                    setErrorMsg(null);
                  }}
                  placeholder="Enter Roll Number"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B3B2C] focus:ring-1 focus:ring-[#0B3B2C] text-sm font-medium text-slate-900 font-mono tracking-wide placeholder:font-sans placeholder:text-slate-400 transition-colors"
                />
              </div>
            </div>

            {/* Input 2: Lock / Voting Code */}
            <div className="space-y-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showCode ? 'text' : 'password'}
                  required
                  value={votingCode}
                  onChange={(e) => {
                    setVotingCode(e.target.value.toUpperCase());
                    setErrorMsg(null);
                  }}
                  placeholder="Enter Voting Code"
                  className="w-full pl-11 pr-11 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#0B3B2C] focus:ring-1 focus:ring-[#0B3B2C] text-sm font-medium text-slate-900 font-mono tracking-wide placeholder:font-sans placeholder:text-slate-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  tabIndex={-1}
                >
                  {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Scheduled Date Notice Banner */}
            {scheduledDateStr && (
              <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-950">
                  <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Scheduled Date: {new Date(scheduledDateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <p className="text-[11px] text-amber-800 font-medium">
                  {scheduledNote || 'Note: This election is valid for that particular date only.'}
                </p>
              </div>
            )}

            {/* Error Message Alert */}
            {errorMsg && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                  errorType === 'scheduled_upcoming'
                    ? 'bg-amber-50 border-amber-300 text-amber-950'
                    : errorType === 'scheduled_expired'
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}
              >
                {errorType === 'scheduled_upcoming' ? (
                  <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1">
                  <p className="font-semibold">
                    {errorType === 'already_voted'
                      ? 'Already Voted'
                      : errorType === 'scheduled_upcoming'
                      ? 'Election Scheduled for Future Date'
                      : errorType === 'scheduled_expired'
                      ? 'Scheduled Election Concluded'
                      : 'Authentication Error'}
                  </p>
                  <p className="mt-0.5">{errorMsg}</p>
                  {(errorType === 'scheduled_upcoming' || errorType === 'scheduled_expired' || scheduledNote) && (
                    <div className="mt-1.5 p-2 rounded-lg bg-amber-100/70 border border-amber-300/80 text-[11px] font-bold text-amber-950 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                      <span>{scheduledNote || 'Note: This election is valid for that particular date only.'}</span>
                    </div>
                  )}
                  {studentDetails && (
                    <p className="mt-1 text-[11px] text-slate-600">
                      Student: <span className="font-semibold">{studentDetails.studentName}</span>
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button (Matching Mockup: dark green Continue →) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white font-semibold text-sm shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Validating Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: Vertical Stepper (Matching Mockup Screen 2) */}
        <div className="lg:col-span-3 hidden lg:flex flex-col gap-6 pl-4">
          <div className="relative flex flex-col gap-8">
            {/* Step 1 */}
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 rounded-full bg-[#0B3B2C] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                1
              </div>
              <span className="text-xs font-semibold text-slate-900">
                Roll Number
              </span>
            </div>

            {/* Connecting line */}
            <div className="absolute left-3.5 top-7 w-0.5 h-8 bg-slate-300" />

            {/* Step 2 */}
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 rounded-full bg-[#0B3B2C] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                2
              </div>
              <span className="text-xs font-semibold text-slate-900">
                Voting Code
              </span>
            </div>

            {/* Connecting line */}
            <div className="absolute left-3.5 top-[5.25rem] w-0.5 h-8 bg-slate-200" />

            {/* Step 3 */}
            <div className="flex items-center gap-4">
              <div className="w-7 h-7 rounded-full border-2 border-slate-300 text-slate-400 text-xs font-semibold flex items-center justify-center shrink-0">
                3
              </div>
              <span className="text-xs font-medium text-slate-400">
                Verify
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

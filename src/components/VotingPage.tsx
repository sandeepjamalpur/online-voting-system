import React, { useState, useEffect } from 'react';
import {
  Vote,
  Check,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Edit2,
  Loader2,
  AlertCircle,
  Award,
  Crown,
  BookOpen,
  FileText,
  User,
  ShieldCheck,
  Building,
  Calendar,
  Info,
} from 'lucide-react';
import { Candidate, PositionVotingData, ElectionSettings } from '../types';
import { VoteEaseLogo } from './VoteEaseLogo';

interface VotingPageProps {
  student: { rollNumber: string; studentName: string };
  settings?: ElectionSettings;
  election?: {
    id: string;
    electionName: string;
    collegeName: string;
    securityCode: string;
    positions: string[];
    electionStatus: 'Active' | 'Closed';
    scheduledDate?: string;
  };
  onVoteSuccess: (result: {
    voteReferenceId: string;
    date: string;
    time: string;
    electionName?: string;
    collegeName?: string;
    securityCode?: string;
    rollNumber?: string;
    selections?: { position: string; candidateName: string }[];
  }) => void;
  onCancel: () => void;
}

export const VotingPage: React.FC<VotingPageProps> = ({
  student,
  settings,
  election,
  onVoteSuccess,
  onCancel,
}) => {
  const [positions, setPositions] = useState<PositionVotingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Stepper state: 'vote' (Screen 3) or 'review' (Screen 4)
  const [currentStep, setCurrentStep] = useState<'vote' | 'review'>('vote');

  // Selections: { [positionName]: candidateId }
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activePositionTab, setActivePositionTab] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch candidates from backend
  useEffect(() => {
    const fetchVotingData = async () => {
      try {
        setIsLoading(true);
        const electionIdParam = election?.id ? `?electionId=${election.id}` : '';
        const endpoint = election?.id ? `/api/voter/ballot/${election.id}` : `/api/voting-data${electionIdParam}`;
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error('Failed to load voting candidates.');
        const data = await res.json();

        let loadedPositions: PositionVotingData[] = data.positions || [];
        const allowedPositions = election?.positions || data.election?.positions;
        if (allowedPositions && Array.isArray(allowedPositions) && allowedPositions.length > 0) {
          const allowedLookup = new Set(allowedPositions.map((p: string) => p.trim().toLowerCase()));
          loadedPositions = loadedPositions.filter((pos) =>
            allowedLookup.has(pos.positionName.trim().toLowerCase())
          );
        }

        setPositions(loadedPositions);
        if (loadedPositions.length > 0) {
          setActivePositionTab(loadedPositions[0].positionName);
        }
      } catch (err: any) {
        setFetchError(err.message || 'Error loading election positions.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVotingData();
  }, [election?.id, election?.positions]);

  const handleSelectCandidate = (positionName: string, candidateId: string) => {
    setSelections((prev) => ({
      ...prev,
      [positionName]: candidateId,
    }));
    setValidationError(null);
  };

  const handleGoToReview = () => {
    // Check if all positions have selections
    const unselected = positions.filter((p) => !selections[p.positionName]);
    if (unselected.length > 0) {
      setValidationError(
        `Please select a candidate for: ${unselected.map((p) => p.positionName).join(', ')}.`
      );
      // Scroll to first unselected
      const first = unselected[0];
      setActivePositionTab(first.positionName);
      const el = document.getElementById(`pos-group-${first.positionName.replace(/\s+/g, '-')}`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setValidationError(null);
    setCurrentStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const now = new Date();
      const clientDate = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
      const clientTime = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const payload = {
        electionId: election?.id,
        rollNumber: student.rollNumber,
        votes: selections,
        date: clientDate,
        time: clientTime,
        timestamp: now.toISOString(),
      };

      const res = await fetch('/api/voter/submit-vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit vote.');
      }

      // Map selections
      const selectionSummary = positions.map((p) => {
        const cId = selections[p.positionName];
        const cand = p.candidates.find((c) => c.candidateId === cId);
        return {
          position: p.positionName,
          candidateName: cand ? cand.candidateName : cId || 'Abstained',
        };
      });

      onVoteSuccess({
        voteReferenceId: data.voteReferenceId || 'V' + Math.floor(100000 + Math.random() * 900000),
        date: data.date || clientDate,
        time: data.time || clientTime,
        electionName: election?.electionName || settings?.electionName,
        collegeName: election?.collegeName || settings?.collegeName,
        securityCode: election?.securityCode || settings?.securityCode,
        rollNumber: student.rollNumber,
        selections: selectionSummary,
      });
    } catch (err: any) {
      setSubmitError(err.message || 'Error during submission. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center bg-[#F8FAF9]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B3B2C] mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Loading Official Ballot...</p>
        </div>
      </div>
    );
  }

  if (fetchError || positions.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4.5rem)] flex items-center justify-center bg-[#F8FAF9] p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Election Ballot Unavailable</h2>
          <p className="text-sm text-slate-600">{fetchError || 'No active positions found in database.'}</p>
          <button
            onClick={onCancel}
            className="w-full py-3 px-6 bg-[#0B3B2C] text-white rounded-full text-sm font-semibold hover:bg-[#07291F]"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const totalPositions = positions.length;
  const completedPositions = Object.keys(selections).length;

  const activeElectionName =
    election?.electionName || settings?.electionName || 'Student Council Election 2026';
  const activeCollegeName = election?.collegeName || settings?.collegeName || '';
  const activeSecurityCode = election?.securityCode || settings?.securityCode || '';

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#F8FAF9] pb-20 select-none">
      
      {/* TOP HEADER: VoteEase + Election Name + Centered Stepper + Roll No / Logout */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 py-3.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Election Name Pill */}
          <div className="flex items-center gap-3">
            <VoteEaseLogo size="xs" />
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-bold shadow-2xs">
              <Vote className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate max-w-[280px]">{activeElectionName}</span>
            </div>
          </div>

          {/* Centered Stepper: 1 Vote --- 2 Review --- 3 Submit (Matching Mockup) */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Step 1: Vote */}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 'review'
                    ? 'bg-[#0B3B2C] text-white'
                    : 'bg-[#0B3B2C] text-white'
                }`}
              >
                {currentStep === 'review' ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '1'}
              </div>
              <span className="text-xs font-semibold text-slate-900">Vote</span>
            </div>

            {/* Connecting line */}
            <div className={`w-8 h-0.5 ${currentStep === 'review' ? 'bg-[#0B3B2C]' : 'bg-slate-300'}`} />

            {/* Step 2: Review */}
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 'review'
                    ? 'bg-[#0B3B2C] text-white'
                    : 'border-2 border-slate-300 text-slate-400'
                }`}
              >
                2
              </div>
              <span className={`text-xs font-semibold ${currentStep === 'review' ? 'text-slate-900' : 'text-slate-400'}`}>
                Review
              </span>
            </div>

            {/* Connecting line */}
            <div className="w-8 h-0.5 bg-slate-300" />

            {/* Step 3: Submit */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full border-2 border-slate-300 text-slate-400 text-xs font-semibold flex items-center justify-center">
                3
              </div>
              <span className="text-xs font-medium text-slate-400">Submit</span>
            </div>
          </div>

          {/* Right Voter Roll No & Logout */}
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-500 font-mono">
              Roll No: <strong className="text-slate-900">{student.rollNumber}</strong>
            </span>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-900 font-medium transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>

        </div>
      </header>

      {/* SCREEN 3: SELECT YOUR CANDIDATES VIEW */}
      {currentStep === 'vote' ? (
        <main className="max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-6">
          
          {/* ELECTION NAME ON TOP (Prominent Official Election Banner) */}
          <div className="bg-white rounded-3xl border border-emerald-900/10 p-6 sm:p-7 shadow-xs relative overflow-hidden bg-gradient-to-r from-emerald-50/70 via-white to-amber-50/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0B3B2C] text-white text-[11px] font-bold uppercase tracking-wider shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    Official Election Ballot
                  </span>
                  {activeSecurityCode && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-900 text-[11px] font-mono font-bold border border-emerald-200">
                      Code: {activeSecurityCode}
                    </span>
                  )}
                  {activeCollegeName && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                      <Building className="w-3 h-3 text-slate-400" />
                      {activeCollegeName}
                    </span>
                  )}
                </div>

                {/* ELECTION NAME DISPLAYED PROMINENTLY ON TOP */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
                  {activeElectionName}
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 flex-wrap pt-0.5">
                  <span>
                    Verified Voter:{' '}
                    <strong className="text-slate-900 font-bold">{student.studentName || 'Student'}</strong>{' '}
                    (<span className="font-mono text-emerald-800 font-bold">{student.rollNumber}</span>)
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-700 font-medium">Confidential & Encrypted Ballot</span>
                </p>

                {/* Scheduled Election Date Notice */}
                {election?.scheduledDate && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-950 text-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2 font-bold">
                      <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Scheduled Date: {new Date(election.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center gap-1 font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md text-[11px]">
                      <Info className="w-3 h-3 text-amber-800 shrink-0" />
                      <span>Note: This election is valid for that particular date only.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Progress Tracker Card */}
              <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shrink-0 flex items-center gap-4 shadow-2xs">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Ballot Progress
                  </p>
                  <p className="text-lg font-black text-slate-900">
                    {completedPositions} of {totalPositions}{' '}
                    <span className="text-xs font-medium text-slate-500">Positions</span>
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-[#0B3B2C] text-white flex items-center justify-center font-black text-sm shadow-xs">
                  {totalPositions > 0 ? Math.round((completedPositions / totalPositions) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Subheader Title & Instructions */}
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Select Your Candidates
            </h2>
            <p className="text-sm text-slate-500 font-normal">
              Choose one candidate for each contested position. Your ballot selections remain private.
            </p>
          </div>

          {/* Validation Alert if user tries to proceed without full selections */}
          {validationError && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* TWO-COLUMN LAYOUT (Matching Mockup Screen 3) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* LEFT COLUMN: Vertical Position Tabs (e.g. President (1/3), Vice President (2/3), Secretary (3/3)) */}
            <div className="lg:col-span-3 space-y-2.5">
              {positions.map((pos, idx) => {
                const isSelected = !!selections[pos.positionName];
                const isActive = activePositionTab === pos.positionName;

                return (
                  <button
                    key={pos.positionName}
                    type="button"
                    onClick={() => {
                      setActivePositionTab(pos.positionName);
                      const el = document.getElementById(`pos-group-${pos.positionName.replace(/\s+/g, '-')}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white border-[#0B3B2C] shadow-xs ring-1 ring-[#0B3B2C]'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#0B3B2C] text-white'
                            : 'bg-emerald-50 text-[#0B3B2C]'
                        }`}
                      >
                        {isSelected ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : idx === 0 ? (
                          <Crown className="w-4 h-4" />
                        ) : idx === 1 ? (
                          <Award className="w-4 h-4" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 leading-tight">
                          {pos.positionName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ({idx + 1}/{totalPositions})
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#0B3B2C] text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* RIGHT COLUMN: Position Sections & Candidate Cards Grid (Matching Mockup Screen 3) */}
            <div className="lg:col-span-9 space-y-8">
              {positions.map((pos) => {
                const currentSelectedId = selections[pos.positionName];

                return (
                  <div
                    key={pos.positionName}
                    id={`pos-group-${pos.positionName.replace(/\s+/g, '-')}`}
                    className="space-y-3.5 scroll-mt-24"
                  >
                    {/* Position Header */}
                    <div className="flex items-center gap-3">
                      <h2 className="text-base font-bold text-slate-900">
                        {pos.positionName}
                      </h2>
                      <span className="text-xs text-slate-500 font-normal">
                        Select one candidate
                      </span>
                    </div>

                    {/* Candidate Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {pos.candidates.length === 0 ? (
                        <div className="col-span-full py-8 px-4 text-center rounded-2xl bg-white border border-dashed border-slate-200 text-slate-500 text-xs">
                          No candidates registered for this position yet.
                        </div>
                      ) : (
                        pos.candidates.map((cand, candIdx) => {
                        const isSelected = currentSelectedId === cand.candidateId;
                        const positionSerial = candIdx + 1;

                        return (
                          <div
                            key={cand.candidateId}
                            onClick={() => handleSelectCandidate(pos.positionName, cand.candidateId)}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                              isSelected
                                ? 'bg-white border-[#0B3B2C] shadow-sm ring-1 ring-[#0B3B2C]'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                            }`}
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              {/* Serial Number Badge (starts at 1 for each specific position) */}
                              <span className="w-6 h-6 rounded-lg bg-emerald-50 text-[#0B3B2C] border border-emerald-200 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                                #{positionSerial}
                              </span>

                              {/* Avatar */}
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                {cand.imagePath ? (
                                  <img
                                    src={cand.imagePath}
                                    alt={cand.candidateName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-tr from-[#0B3B2C] to-[#134E3C] text-white flex items-center justify-center font-bold text-sm">
                                    {cand.candidateName.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                              </div>

                              {/* Candidate Info */}
                              <div className="min-w-0">
                                <h3 className="text-sm font-bold text-slate-900 truncate">
                                  {cand.candidateName}
                                </h3>
                                <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                                  {cand.candidateId} | {cand.group || 'Independent'}
                                </p>
                              </div>
                            </div>

                            {/* Circular Selector Badge (Matching Mockup: Green with Check when selected, gray ring when unselected) */}
                            <div className="shrink-0">
                              {isSelected ? (
                                <div className="w-6 h-6 rounded-full bg-[#0B3B2C] text-white flex items-center justify-center shadow-xs">
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white" />
                              )}
                            </div>
                          </div>
                        );
                      })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

          {/* BOTTOM ACTION BAR: ← Back & Next: Review → (Matching Mockup Screen 3) */}
          <div className="pt-8 border-t border-slate-200/80 flex items-center justify-between">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleGoToReview}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full bg-[#0B3B2C] hover:bg-[#07291F] text-white text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer"
            >
              <span>Next: Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </main>
      ) : (
        /* SCREEN 4: REVIEW YOUR CHOICES VIEW (Matching Mockup Screen 4) */
        <main className="max-w-2xl mx-auto px-6 sm:px-8 py-10 space-y-6">
          
          {/* Top back button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep('vote')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Selection</span>
            </button>
          </div>

          {/* ELECTION NAME ON TOP (Review Confirmation Banner) */}
          <div className="bg-white rounded-3xl border border-emerald-900/10 p-5 sm:p-6 shadow-xs bg-gradient-to-r from-emerald-50/70 via-white to-amber-50/40">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#0B3B2C] text-white text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                Ballot Confirmation
              </span>
              {activeCollegeName && (
                <span className="text-xs text-slate-500 font-medium">• {activeCollegeName}</span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {activeElectionName}
            </h2>
            <p className="text-xs text-slate-500 pt-1">
              Voter: <strong className="text-slate-900 font-bold">{student.studentName || 'Student'}</strong> (<span className="font-mono text-emerald-800 font-bold">{student.rollNumber}</span>)
            </p>
          </div>

          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Review Your Choices
            </h1>
            <p className="text-sm text-slate-500 font-normal">
              Please confirm your selections before submitting.
            </p>
          </div>

          {/* Review List Card (Matching Mockup Screen 4) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {positions.map((pos) => {
              const selectedCandId = selections[pos.positionName];
              const cand = pos.candidates.find((c) => c.candidateId === selectedCandId);

              return (
                <div
                  key={pos.positionName}
                  className="p-5 flex items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="w-1/3">
                    <span className="text-sm font-bold text-slate-900 block">
                      {pos.positionName}
                    </span>
                  </div>

                  <div className="flex-1">
                    <span className="text-sm font-semibold text-slate-900 block">
                      {cand?.candidateName || 'Not Selected'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {cand?.candidateId} | {cand?.group || 'Independent'}
                    </span>
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePositionTab(pos.positionName);
                        setCurrentStep('vote');
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-[#0B3B2C] transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Error Banner if any */}
          {submitError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Action Buttons (Matching Mockup: ← Go Back and Confirm & Submit →) */}
          <div className="pt-4 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => setCurrentStep('vote')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Go Back</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleConfirmSubmit}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#0B3B2C] hover:bg-[#07291F] text-white text-xs sm:text-sm font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Ballot...</span>
                </>
              ) : (
                <>
                  <span>Confirm & Submit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </main>
      )}

    </div>
  );
};

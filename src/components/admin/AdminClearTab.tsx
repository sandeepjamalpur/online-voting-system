import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  RotateCcw,
  Loader2,
  Users,
  Vote,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface AdminClearTabProps {
  onResetComplete: () => Promise<void>;
  electionId?: string;
}

export const AdminClearTab: React.FC<AdminClearTabProps> = ({ onResetComplete, electionId }) => {
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Empty Voters state
  const [showEmptyVotersModal, setShowEmptyVotersModal] = useState(false);
  const [isEmptyingVoters, setIsEmptyingVoters] = useState(false);
  const [emptyVotersSuccess, setEmptyVotersSuccess] = useState(false);
  const [emptyVotersError, setEmptyVotersError] = useState<string | null>(null);

  // Purge All Website Data state
  const [showPurgeAllModal, setShowPurgeAllModal] = useState(false);
  const [isPurgingAll, setIsPurgingAll] = useState(false);
  const [purgeAllSuccess, setPurgeAllSuccess] = useState(false);
  const [purgeAllError, setPurgeAllError] = useState<string | null>(null);

  const handlePurgeAllWebsiteData = async () => {
    setIsPurgingAll(true);
    setPurgeAllError(null);
    try {
      const res = await fetch('/api/admin/purge-all-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to purge all data');

      setShowPurgeAllModal(false);
      setPurgeAllSuccess(true);
      await onResetComplete();
      setTimeout(() => setPurgeAllSuccess(false), 5000);
    } catch (err: any) {
      setPurgeAllError(err.message || 'Error purging all data');
    } finally {
      setIsPurgingAll(false);
    }
  };

  const handleEmptyVoters = async () => {
    setIsEmptyingVoters(true);
    setEmptyVotersError(null);
    try {
      const res = await fetch('/api/users/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to empty voters');

      setShowEmptyVotersModal(false);
      setEmptyVotersSuccess(true);
      await onResetComplete();
      setTimeout(() => setEmptyVotersSuccess(false), 4000);
    } catch (err: any) {
      setEmptyVotersError(err.message || 'Error emptying voters');
    } finally {
      setIsEmptyingVoters(false);
    }
  };

  const handleExecuteReset = async () => {
    setIsResetting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reset operation failed');

      setShowWarningModal(false);
      setResetSuccess(true);
      await onResetComplete();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing reset');
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 text-rose-600 mb-1">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Critical Administrative Operation
          </span>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Clear All Voting System</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Reset votes and voter participation status while safely preserving student roster and candidate setup
        </p>
      </div>

      {/* Success Notification Banner after Reset */}
      {resetSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 space-y-3 animate-in fade-in" id="reset-success-card">
          <div className="flex items-center gap-3 text-emerald-800">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold">✓ VOTING SYSTEM RESET SUCCESSFULLY</h3>
              <p className="text-xs text-emerald-700">
                All voting records have been cleared. Students can now vote again.
              </p>
            </div>
          </div>
          <div className="text-xs text-emerald-800 pl-13 space-y-1">
            <p>• All vote transaction logs deleted from Excel <code className="bg-white/70 px-1 py-0.5 rounded font-mono">VOTES</code> sheet</p>
            <p>• All active student statuses set to <code className="bg-white/70 px-1 py-0.5 rounded font-bold">Has_Voted = No</code></p>
            <p>• Results sheet re-zeroed and Vote Reference sequence restarted</p>
            <p>• Users, Candidates, and Settings safely retained for fresh demonstration</p>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-rose-200 shadow-xs p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <RotateCcw className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Reset Ballots for New Demonstration / Term
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Use this option when you want to run a new voting cycle or reset a test session. It removes all submitted ballots from the Excel workbook and resets every student's voting flag back to &ldquo;No&rdquo;, allowing everyone to vote again immediately.
            </p>
          </div>
        </div>

        {/* Comparison Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Cleared */}
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2 text-xs">
            <span className="font-bold text-rose-800 uppercase tracking-wider block text-[11px]">
              Will Be Cleared:
            </span>
            <ul className="space-y-1 text-slate-700">
              <li className="flex items-center gap-1.5 text-rose-700 font-medium">
                <span>✓</span> All submitted votes
              </li>
              <li className="flex items-center gap-1.5 text-rose-700 font-medium">
                <span>✓</span> Vote records in Excel
              </li>
              <li className="flex items-center gap-1.5 text-rose-700 font-medium">
                <span>✓</span> Vote reference numbers
              </li>
              <li className="flex items-center gap-1.5 text-rose-700 font-medium">
                <span>✓</span> Voting status (Has_Voted)
              </li>
            </ul>
          </div>

          {/* Preserved */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs">
            <span className="font-bold text-emerald-800 uppercase tracking-wider block text-[11px]">
              Will NOT Be Deleted:
            </span>
            <ul className="space-y-1 text-slate-700">
              <li className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span>✓</span> Student Roster (Users)
              </li>
              <li className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span>✓</span> Registered Candidates
              </li>
              <li className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span>✓</span> Election Positions
              </li>
              <li className="flex items-center gap-1.5 text-emerald-700 font-medium">
                <span>✓</span> Institution & Settings
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => {
              setResetSuccess(false);
              setShowWarningModal(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 cursor-pointer transition-colors"
            id="clear-all-voting-system-btn"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>⚠ CLEAR ALL VOTING SYSTEM</span>
          </button>
        </div>
      </div>

      {/* Card 2: Empty All Registered Voters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">
              Empty All Voters List
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Purges all registered students from the voter roster in the Excel database. Because only listed voters are eligible to vote, no students will be able to vote until fresh voters are added or imported.
            </p>
          </div>
        </div>

        {emptyVotersSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All voters have been emptied from the voter roster.</span>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => setShowEmptyVotersModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-xs cursor-pointer transition-colors"
            id="empty-voters-action-btn"
          >
            <Trash2 className="w-4 h-4" />
            <span>EMPTY VOTERS LIST</span>
          </button>
        </div>
      </div>

      {/* 3. PURGE ALL WEBSITE DATA (ELECTIONS, VOTERS, CANDIDATES, VOTES) */}
      <div className="bg-white rounded-2xl border border-rose-300/80 shadow-xs p-6 space-y-5 bg-gradient-to-br from-white via-rose-50/20 to-rose-100/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
            <Trash2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
              Total Factory Reset
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Purge All Data From Website
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Permanently wipes <strong>all elections</strong>, <strong>candidate profiles</strong>, <strong>student voter rosters</strong>, and <strong>recorded votes</strong> across the entire website. The website returns to a fresh, completely empty slate.
            </p>
          </div>
        </div>

        {purgeAllSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>All website elections, voters, candidates, and votes have been purged.</span>
          </div>
        )}

        {purgeAllError && (
          <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{purgeAllError}</span>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={() => setShowPurgeAllModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs shadow-sm cursor-pointer transition-colors"
            id="purge-all-data-action-btn"
          >
            <Trash2 className="w-4 h-4" />
            <span>PURGE ALL WEBSITE DATA</span>
          </button>
        </div>
      </div>

      {/* MODAL: PURGE ALL WEBSITE DATA CONFIRMATION */}
      {showPurgeAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-300 space-y-4 text-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full mx-auto flex items-center justify-center shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600">
                ⚠ IRREVERSIBLE ACTION
              </span>
              <h3 className="text-lg font-bold text-slate-900">Purge All Data From Website?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will completely delete every election, all student roll numbers, all candidates, and all votes in the system.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-left text-xs text-rose-900 space-y-1">
              <p className="font-bold">What will be permanently erased:</p>
              <ul className="text-[11px] space-y-1 list-disc list-inside">
                <li>All active and closed elections</li>
                <li>All candidates and their assigned positions</li>
                <li>All voter rosters and student accounts</li>
                <li>All ballots, audit logs, and analytics</li>
              </ul>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowPurgeAllModal(false)}
                disabled={isPurgingAll}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePurgeAllWebsiteData}
                disabled={isPurgingAll}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-800 disabled:bg-rose-400 text-white text-xs font-bold shadow-md shadow-rose-700/20 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                id="confirm-purge-all-btn"
              >
                {isPurgingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Purging...</span>
                  </>
                ) : (
                  <span>YES, PURGE ALL</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EMPTY VOTERS CONFIRMATION */}
      {showEmptyVotersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-amber-200 space-y-4 text-center">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full mx-auto flex items-center justify-center shadow-xs">
              <Users className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Empty All Voters Roster?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will delete every student record in the Excel database <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">USERS</code> sheet.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
              <p className="font-bold">Eligibility notice:</p>
              <p className="text-[11px] leading-relaxed">
                Only listed voters are eligible to vote. After emptying the list, students attempting to vote will be blocked until you add eligible roll numbers.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEmptyVotersModal(false)}
                disabled={isEmptyingVoters}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmptyVoters}
                disabled={isEmptyingVoters}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                {isEmptyingVoters ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isEmptyingVoters ? 'Emptying...' : 'Yes, Empty Voters'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 23: EXACT WARNING MODAL */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-5 text-center">
            {/* Warning Icon */}
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-extrabold uppercase tracking-widest text-rose-600">
                ⚠ WARNING
              </span>
              <h3 className="text-xl font-extrabold text-slate-900">
                This will reset the entire voting system.
              </h3>
            </div>

            {/* List breakdown */}
            <div className="text-left space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <p className="font-bold text-rose-700 mb-1">The following will be cleared:</p>
                <ul className="space-y-0.5 text-slate-700 font-medium">
                  <li>✓ All submitted votes</li>
                  <li>✓ Vote records</li>
                  <li>✓ Vote reference numbers</li>
                  <li>✓ Voting status</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <p className="font-bold text-emerald-700 mb-1">The following will NOT be deleted:</p>
                <ul className="space-y-0.5 text-slate-700 font-medium">
                  <li>✓ Students</li>
                  <li>✓ Candidates</li>
                  <li>✓ Election positions</li>
                  <li>✓ Election settings</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200 font-bold text-[#0B3B2C] text-center">
                &ldquo;All students will be able to vote again.&rdquo;
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl text-left">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                disabled={isResetting}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
                id="cancel-reset-btn"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleExecuteReset}
                disabled={isResetting}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-xs font-bold shadow-md shadow-rose-600/20 inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                id="confirm-clear-everything-btn"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Resetting...</span>
                  </>
                ) : (
                  <span>CLEAR EVERYTHING</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

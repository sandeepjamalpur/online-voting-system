import React, { useState, useEffect } from 'react';
import {
  Settings,
  Lock,
  Unlock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Building,
  Vote,
  Save,
  Plus,
  Trash2,
  Calendar,
  Info,
} from 'lucide-react';
import { ElectionSettings } from '../../types';

interface AdminSettingsTabProps {
  settings: ElectionSettings;
  onUpdateSettings: (newSettings: Partial<ElectionSettings>) => Promise<void>;
  themeMode?: 'light' | 'dark' | 'system';
  onThemeModeChange?: (mode: 'light' | 'dark' | 'system') => void;
  isDark?: boolean;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [collegeName, setCollegeName] = useState(settings.collegeName);
  const [electionName, setElectionName] = useState(settings.electionName);
  const [scheduledDate, setScheduledDate] = useState(settings.scheduledDate || '');
  const [positions, setPositions] = useState<string[]>(
    settings.positions && settings.positions.length > 0
      ? settings.positions
      : []
  );
  const [newPositionInput, setNewPositionInput] = useState('');
  const [positionError, setPositionError] = useState<string | null>(null);

  // Save & Status States
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [statusConfirmModal, setStatusConfirmModal] = useState<boolean>(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Sync with incoming settings
  useEffect(() => {
    setCollegeName(settings.collegeName);
    setElectionName(settings.electionName);
    setScheduledDate(settings.scheduledDate || '');
    if (settings.positions && settings.positions.length > 0) {
      setPositions(settings.positions);
    }
  }, [
    settings.collegeName,
    settings.electionName,
    settings.scheduledDate,
    settings.positions,
  ]);

  const handleAddPosition = () => {
    const clean = newPositionInput.trim();
    if (!clean) return;

    if (positions.some((p) => p.toLowerCase() === clean.toLowerCase())) {
      setPositionError('This position already exists in the ballot configuration.');
      return;
    }

    setPositionError(null);
    setPositions([...positions, clean]);
    setNewPositionInput('');
  };

  const handleRemovePosition = (indexToRemove: number) => {
    if (positions.length <= 1) {
      setPositionError('An election requires at least one official voting position.');
      return;
    }
    setPositionError(null);
    setPositions(positions.filter((_, idx) => idx !== indexToRemove));
  };

  const handleConfirmToggleVotingStatus = async () => {
    setIsSaving(true);
    setStatusError(null);

    const nextStatus = settings.electionStatus === 'Active' ? 'Closed' : 'Active';

    try {
      await onUpdateSettings({ electionStatus: nextStatus });
      setStatusConfirmModal(false);
    } catch (err: any) {
      setStatusError(err.message || 'Failed to update voting status.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTextSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (positions.length === 0) {
      setPositionError('Please add at least one position.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await onUpdateSettings({
        collegeName: collegeName.trim(),
        electionName: electionName.trim(),
        positions,
        scheduledDate: scheduledDate.trim() || undefined,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const isClosed = settings.electionStatus === 'Closed';

  return (
    <div className="space-y-6 max-w-4xl select-none">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                System Controls
              </span>
              <span className="text-xs text-slate-400">• Election & Policy Configuration</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-1">
              Election Configuration & Settings
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage election voting status, institution name, and leadership balloting positions
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. CLOSE / OPEN VOTING SECTION                                  */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Voting Window Status</h3>
            <p className="text-xs text-slate-500">
              Control student ballot submission availability in real time
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              isClosed
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            {isClosed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>Voting is {settings.electionStatus}</span>
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-900">
              {isClosed ? 'Voting is Currently Closed' : 'Voting is Currently Open & Active'}
            </h4>
            <p className="text-xs text-slate-600 max-w-md">
              {isClosed
                ? 'Students visiting the voting page will see: "Voting is currently closed." You can reopen voting anytime.'
                : 'All eligible students who have not yet voted can verify their Roll Number and submit their ballots.'}
            </p>
            <p className="text-[11px] text-[#0B3B2C] font-semibold">
              Note: Closing voting does NOT delete existing votes or alter results.
            </p>
          </div>

          <div>
            {isClosed ? (
              <button
                type="button"
                onClick={() => setStatusConfirmModal(true)}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                id="open-voting-btn"
              >
                <Unlock className="w-4 h-4" />
                <span>OPEN VOTING</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStatusConfirmModal(true)}
                disabled={isSaving}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                id="close-voting-btn"
              >
                <Lock className="w-4 h-4" />
                <span>CLOSE VOTING</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STATUS TOGGLE CONFIRM MODAL */}
      {statusConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-slate-200 text-center space-y-4">
            <div
              className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                isClosed
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {isClosed ? <Unlock className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {isClosed ? 'Reopen Voting Portal?' : 'Close Voting Portal?'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {isClosed
                  ? 'Students will now be permitted to enter the Voting Security Code and their Roll Number to cast ballots.'
                  : 'Students will be temporarily blocked from casting ballots until voting is reopened. All existing cast ballots remain safe.'}
              </p>
            </div>

            {statusError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {statusError}
              </div>
            )}

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setStatusConfirmModal(false)}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleVotingStatus}
                disabled={isSaving}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                  isClosed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {isSaving ? (
                  <span>Updating...</span>
                ) : (
                  <span>{isClosed ? 'Confirm Open Voting' : 'Confirm Close Voting'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. INSTITUTION & ELECTION INFO                                 */}
      {/* ============================================================== */}
      <form
        onSubmit={handleSaveTextSettings}
        className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-2xs space-y-5"
      >
        <div className="pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Institution & Election Metadata
          </h3>
          <p className="text-xs text-slate-500">
            Stored in the Excel database{' '}
            <code className="text-[11px] font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">
              SETTINGS
            </code>{' '}
            sheet
          </p>
        </div>

        {saveSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Settings saved and written to database successfully!</span>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              College / Institution Name
            </label>
            <div className="relative">
              <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. University / College Name"
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Election Name / Title
            </label>
            <div className="relative">
              <Vote className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={electionName}
                onChange={(e) => setElectionName(e.target.value)}
                placeholder="e.g. Student Council Elections 2026"
                className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-900 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden"
                required
              />
            </div>
          </div>

          {/* Scheduled Election Date (Single-Day Election) */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-amber-950">
                  Scheduled Election Date (Single-Day Election)
                </label>
                <p className="text-[11px] text-amber-800">
                  Restrict voting to take place strictly on one designated date
                </p>
              </div>
              {scheduledDate && (
                <button
                  type="button"
                  onClick={() => setScheduledDate('')}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                >
                  Clear Date
                </button>
              )}
            </div>
            <div className="relative">
              <Calendar className="w-4 h-4 text-amber-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-amber-300 bg-white text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            {scheduledDate && (
              <div className="p-2 rounded-lg bg-white/90 border border-amber-300 text-amber-950 text-xs flex items-center gap-1.5 font-medium shadow-2xs">
                <Info className="w-3.5 h-3.5 text-amber-800 shrink-0" />
                <span className="font-bold">Note: This election is valid for that particular date only ({new Date(scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}).</span>
              </div>
            )}
          </div>

          {/* ELECTION POSITIONS */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-900">
                  Official Election Positions ({positions.length})
                </label>
                <p className="text-[11px] text-slate-500">
                  Only these exact positions will appear on the voter&apos;s ballot.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#0B3B2C] border border-emerald-200">
                {positions.length} configured
              </span>
            </div>

            {positionError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{positionError}</span>
              </div>
            )}

            {/* Positions List */}
            <div className="space-y-2">
              {positions.map((pos, idx) => (
                <div
                  key={`${pos}-${idx}`}
                  className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#0B3B2C] text-[10px] font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span>{pos}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemovePosition(idx)}
                    disabled={positions.length <= 1}
                    title={
                      positions.length <= 1
                        ? 'Minimum 1 position required'
                        : 'Remove position'
                    }
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-white transition-colors cursor-pointer disabled:opacity-30 disabled:hover:text-slate-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Position */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newPositionInput}
                onChange={(e) => setNewPositionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddPosition();
                  }
                }}
                placeholder="e.g. Joint Secretary, Sports Representative..."
                className="grow px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden bg-white text-slate-900"
              />
              <button
                type="button"
                onClick={handleAddPosition}
                className="px-4 py-2.5 bg-[#0B3B2C] hover:bg-[#07291F] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Position</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Writing to Excel & Firebase...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Metadata Settings</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

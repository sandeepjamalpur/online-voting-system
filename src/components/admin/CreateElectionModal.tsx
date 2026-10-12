import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Key,
  Users,
  Award,
  Building,
  CheckCircle2,
  Copy,
  Share2,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Calendar,
  Info,
} from 'lucide-react';
import { AdminAccount, Election } from '../../types';

interface CreateElectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  admin: AdminAccount;
  onElectionCreated: (newElection: Election) => void;
  onGoToAllElections?: () => void;
}

interface TempCandidate {
  name: string;
  position: string;
  group: string;
}

export const CreateElectionModal: React.FC<CreateElectionModalProps> = ({
  isOpen,
  onClose,
  admin,
  onElectionCreated,
  onGoToAllElections,
}) => {
  // Form fields
  const [electionName, setElectionName] = useState('');
  const [collegeName, setCollegeName] = useState(admin.collegeName || '');
  const [description, setDescription] = useState('');

  // Security code preview
  const [securityCode, setSecurityCode] = useState('');

  // Positions
  const [positionInput, setPositionInput] = useState('');
  const [positions, setPositions] = useState<string[]>([]);

  // Candidates
  const [candidates, setCandidates] = useState<TempCandidate[]>([]);

  // Eligible Voters (Roll numbers)
  const [voterRollsInput, setVoterRollsInput] = useState('');

  // Scheduled Election Date
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Success view state
  const [createdElection, setCreatedElection] = useState<Election | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleRegenerateCode = () => {
    const prefix = (electionName || 'VOTE').replace(/[^A-Za-z]/g, '').slice(0, 4).toUpperCase() || 'VOTE';
    setSecurityCode(`${prefix}-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  const handleAddPosition = () => {
    const trimmed = positionInput.trim();
    if (!trimmed) return;
    if (positions.includes(trimmed)) return;
    setPositions([...positions, trimmed]);
    setPositionInput('');
  };

  const handleRemovePosition = (posToRemove: string) => {
    const updated = positions.filter((p) => p !== posToRemove);
    setPositions(updated);
    // adjust candidates whose position was removed
    setCandidates(
      candidates.map((c) =>
        c.position === posToRemove ? { ...c, position: updated[0] || '' } : c
      )
    );
  };

  const handleAddCandidateRow = () => {
    if (positions.length === 0) {
      setErrorMsg('Please add at least one election position above before adding candidates.');
      return;
    }
    setErrorMsg(null);
    setCandidates([
      ...candidates,
      { name: '', position: positions[0] || '', group: 'Independent' },
    ]);
  };

  const handleRemoveCandidateRow = (index: number) => {
    setCandidates(candidates.filter((_, i) => i !== index));
  };

  const handleUpdateCandidate = (index: number, field: keyof TempCandidate, val: string) => {
    const next = [...candidates];
    next[index][field] = val;
    setCandidates(next);
  };

  // Parse voter roll numbers
  const parseVoterRolls = (): Array<{ rollNumber: string; studentName?: string }> => {
    const lines = voterRollsInput.split(/[\n,;]+/);
    const parsed: Array<{ rollNumber: string; studentName?: string }> = [];
    const seen = new Set<string>();

    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;

      if (line.includes(':') || line.includes('-') || line.includes('\t')) {
        const parts = line.split(/[:\-\t]+/);
        const roll = parts[0].trim().toUpperCase();
        const name = parts[1]?.trim();
        if (roll && !seen.has(roll)) {
          seen.add(roll);
          parsed.push({ rollNumber: roll, studentName: name });
        }
      } else {
        const roll = line.toUpperCase();
        if (roll && !seen.has(roll)) {
          seen.add(roll);
          parsed.push({ rollNumber: roll });
        }
      }
    }
    return parsed;
  };

  const parsedVoters = parseVoterRolls();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!electionName.trim()) {
      setErrorMsg('Please enter an Election Name.');
      return;
    }
    if (!collegeName.trim()) {
      setErrorMsg('Please enter the College/Organization Name.');
      return;
    }
    if (positions.length === 0) {
      setErrorMsg('Please add at least one election position.');
      return;
    }

    // Filter valid candidates
    const validCandidates = candidates
      .filter((c) => c.name.trim().length > 0)
      .map((c) => ({
        candidateName: c.name.trim(),
        position: c.position || positions[0],
        group: c.group.trim() || 'Independent',
      }));

    setIsSubmitting(true);

    try {
      const codeToSend = securityCode.trim() || undefined;

      const res = await fetch('/api/elections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: admin.id,
          electionName: electionName.trim(),
          collegeName: collegeName.trim(),
          positions,
          securityCode: codeToSend,
          description: description.trim(),
          candidates: validCandidates,
          eligibleRollNumbers: parsedVoters,
          scheduledDate: isScheduled && scheduledDate ? scheduledDate : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create election.');
      }

      setCreatedElection(data);
      onElectionCreated(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating election');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!createdElection) return;
    navigator.clipboard.writeText(createdElection.securityCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyShareText = () => {
    if (!createdElection) return;
    const dateLine = createdElection.scheduledDate
      ? `\n📅 Scheduled Date: ${createdElection.scheduledDate}\n⚠️ Note: This election is valid for that particular date only.`
      : '';
    const shareText = `📢 VOTING NOTIFICATION: ${createdElection.electionName}
🏫 Organization: ${createdElection.collegeName}
🔑 Voting Security Code: ${createdElection.securityCode}${dateLine}

Instructions:
1. Open the Voting Portal
2. Enter the Voting Security Code: ${createdElection.securityCode}
3. Enter your College Roll Number to verify eligibility
4. Cast your vote securely!`;
    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 my-8">
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-[#0B3B2C] via-[#07291F] to-[#041B14] text-white p-5 sm:p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-tight">Create New Election</h2>
              <p className="text-emerald-100/70 text-xs">
                Configure positions, candidates, and eligible voter roll numbers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        {createdElection ? (
          /* SUCCESS VIEW */
          <div className="p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs uppercase font-bold text-emerald-700 tracking-wider">
                System Initialized
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                {createdElection.electionName}
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                {createdElection.collegeName} • {createdElection.positions.length} Positions
              </p>
            </div>

            {/* HIGHLIGHTED SECURITY CODE CARD */}
            <div className="max-w-md mx-auto p-5 rounded-2xl bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border-2 border-emerald-200/90 shadow-2xs text-center">
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-700" />
                Voting Security Code
              </p>
              <div className="text-3xl sm:text-4xl font-mono font-black text-[#0B3B2C] tracking-wider my-2">
                {createdElection.securityCode}
              </div>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Share this unique security code with eligible students so they can identify this election in the Voter Portal.
              </p>

              <div className="flex flex-wrap gap-2 justify-center mt-4">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-4 py-2 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedCode ? 'Copied Code!' : 'Copy Code'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyShareText}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{copiedShare ? 'Copied Share Info!' : 'Copy Voter Invitation'}</span>
                </button>
              </div>
            </div>

            {createdElection.scheduledDate && (
              <div className="max-w-md mx-auto p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1 text-center shadow-2xs">
                <div className="font-bold text-amber-950 flex items-center justify-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-700" />
                  <span>Scheduled Date: {new Date(createdElection.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <p className="text-[11px] text-amber-800 font-medium">
                  Note: This election is valid for that particular date only.
                </p>
              </div>
            )}

            {/* Quick summary stats */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-left">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Positions</div>
                <div className="text-lg font-bold text-slate-800">
                  {createdElection.positions.length}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Eligible Voters</div>
                <div className="text-lg font-bold text-slate-800">
                  {parsedVoters.length}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-xs text-slate-500">Status</div>
                <div className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-1 rounded-md inline-block mt-1">
                  Active
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white font-bold text-xs sm:text-sm shadow-md cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <span>Open Election Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onGoToAllElections && (
                <button
                  type="button"
                  onClick={onGoToAllElections}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm cursor-pointer transition-all"
                >
                  View All Elections
                </button>
              )}
            </div>
          </div>
        ) : (
          /* CREATION FORM */
          <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* SECTION 1: ELECTION DETAILS */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Election Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={electionName}
                    onChange={(e) => setElectionName(e.target.value)}
                    placeholder="e.g. Branch Representative Election"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B2C] font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    College / Organization *
                  </label>
                  <input
                    type="text"
                    required
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g. University / College Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]"
                  />
                </div>
              </div>

              {/* SECURITY CODE CUSTOMIZATION */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-950">
                      Voting Security Code
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      System automatically creates a unique code or you can customize it
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={securityCode}
                    onChange={(e) => setSecurityCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    placeholder="Auto-generated"
                    className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-950 font-mono text-xs font-bold w-36 uppercase focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]"
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    className="px-3 py-1.5 rounded-lg bg-[#0B3B2C] hover:bg-[#07291F] text-white text-xs font-semibold cursor-pointer transition-all"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* SCHEDULE ELECTION FOR SPECIFIC DATE */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <span>Schedule Election Date</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-semibold px-1.5 py-0.5 rounded">
                          Single-Day Election
                        </span>
                      </div>
                      <div className="text-[11px] text-amber-800">
                        Restrict voting to take place strictly on one designated date
                      </div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => {
                        setIsScheduled(e.target.checked);
                        if (e.target.checked && !scheduledDate) {
                          const today = new Date().toISOString().split('T')[0];
                          setScheduledDate(today);
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B3B2C]"></div>
                  </label>
                </div>

                {isScheduled && (
                  <div className="pt-2 border-t border-amber-200/60 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <label className="text-xs font-bold text-amber-950">
                        Designated Election Date:
                      </label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]"
                        required={isScheduled}
                      />
                    </div>
                    
                    {/* Note requested by user */}
                    <div className="p-2.5 rounded-xl bg-white/90 border border-amber-300 text-amber-900 text-xs flex items-start gap-2 shadow-2xs">
                      <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="font-medium text-[11px] leading-relaxed">
                        <span className="font-bold text-amber-950">Note: This election is valid for that particular date only.</span> Students will be permitted to access and submit their ballot on {scheduledDate ? new Date(scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'the selected date'} only.
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: POSITIONS */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Election Positions ({positions.length}) *
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Add the posts voters will be voting for
                  </p>
                </div>
              </div>

              {/* Position chips */}
              {positions.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 text-xs text-center">
                  No positions added yet. Enter custom position titles below (e.g. President, Secretary, Class Representative) and click <span className="font-semibold text-slate-700">+ Add Position</span>.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {positions.map((pos) => (
                    <span
                      key={pos}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-300"
                    >
                      <span>{pos}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePosition(pos)}
                        className="text-slate-400 hover:text-red-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={positionInput}
                  onChange={(e) => setPositionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPosition();
                    }
                  }}
                  placeholder="e.g. Cultural Secretary, Sports Captain..."
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]"
                />
                <button
                  type="button"
                  onClick={handleAddPosition}
                  className="px-4 py-2 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white text-xs font-bold cursor-pointer transition-all"
                >
                  + Add Position
                </button>
              </div>
            </div>

            {/* SECTION 3: CANDIDATES */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Candidates (Optional now, can add more later)
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Add candidate names and assign them to positions
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddCandidateRow}
                  className="text-xs font-bold text-[#0B3B2C] hover:text-[#07291F] cursor-pointer flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Row
                </button>
              </div>

              {candidates.length === 0 ? (
                <div className="p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-500 text-xs text-center">
                  No candidates added yet. {positions.length === 0 ? 'Add election positions first above, then click "+ Add Row".' : 'Click "+ Add Row" above to add candidates for this election.'}
                </div>
              ) : (
                <div className="space-y-2">
                  {candidates.map((cand, idx) => {
                  // Serial number restarts for each specific position
                  const positionSerial = candidates
                    .slice(0, idx + 1)
                    .filter((c) => c.position === cand.position).length;

                  return (
                    <div
                      key={idx}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 items-center"
                    >
                      <div className="sm:col-span-5 flex items-center gap-2">
                        <span className="shrink-0 w-6 h-6 rounded-md bg-emerald-100 text-[#0B3B2C] border border-emerald-300 text-[11px] font-bold font-mono flex items-center justify-center" title={`S.No #${positionSerial} for ${cand.position}`}>
                          #{positionSerial}
                        </span>
                        <input
                          type="text"
                          value={cand.name}
                          onChange={(e) => handleUpdateCandidate(idx, 'name', e.target.value)}
                          placeholder={`Candidate Name (S.No #${positionSerial})`}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]"
                        />
                      </div>
                    <div className="sm:col-span-3">
                      <select
                        value={cand.position}
                        onChange={(e) => handleUpdateCandidate(idx, 'position', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B2C] font-medium"
                      >
                        {positions.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={cand.group}
                        onChange={(e) => handleUpdateCandidate(idx, 'group', e.target.value)}
                        placeholder="Party/Group"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]"
                      />
                    </div>
                    <div className="sm:col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveCandidateRow(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
            </div>

            {/* SECTION 4: ELIGIBLE VOTERS NOTE */}
            <div className="pt-2 border-t border-slate-100">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 text-xs text-slate-700 flex items-start gap-2.5 shadow-2xs">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  <strong className="font-bold text-slate-900">Note:</strong> You can add voters at any time, even after the election has been created.
                </p>
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <span>Generating Security Code & Election...</span>
                ) : (
                  <span>Create Election & Generate Security Code</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

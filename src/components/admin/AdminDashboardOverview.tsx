import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Percent,
  Vote,
  Download,
  ShieldCheck,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Database,
  BarChart3,
  Award,
  Key,
  Copy,
  Check,
  Share2,
  RefreshCw,
  Play,
  Pause,
  ExternalLink,
  Sparkles,
  Calendar,
  Info,
} from 'lucide-react';
import { AdminStats, Election, ElectionSettings, ResultsData } from '../../types';
import { RechartsLiveBarChart } from './RechartsLiveBarChart';

interface AdminDashboardOverviewProps {
  stats: AdminStats;
  settings: ElectionSettings;
  election?: Election | null;
  onNavigateTab: (tab: any) => void;
  onExport: (type: string) => void;
  onToggleStatus?: () => void;
  onBackToAllElections?: () => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  stats,
  settings,
  election,
  onNavigateTab,
  onExport,
  onToggleStatus,
  onBackToAllElections,
}) => {
  const isVotingClosed = settings.electionStatus === 'Closed';
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [selectedViewMode, setSelectedViewMode] = useState<'tallies' | 'audit'>('tallies');

  const securityCode = election?.securityCode || settings.securityCode || '';

  // Fetch real-time position tallies for this specific election
  const fetchElectionResults = async () => {
    if (!election?.id) return;
    try {
      setIsLoadingResults(true);
      const res = await fetch(`/api/results?electionId=${encodeURIComponent(election.id)}`);
      if (res.ok) {
        const data = await res.json();
        setResultsData(data);
      }
    } catch (err) {
      console.error('Error fetching live tallies:', err);
    } finally {
      setIsLoadingResults(false);
    }
  };

  useEffect(() => {
    fetchElectionResults();
  }, [election?.id, stats.totalVotes]);

  const handleCopyCode = () => {
    if (!securityCode) return;
    navigator.clipboard.writeText(securityCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyShareText = () => {
    if (!securityCode) return;
    const schedDate = election?.scheduledDate || settings.scheduledDate;
    const dateLine = schedDate
      ? `\n📅 Scheduled Date: ${schedDate}\n⚠️ Note: This election is valid for that particular date only.`
      : '';
    const shareText = `📢 VOTING NOTIFICATION: ${settings.electionName}
🏫 Organization: ${settings.collegeName}
🔑 Voting Security Code: ${securityCode}${dateLine}

Instructions:
1. Open the Voting Portal
2. Enter the Voting Security Code: ${securityCode}
3. Enter your College Roll Number to verify eligibility
4. Cast your vote securely!`;
    navigator.clipboard.writeText(shareText);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <div className="space-y-6 sm:space-y-8 select-none">
      {/* 1. TOP HEADER: Election Hero Banner with Live Controls */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors ${
                isVotingClosed
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isVotingClosed ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'
                }`}
              />
              {isVotingClosed ? 'Election Closed' : 'Live & Accepting Ballots'}
            </span>

            {securityCode && (
              <div className="inline-flex items-center gap-2 bg-[#F8FAF9] border border-slate-200 px-3 py-1 rounded-full text-xs">
                <Key className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-slate-500 font-medium">Access Code:</span>
                <span className="font-mono font-bold text-slate-900">{securityCode}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-slate-400 hover:text-emerald-700 transition-colors cursor-pointer"
                  title="Copy Access Code"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}

            {(election?.scheduledDate || settings.scheduledDate) && (
              <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200/90 px-3 py-1 rounded-full text-xs font-semibold text-amber-900">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>Scheduled: {new Date(((election?.scheduledDate || settings.scheduledDate) as string) + 'T00:00:00').toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                <span className="text-[10px] bg-amber-200/80 text-amber-950 px-1.5 py-0.5 rounded font-bold">Valid that date only</span>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {settings.electionName}
          </h1>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-700">{settings.collegeName}</span>
            <span aria-hidden="true">·</span>
            <span>Official Excel Voting Ledger</span>
            <span aria-hidden="true">·</span>
            <span>Single-Vote Guaranteed</span>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {onToggleStatus && (
            <button
              type="button"
              onClick={onToggleStatus}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                isVotingClosed
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
              title="Toggle voting open/closed"
            >
              {isVotingClosed ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              <span>{isVotingClosed ? 'Resume Voting' : 'Pause Voting'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyShareText}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-800" />
            <span>{copiedShare ? 'Invitation Copied!' : 'Share Access Code'}</span>
          </button>

          <button
            type="button"
            onClick={() => onExport('database')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white font-semibold text-xs shadow-sm transition-all cursor-pointer"
            id="download-full-excel-btn"
          >
            <Download className="w-4 h-4" />
            <span>Download Excel Database</span>
          </button>
        </div>
      </div>

      {/* 2. FOUR PRIMARY METRIC INDICATOR CARDS (Matching AllElectionsDashboard style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Registered Voters */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Registered Voters</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
            {stats.totalVoters.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Eligible students with roll numbers</p>
        </div>

        {/* Card 2: Ballots Cast */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Ballots Cast</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Vote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
            {stats.totalVotes.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Verified single-vote submissions</p>
        </div>

        {/* Card 3: Voter Turnout Rate */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Voter Turnout</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
            {stats.votingPercentage}%
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#0B3B2C] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.votingPercentage)}%` }}
            />
          </div>
        </div>

        {/* Card 4: Positions & Candidates */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Contest Positions</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
            {stats.activePositionsCount || (election?.positions?.length || 0)}
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {stats.activeCandidatesCount} running candidates
          </p>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE: 12-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        
        {/* LEFT COLUMN: Participation & Live Candidate Standings (8 cols) */}
        <div className="lg:col-span-8 space-y-6 sm:space-y-8">
          
          {/* Card A: Turnout Progress & Ledger Status */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Turnout Progress & Audit Status
                </h2>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Real-time ratio of cast ballots versus registered students awaiting verification
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Ledger Synchronized
              </span>
            </div>

            {/* Turnout Bar Visualizer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Overall Participation</span>
                <span className="font-mono font-bold text-[#0B3B2C] text-sm">
                  {stats.votedCount} of {stats.totalVoters} ({stats.votingPercentage}%)
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-xl h-4 p-0.5 overflow-hidden flex">
                <div
                  className="bg-gradient-to-r from-[#0B3B2C] to-emerald-600 h-full rounded-lg transition-all duration-700"
                  style={{ width: `${Math.min(100, stats.votingPercentage)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>0% Opened</span>
                <span>50% Target Threshold</span>
                <span>100% Full Turnout</span>
              </div>
            </div>

            {/* Dual Metrics Strip */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAF9] border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 block">Verified Ballots</span>
                <p className="text-xl font-bold font-mono text-[#0B3B2C] mt-0.5">
                  {stats.votedCount.toLocaleString()}
                </p>
                <span className="text-[11px] text-emerald-700 font-medium">Recorded in Excel</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAF9] border border-slate-200/80">
                <span className="text-[11px] font-semibold text-slate-500 block">Pending Turnout</span>
                <p className="text-xl font-bold font-mono text-slate-700 mt-0.5">
                  {stats.notVotedCount.toLocaleString()}
                </p>
                <span className="text-[11px] text-slate-400 font-medium">Awaiting Roll Login</span>
              </div>
            </div>

            {/* Three Collegiate Trust Markers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Single-Vote Locked</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Secret Ballot Protected</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Database className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Real-Time .xlsx Sync</span>
              </div>
            </div>
          </div>

          {/* Card B: Live Recharts Bar Chart Visualizer */}
          <RechartsLiveBarChart
            electionId={election?.id}
            initialData={resultsData}
            onRefreshParent={fetchElectionResults}
            title="Live Candidate Vote Oversight (Recharts)"
          />

          {/* Card C: Position Races & Detailed Tallies */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Position Races & Live Tallies
                </h2>
                <p className="text-xs text-slate-500 font-normal mt-0.5">
                  Candidate vote distributions updated with every cast ballot
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchElectionResults}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  title="Refresh tallies"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingResults ? 'animate-spin' : ''}`} />
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('results')}
                  className="text-xs font-semibold text-[#0B3B2C] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Full Analytics</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Position Cards Grid */}
            {resultsData && resultsData.positions && resultsData.positions.length > 0 ? (
              <div className="space-y-6">
                {resultsData.positions.map((pos) => {
                  return (
                    <div
                      key={pos.position}
                      className="p-5 rounded-2xl bg-[#F8FAF9] border border-slate-200/80 space-y-4"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <Award className="w-4 h-4 text-emerald-800" />
                          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                            {pos.position}
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-semibold text-slate-500">
                          {pos.totalVotes} {pos.totalVotes === 1 ? 'vote' : 'votes'} total
                        </span>
                      </div>

                      {/* Candidates List in this position */}
                      <div className="space-y-3">
                        {pos.candidates.map((cand, idx) => {
                          const isLeading =
                            pos.totalVotes > 0 &&
                            cand.voteCount > 0 &&
                            cand.isWinner;

                          return (
                            <div key={cand.candidateName} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  {/* Candidate Rank / Leading Marker */}
                                  {isLeading ? (
                                    <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center">
                                      ★
                                    </span>
                                  ) : (
                                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                  )}

                                  <span className="font-semibold text-slate-900">
                                    {cand.candidateName}
                                  </span>

                                  {cand.group && (
                                    <span className="text-[11px] text-slate-400">
                                      ({cand.group})
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 font-mono">
                                  <span className="font-bold text-slate-800">{cand.voteCount}</span>
                                  <span className="text-slate-400 text-[11px]">
                                    ({cand.votePercentage}%)
                                  </span>
                                </div>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isLeading ? 'bg-[#0B3B2C]' : 'bg-slate-400'
                                  }`}
                                  style={{ width: `${Math.min(100, cand.votePercentage)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty State when no candidates or no positions loaded */
              <div className="text-center py-10 px-4 bg-[#F8FAF9] rounded-2xl border border-dashed border-slate-300 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Election Configured & Ready for Ballots
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Student roll numbers can now authenticate with the Access Code to cast their votes.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigateTab('candidates')}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    View Nominees
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigateTab('users')}
                    className="px-4 py-2 rounded-xl bg-[#0B3B2C] text-white text-xs font-semibold hover:bg-[#07291F] transition-colors cursor-pointer"
                  >
                    Manage Voters
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Navigation & Voter Share Hub (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card C: Direct Election Management Links */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Election Management
              </h2>
              <span className="text-[11px] font-medium text-slate-400">Controls</span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => onNavigateTab('users')}
                className="w-full p-3 rounded-xl bg-[#F8FAF9] hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-200 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-[#0B3B2C] transition-colors">
                      Voter Roll Numbers
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {stats.totalVoters} authorized students
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B3B2C] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('candidates')}
                className="w-full p-3 rounded-xl bg-[#F8FAF9] hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-200 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-[#0B3B2C] flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-[#0B3B2C] transition-colors">
                      Candidates & Photos
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {stats.activeCandidatesCount} nominees across {stats.activePositionsCount} positions
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B3B2C] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('results')}
                className="w-full p-3 rounded-xl bg-[#F8FAF9] hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-200 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-[#0B3B2C] transition-colors">
                      Results & Analytics
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Exportable charts & position totals
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B3B2C] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('votes')}
                className="w-full p-3 rounded-xl bg-[#F8FAF9] hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-200 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                    <Vote className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-[#0B3B2C] transition-colors">
                      Votes Audit Log
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {stats.totalVotes} verified timestamps
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B3B2C] group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => onNavigateTab('settings')}
                className="w-full p-3 rounded-xl bg-[#F8FAF9] hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-200 text-left transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block group-hover:text-[#0B3B2C] transition-colors">
                      Election Settings
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Configure status, dates & access
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B3B2C] group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>

          {/* Card D: Voter Share Card with Security Code */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900 to-[#0B3B2C] text-white space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-emerald-300 font-bold">
                Student Voter Access
              </span>
              <Key className="w-4 h-4 text-emerald-300" />
            </div>

            <div>
              <p className="text-xs text-emerald-100/80">
                Share this voting code with students so they can access their digital ballot:
              </p>
              <div className="mt-3 p-3.5 rounded-xl bg-black/25 border border-white/10 text-center">
                <span className="font-mono text-2xl font-bold tracking-widest text-emerald-200 block">
                  {securityCode || 'ACCESS-CODE'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyShareText}
              className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-[#0B3B2C] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedShare ? 'Copied Invitation!' : 'Copy Voter Invitation'}</span>
            </button>
          </div>

          {/* Card E: Excel File Database Sync */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-700" />
                <span className="font-mono font-semibold text-slate-800">voting_database.xlsx</span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                Synced
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Every vote, voter verification, and candidate count is saved in the local Excel spreadsheet.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => onExport('database')}
                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold text-center transition-colors cursor-pointer"
              >
                Export .xlsx
              </button>
              <button
                type="button"
                onClick={() => onNavigateTab('clear')}
                className="py-1.5 px-3 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors cursor-pointer"
              >
                Reset Data
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

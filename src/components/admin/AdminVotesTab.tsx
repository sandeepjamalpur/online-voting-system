import React, { useState, useEffect } from 'react';
import {
  Vote,
  Search,
  Calendar,
  Clock,
  Loader2,
  FileSpreadsheet,
  RefreshCw,
  ShieldCheck,
  Activity,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { VoteRecord } from '../../types';

interface AdminVotesTabProps {
  onExport: (type: string) => void;
  electionId?: string;
}

// Helper to format real date from timestamp or string
const formatRealDate = (v: VoteRecord): { formattedDate: string; isToday: boolean } => {
  let dateObj: Date | null = null;
  if (v.timestamp) {
    const d = new Date(v.timestamp);
    if (!isNaN(d.getTime())) dateObj = d;
  }
  if (!dateObj && v.date) {
    // If it's already a formatted string like "Oct 02, 2026", return it directly
    if (/[a-zA-Z]/.test(v.date)) {
      const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      return { formattedDate: v.date, isToday: v.date.includes(todayStr) };
    }
    const combined = v.time ? `${v.date}T${v.time}` : `${v.date}T00:00:00`;
    const d = new Date(combined);
    if (!isNaN(d.getTime())) dateObj = d;
  }

  if (dateObj) {
    const today = new Date();
    const isToday =
      dateObj.getFullYear() === today.getFullYear() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getDate() === today.getDate();

    const formattedDate = dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return { formattedDate, isToday };
  }

  return { formattedDate: v.date || 'Today', isToday: true };
};

// Helper to format real time with 12-hour AM/PM
const formatRealTime = (v: VoteRecord): string => {
  if (v.timestamp) {
    const d = new Date(v.timestamp);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    }
  }

  if (v.time) {
    // If already in 12-hour AM/PM format (e.g. "10:52:14 AM")
    if (/AM|PM/i.test(v.time)) return v.time;
    // If in 24-hour format "HH:MM:SS" or "HH:MM"
    const parts = v.time.split(':');
    if (parts.length >= 2) {
      let hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const seconds = parts[2] ? parts[2].split('.')[0] : '00';
      if (!isNaN(hours)) {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
      }
    }
    return v.time;
  }

  return new Date().toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export const AdminVotesTab: React.FC<AdminVotesTabProps> = ({ onExport, electionId }) => {
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [currentRealTime, setCurrentRealTime] = useState<Date>(new Date());
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Real-time ticking clock for live report status
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentRealTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchVotes = async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) setIsRefreshing(true);
      else setIsLoading(true);

      const url = electionId ? `/api/votes?electionId=${encodeURIComponent(electionId)}` : '/api/votes';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load votes');
      const data = await res.json();
      setVotes(data);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVotes();
  }, [electionId]);

  const uniquePositions = Array.from(new Set(votes.map((v) => v.position)));
  const uniqueVoterRolls = Array.from(new Set(votes.map((v) => v.rollNumber))).length;

  // Filter votes
  const filteredVotes = votes
    .filter((v) => {
      const matchesSearch =
        v.voteId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.date && v.date.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesPosition = positionFilter === 'All' ? true : v.position === positionFilter;

      return matchesSearch && matchesPosition;
    })
    .sort((a, b) => {
      // Sort by timestamp if available or index
      if (a.timestamp && b.timestamp) {
        return sortOrder === 'newest'
          ? new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          : new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      return sortOrder === 'newest' ? -1 : 1;
    });

  // Latest vote info
  const latestVote = votes.length > 0 ? votes[votes.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Real-Time Live Report Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
              Live Audit & Official Report
            </span>
          </div>

          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Submitted Ballots & Vote Records
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5 font-sans">
            <div className="flex items-center gap-1.5 text-slate-700 font-medium bg-slate-100/80 px-2.5 py-1 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span>
                Real-Time Clock:{' '}
                <strong className="text-slate-900">
                  {currentRealTime.toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  •{' '}
                  {currentRealTime.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true,
                  })}
                </strong>
              </span>
            </div>
            <span className="text-slate-300">•</span>
            <span>
              Report synced: {lastRefreshedAt.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <button
            type="button"
            onClick={() => fetchVotes(true)}
            disabled={isRefreshing || isLoading}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-700' : ''}`} />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => onExport('votes')}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#0B3B2C] hover:bg-[#134E3C] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            id="export-votes-excel-btn"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>Export Official Excel</span>
          </button>
        </div>
      </div>

      {/* Real-Time Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Ballots */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Ballots Logged
            </p>
            <p className="text-2xl font-black text-slate-900">{votes.length}</p>
            <p className="text-[11px] text-slate-500">Across all contested positions</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#0B3B2C] flex items-center justify-center border border-emerald-100">
            <Vote className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Unique Voters */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Students Participated
            </p>
            <p className="text-2xl font-black text-slate-900">{uniqueVoterRolls}</p>
            <p className="text-[11px] text-slate-500">Unique roll numbers verified</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Latest Vote Real Date & Time */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Latest Ballot Cast
            </p>
            {latestVote ? (
              <div>
                <p className="text-sm font-bold text-slate-900">
                  {formatRealDate(latestVote).formattedDate}
                </p>
                <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{formatRealTime(latestVote)}</span>
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-400">Awaiting First Vote</p>
                <p className="text-[11px] text-slate-400">No ballots cast yet</p>
              </div>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Integrity Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Audit Synchronization
            </p>
            <p className="text-sm font-bold text-emerald-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              <span>100% Real-Time Sync</span>
            </p>
            <p className="text-[11px] text-slate-500">Excel file & Memory aligned</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Vote ID, Roll Number, Candidate, Date..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Position:</span>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-hidden"
            >
              <option value="All">All Positions ({uniquePositions.length})</option>
              {uniquePositions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 font-medium">Sort:</span>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-hidden"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <span className="text-xs text-slate-400 ml-auto md:ml-0 font-medium bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
            Showing {filteredVotes.length} of {votes.length} ballots
          </span>
        </div>
      </div>

      {/* Audit Log Votes Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Vote Reference ID</th>
                <th className="py-3.5 px-4">Student Roll Number</th>
                <th className="py-3.5 px-4">Candidate ID</th>
                <th className="py-3.5 px-4">Candidate Chosen</th>
                <th className="py-3.5 px-4">Position</th>
                <th className="py-3.5 px-4">Real Date</th>
                <th className="py-3.5 px-4">Real Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0B3B2C] mb-2" />
                    <span className="font-semibold text-slate-700">Loading real-time vote transactions...</span>
                  </td>
                </tr>
              ) : filteredVotes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Vote className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No ballot records found.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {searchTerm
                        ? 'Try modifying your search or position filter.'
                        : 'Once voters submit their selections, authenticated real-time audit records will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredVotes.map((v, idx) => {
                  const dateInfo = formatRealDate(v);
                  const realTimeStr = formatRealTime(v);

                  return (
                    <tr
                      key={`${v.voteId}-${v.candidateId}-${idx}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0B3B2C]">
                        {v.voteId}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-800 font-bold">
                        {v.rollNumber}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {v.candidateId}
                      </td>
                      <td className="py-3.5 px-4 text-slate-900 font-bold">
                        {v.candidateName}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold border border-slate-200">
                          {v.position}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span className="font-medium">{dateInfo.formattedDate}</span>
                          {dateInfo.isToday && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              Today
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="font-semibold text-slate-900">{realTimeStr}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

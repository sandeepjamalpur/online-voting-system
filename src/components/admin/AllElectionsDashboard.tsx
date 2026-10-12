import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  BarChart3,
  UserPlus,
  Plus,
  ArrowRight,
  ChevronDown,
  ShieldCheck,
  Search,
  ExternalLink,
  Copy,
  Check,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { AdminAccount, Election } from '../../types';

interface AllElectionsDashboardProps {
  admin: AdminAccount;
  elections: Election[];
  activeView?: 'dashboard' | 'elections';
  onNavigateView?: (view: 'dashboard' | 'elections') => void;
  onSelectElection: (election: Election, initialTab?: 'dashboard' | 'candidates' | 'users' | 'votes' | 'results' | 'settings' | 'clear') => void;
  onOpenCreateModal: () => void;
  onRefreshElections: () => Promise<void>;
  onDeleteElection: (electionId: string, electionName: string) => Promise<void>;
  onToggleStatus: (election: Election) => Promise<void>;
}

export const AllElectionsDashboard: React.FC<AllElectionsDashboardProps> = ({
  admin,
  elections,
  activeView = 'dashboard',
  onNavigateView,
  onSelectElection,
  onOpenCreateModal,
  onDeleteElection,
  onToggleStatus,
}) => {
  const [selectedElectionFilter, setSelectedElectionFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtered elections for the elections view or recent table
  const filteredElections = elections.filter((elec) => {
    const matchesSearch =
      elec.electionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      elec.securityCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (elec.collegeName && elec.collegeName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedElectionFilter === 'Active') return matchesSearch && elec.electionStatus === 'Active';
    if (selectedElectionFilter === 'Inactive') return matchesSearch && elec.electionStatus !== 'Active';
    return matchesSearch;
  });

  // Computed Metrics (strictly calculated from the admin's elections, zero by default)
  const totalVoters = elections.reduce((sum, e) => sum + (e.votersCount || 0), 0);
  const activeCount = elections.filter((e) => e.electionStatus === 'Active').length;
  const votesCast = elections.reduce((sum, e) => sum + (e.votesCount || 0), 0);
  const candidatesCount = elections.reduce((sum, e) => sum + (e.candidatesCount || 0), 0);

  // Interactive chart controls state
  const [chartElectionFilter, setChartElectionFilter] = useState('all');
  const [chartMetric, setChartMetric] = useState<'votes' | 'turnout'>('votes');
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const selectedElectionObj = elections.find((e) => e.id === chartElectionFilter);
  const targetVotes = selectedElectionObj ? (selectedElectionObj.votesCount || 0) : votesCast;
  const targetVoters = selectedElectionObj ? (selectedElectionObj.votersCount || 0) : totalVoters;
  const overallTurnout = targetVoters > 0 ? Math.round((targetVotes / targetVoters) * 100) : 0;

  // Real Election Participation Data (replacing dummy calendar months)
  const chartItems = useMemo(() => {
    if (elections.length === 0) return [];

    if (chartElectionFilter !== 'all' && selectedElectionObj) {
      // If a single election is selected, plot its contested positions
      const positions = selectedElectionObj.positions || [];
      const eTurnout = selectedElectionObj.votersCount && selectedElectionObj.votersCount > 0
        ? Math.round(((selectedElectionObj.votesCount || 0) / selectedElectionObj.votersCount) * 100)
        : 0;

      if (positions.length > 0) {
        return positions.map((pos) => ({
          id: pos,
          label: pos.length > 11 ? pos.substring(0, 9) + '…' : pos,
          fullLabel: `${pos} (${selectedElectionObj.electionName})`,
          votes: selectedElectionObj.votesCount || 0,
          turnout: eTurnout,
          subtext: selectedElectionObj.securityCode,
        }));
      }
    }

    // Default: Show all active and recent elections
    return elections.slice(0, 6).map((el) => {
      const elVotes = el.votesCount || 0;
      const elVoters = el.votersCount || 0;
      const elTurnout = elVoters > 0 ? Math.round((elVotes / elVoters) * 100) : 0;
      return {
        id: el.id,
        label: el.electionName.length > 13 ? el.electionName.substring(0, 11) + '…' : el.electionName,
        fullLabel: el.electionName,
        votes: elVotes,
        turnout: elTurnout,
        subtext: el.securityCode,
      };
    });
  }, [elections, chartElectionFilter, selectedElectionObj]);

  const maxMetricValue = useMemo(() => {
    if (chartMetric === 'turnout') return 100;
    const maxVotes = Math.max(...chartItems.map((c) => c.votes), 10);
    return Math.ceil(maxVotes / 10) * 10;
  }, [chartItems, chartMetric]);

  const chartBars = useMemo(() => {
    return chartItems.map((item) => {
      const val = chartMetric === 'votes' ? item.votes : item.turnout;
      const pct = maxMetricValue > 0 ? Math.round((val / maxMetricValue) * 100) : 0;
      return {
        ...item,
        value: val,
        height: `${Math.max(6, Math.min(100, pct))}%`,
      };
    });
  }, [chartItems, chartMetric, maxMetricValue]);

  // Dynamic Key Dates based on real elections
  const keyDates = elections.length > 0 ? [
    { date: elections[0].createdAt ? new Date(elections[0].createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today', label: 'Election Created', color: 'bg-emerald-500' },
    { date: elections[0].endDate || 'Ongoing', label: 'Polls Scheduled', color: 'bg-amber-500' },
    { date: 'Live Session', label: 'Real-time Ballot Reception', color: 'bg-[#0B3B2C]' },
    { date: 'Certified Close', label: 'Audited Results & Export', color: 'bg-slate-400' },
  ] : [];

  const handleCopyCode = (code: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // IF activeView is 'elections', render dedicated Elections management page
  if (activeView === 'elections') {
    return (
      <div className="space-y-6 select-none">
        {/* TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Elections
              </h1>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {elections.length} Total
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Manage all collegiate elections, voter codes, and ballot configurations
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Election</span>
          </button>
        </div>

        {/* SEARCH AND STATUS FILTERS */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            {(['All', 'Active', 'Inactive'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedElectionFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedElectionFilter === filter
                    ? 'bg-[#0B3B2C] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* ELECTIONS TABLE */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-medium pb-2">
                  <th className="py-3 px-3 font-semibold">Election Details</th>
                  <th className="py-3 px-3 font-semibold">Voter Access Code</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                  <th className="py-3 px-3 font-semibold">End Date</th>
                  <th className="py-3 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredElections.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      <p className="font-semibold text-sm">No elections found</p>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or filter.</p>
                    </td>
                  </tr>
                ) : (
                  filteredElections.map((elec) => (
                    <tr
                      key={elec.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3.5 px-3">
                        <span className="font-semibold text-slate-900 block text-sm">
                          {elec.electionName}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {elec.collegeName}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            {elec.securityCode}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyCode(elec.securityCode, elec.id, e)}
                            className="p-0.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            title="Copy Code"
                          >
                            {copiedId === elec.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <button
                          type="button"
                          onClick={() => onToggleStatus(elec)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                            elec.electionStatus === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                          title="Click to toggle status"
                        >
                          {elec.electionStatus}
                        </button>
                      </td>

                      <td className="py-3.5 px-3">
                        {elec.scheduledDate ? (
                          <div className="space-y-0.5">
                            <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-amber-600" />
                              {new Date(elec.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-[10px] text-amber-700 block font-semibold">
                              Valid that date only
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-600 text-xs">
                            {elec.endDate || (elec.createdAt ? new Date(elec.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Ongoing')}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectElection(elec)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0B3B2C] hover:bg-[#07291F] text-white font-semibold text-xs transition-colors cursor-pointer"
                          >
                            <span>Manage</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteElection(elec.id, elec.electionName)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete Election"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 select-none">
      
      {/* TOP HEADER: Dashboard / Overview of your voting system + Create New Election (Matching Mockup Screen 6) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
            Overview of your voting system
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Election</span>
        </button>
      </div>

      {/* 4 STAT CARDS (Matching Mockup Screen 6) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Total Voters (Green icon) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Total Voters
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
            {totalVoters.toLocaleString()}
          </div>
        </div>

        {/* Card 2: Active Elections (Yellow icon) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Active Elections
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
            {activeCount}
          </div>
        </div>

        {/* Card 3: Votes Cast (Blue icon) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Votes Cast
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
            {votesCast.toLocaleString()}
          </div>
        </div>

        {/* Card 4: New Candidates (Purple icon) */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500">
              New Candidates
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono tracking-tight">
            {candidatesCount}
          </div>
        </div>
      </div>

      {/* MIDDLE ROW: Participation Overview & Key Dates (Matching Mockup Screen 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Participation Overview Chart (Left 8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-6 flex flex-col justify-between">
          {/* Header Area with Live Badge & Interactive Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                  Participation Overview
                </h2>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                {votesCast === 0
                  ? '0 votes recorded yet. Turnout trends will plot here as voting begins.'
                  : 'Turnout trends & verified ballot activity across election cycles'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Segmented Control: Votes vs Turnout */}
              <div className="inline-flex p-0.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setChartMetric('votes')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartMetric === 'votes'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Votes
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('turnout')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    chartMetric === 'turnout'
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Turnout %
                </button>
              </div>

              {/* Functional Election Dropdown */}
              <div className="relative">
                <select
                  value={chartElectionFilter}
                  onChange={(e) => setChartElectionFilter(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[160px] truncate"
                  title="Filter by Election"
                >
                  <option value="all">All Elections</option>
                  {elections.map((el) => (
                    <option key={el.id} value={el.id}>
                      {el.electionName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Bar Chart Visualization with Hover Tooltips */}
          <div className="space-y-4">
            {chartBars.length === 0 ? (
              <div className="h-52 flex flex-col items-center justify-center text-center p-6 bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
                <BarChart3 className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-xs font-bold text-slate-700">No Elections Created Yet</p>
                <p className="text-[11px] text-slate-500 max-w-xs mt-0.5">
                  Participation and turnout by election will display here once an election is created.
                </p>
                <button
                  type="button"
                  onClick={onOpenCreateModal}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0B3B2C] hover:bg-[#07291F] text-white text-xs font-semibold cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Election</span>
                </button>
              </div>
            ) : (
              <div className="h-52 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-100 relative">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between h-full text-[10px] font-mono text-slate-400 pr-2 shrink-0 select-none">
                  <span>{chartMetric === 'votes' ? maxMetricValue : '100%'}</span>
                  <span>{chartMetric === 'votes' ? Math.round(maxMetricValue * 0.75) : '75%'}</span>
                  <span>{chartMetric === 'votes' ? Math.round(maxMetricValue * 0.5) : '50%'}</span>
                  <span>{chartMetric === 'votes' ? Math.round(maxMetricValue * 0.25) : '25%'}</span>
                  <span>0</span>
                </div>

                {/* Bars with dynamic interactive hover tooltips */}
                <div className="flex-1 flex items-end justify-around h-full gap-2 sm:gap-4 relative">
                  {chartBars.map((bar, idx) => {
                    const isHovered = hoveredBarIndex === idx;
                    return (
                      <div
                        key={bar.id}
                        onMouseEnter={() => setHoveredBarIndex(idx)}
                        onMouseLeave={() => setHoveredBarIndex(null)}
                        className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative"
                      >
                        {/* Floating Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-12 z-20 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-medium shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
                            <span className="font-bold">{bar.fullLabel}: </span>
                            <span className="font-mono">
                              {chartMetric === 'votes' ? `${bar.votes} votes` : `${bar.turnout}% turnout`}
                            </span>
                            {bar.subtext && (
                              <span className="text-[10px] text-emerald-300 ml-1.5 font-mono">({bar.subtext})</span>
                            )}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                          </div>
                        )}

                        {/* Bar Fill */}
                        <div
                          className={`w-full max-w-[44px] rounded-t-lg transition-all duration-300 relative ${
                            isHovered
                              ? 'bg-gradient-to-t from-[#0B3B2C] to-[#10B981] shadow-md shadow-emerald-900/20 scale-y-[1.02]'
                              : 'bg-gradient-to-t from-[#134E3C] to-[#2D6A4F] hover:to-[#10B981]'
                          }`}
                          style={{ height: bar.height }}
                        >
                          {/* Top highlight cap */}
                          <div className="w-full h-1 bg-emerald-400/40 rounded-t-lg" />
                        </div>

                        {/* X-axis Election / Position Label */}
                        <span
                          className={`text-[11px] font-semibold transition-colors truncate max-w-[64px] text-center ${
                            isHovered ? 'text-emerald-800 font-bold' : 'text-slate-500'
                          }`}
                          title={bar.fullLabel}
                        >
                          {bar.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Dates (Right 4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
          <h2 className="text-sm font-bold text-slate-900">
            Key Dates
          </h2>

          <div className="space-y-4">
            {keyDates.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No scheduled dates</p>
                <p className="text-[11px] text-slate-400 mt-1">Timeline milestones will appear when you create an election.</p>
              </div>
            ) : (
              keyDates.map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color} mt-1.5 shrink-0`} />
                  <div>
                    <div className="text-xs font-bold text-slate-900 font-mono">
                      {item.date}
                    </div>
                    <div className="text-xs text-slate-500 font-medium">
                      {item.label}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* BOTTOM SECTION: Recent Elections Table (Matching Mockup Screen 6) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Recent Elections
          </h2>
          <button
            type="button"
            onClick={() => onNavigateView?.('elections')}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Table matching mockup columns: Election Name, Status, End Date, Actions */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium pb-2">
                <th className="py-3 px-3 font-semibold">Election Name</th>
                <th className="py-3 px-3 font-semibold">Status</th>
                <th className="py-3 px-3 font-semibold">End Date</th>
                <th className="py-3 px-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {elections.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-xs text-slate-600">No elections created yet</p>
                    <p className="text-[11px] text-slate-400 mt-1">Click "Create New Election" above to configure your first ballot.</p>
                  </td>
                </tr>
              ) : (
                elections.map((elec) => (
                  <tr
                    key={elec.id}
                    onClick={() => onSelectElection(elec)}
                    className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                  <td className="py-3.5 px-3">
                    <span className="font-semibold text-slate-900 block">
                      {elec.electionName}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Code: {elec.securityCode}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        elec.electionStatus === 'Active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {elec.electionStatus}
                    </span>
                  </td>

                  <td className="py-3.5 px-3">
                    {elec.scheduledDate ? (
                      <div className="space-y-0.5">
                        <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-amber-600" />
                          {new Date(elec.scheduledDate + 'T00:00:00').toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-amber-700 block font-semibold">
                          Valid that date only
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-slate-600 text-xs">
                        {elec.endDate || (elec.createdAt ? new Date(elec.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Ongoing')}
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectElection(elec);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#0B3B2C] font-semibold text-xs transition-colors cursor-pointer"
                    >
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

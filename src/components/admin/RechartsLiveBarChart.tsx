import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import {
  BarChart3,
  RefreshCw,
  Trophy,
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { ResultsData, PositionResult, PositionCandidateResult } from '../../types';

interface RechartsLiveBarChartProps {
  electionId?: string;
  initialData?: ResultsData | null;
  onRefreshParent?: () => void;
  title?: string;
  compact?: boolean;
}

interface ChartItem {
  id: string;
  candidateName: string;
  shortName: string;
  position: string;
  group: string;
  voteCount: number;
  votePercentage: number;
  isWinner: boolean;
  color: string;
}

const COLOR_PALETTE = [
  '#0B3B2C', // Deep Emerald
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
];

export const RechartsLiveBarChart: React.FC<RechartsLiveBarChartProps> = ({
  electionId,
  initialData,
  onRefreshParent,
  title = 'Live Candidate Vote Distribution',
  compact = false,
}) => {
  const [data, setData] = useState<ResultsData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [sortBy, setSortBy] = useState<'votes' | 'name'>('votes');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState<number>(5);
  const [secondsUntilNext, setSecondsUntilNext] = useState<number>(refreshIntervalSec);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync with initialData if provided from parent
  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLastUpdated(new Date());
    }
  }, [initialData]);

  // Fetch live tallies from backend
  const fetchLiveResults = async (silent = true) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);

      const url = electionId
        ? `/api/results?electionId=${encodeURIComponent(electionId)}`
        : '/api/results';
      const res = await fetch(url);
      if (res.ok) {
        const freshData: ResultsData = await res.json();
        setData(freshData);
        setLastUpdated(new Date());
        if (onRefreshParent) onRefreshParent();
      }
    } catch (err) {
      console.error('Error polling live results:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setSecondsUntilNext(refreshIntervalSec);
    }
  };

  // Initial load if no initialData
  useEffect(() => {
    if (!initialData) {
      fetchLiveResults(false);
    }
  }, [electionId]);

  // Real-time polling countdown and execution
  useEffect(() => {
    if (!autoRefresh) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setSecondsUntilNext(refreshIntervalSec);

    timerRef.current = setInterval(() => {
      setSecondsUntilNext((prev) => {
        if (prev <= 1) {
          fetchLiveResults(true);
          return refreshIntervalSec;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, refreshIntervalSec, electionId]);

  // Extract all available positions
  const positions: string[] = useMemo(() => {
    if (!data?.positions) return [];
    return data.positions.map((p) => p.position);
  }, [data]);

  // Transform data for recharts
  const chartData: ChartItem[] = useMemo(() => {
    if (!data?.positions || data.positions.length === 0) return [];

    let items: ChartItem[] = [];

    data.positions.forEach((pos: PositionResult, posIdx: number) => {
      if (selectedPosition !== 'all' && pos.position !== selectedPosition) {
        return;
      }

      pos.candidates.forEach((cand: PositionCandidateResult, candIdx: number) => {
        const color = COLOR_PALETTE[(posIdx * 3 + candIdx) % COLOR_PALETTE.length];
        const shortName =
          cand.candidateName.length > 14
            ? cand.candidateName.slice(0, 12) + '…'
            : cand.candidateName;

        items.push({
          id: `${pos.position}-${cand.candidateId || cand.candidateName}`,
          candidateName: cand.candidateName,
          shortName,
          position: pos.position,
          group: cand.group || 'Independent',
          voteCount: cand.voteCount || 0,
          votePercentage: cand.votePercentage || 0,
          isWinner: cand.isWinner,
          color,
        });
      });
    });

    if (sortBy === 'votes') {
      items.sort((a, b) => b.voteCount - a.voteCount);
    } else {
      items.sort((a, b) => a.candidateName.localeCompare(b.candidateName));
    }

    return items;
  }, [data, selectedPosition, sortBy]);

  // Metrics for instant oversight
  const metrics = useMemo(() => {
    const totalVotesInView = chartData.reduce((acc, curr) => acc + curr.voteCount, 0);
    const sortedByVotes = [...chartData].sort((a, b) => b.voteCount - a.voteCount);
    const leader = sortedByVotes[0] && sortedByVotes[0].voteCount > 0 ? sortedByVotes[0] : null;
    const runnerUp = sortedByVotes[1] || null;
    const margin = leader && runnerUp ? leader.voteCount - runnerUp.voteCount : leader ? leader.voteCount : 0;

    return {
      totalVotesInView,
      leader,
      runnerUp,
      margin,
      candidateCount: chartData.length,
    };
  }, [chartData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: ChartItem = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-xl p-3.5 shadow-xl border border-slate-700/80 min-w-[210px] space-y-2 pointer-events-none z-50">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <p className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                {item.candidateName}
                {item.isWinner && item.voteCount > 0 && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-0.5 font-semibold">
                    <Trophy className="w-2.5 h-2.5" /> Leading
                  </span>
                )}
              </p>
              <p className="text-[11px] text-emerald-400 font-medium">{item.position}</p>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {item.group}
            </span>
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <span>Votes Cast:</span>
              <span className="font-bold text-base text-white">{item.voteCount}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Vote Share:</span>
              <span className="font-semibold text-emerald-400">{item.votePercentage}%</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-300">
      {/* Header bar */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-emerald-50/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#0B3B2C]/10 text-[#0B3B2C]">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              {title}
            </h3>

            {/* Live Indicator Pill */}
            {autoRefresh ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                LIVE SYNC ({secondsUntilNext}s)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                Paused
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time candidate vote share powered by Recharts • Last sync:{' '}
            <span className="font-mono font-medium text-slate-700">
              {lastUpdated.toLocaleTimeString()}
            </span>
          </p>
        </div>

        {/* Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Position Selector */}
          {positions.length > 0 && (
            <div className="relative">
              <select
                aria-label="Filter by election position"
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B3B2C]/20 cursor-pointer shadow-2xs"
              >
                <option value="all">All Positions ({positions.length})</option>
                {positions.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Orientation Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setOrientation('vertical')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                orientation === 'vertical'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Vertical Bars"
            >
              Columns
            </button>
            <button
              type="button"
              onClick={() => setOrientation('horizontal')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                orientation === 'horizontal'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Horizontal Bars"
            >
              Rows
            </button>
          </div>

          {/* Sort Toggle */}
          <button
            type="button"
            onClick={() => setSortBy(sortBy === 'votes' ? 'name' : 'votes')}
            className="text-xs font-medium px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
            title="Toggle sort order"
          >
            <SlidersHorizontal className="w-3 h-3 text-slate-500" />
            <span>{sortBy === 'votes' ? 'By Votes' : 'A-Z'}</span>
          </button>

          {/* Auto Refresh Toggle */}
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs font-semibold px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer inline-flex items-center gap-1 ${
              autoRefresh
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title={autoRefresh ? 'Click to pause auto-polling' : 'Click to resume auto-polling'}
          >
            <Activity className={`w-3 h-3 ${autoRefresh ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span>{autoRefresh ? 'Auto' : 'Off'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            type="button"
            onClick={() => fetchLiveResults(false)}
            disabled={isRefreshing || isLoading}
            className="p-1.5 bg-[#0B3B2C] hover:bg-[#08291F] text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
            title="Refresh chart immediately"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing || isLoading ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Oversight Quick KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-slate-50/60 border-b border-slate-100 text-xs">
        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-medium">Votes In View</span>
          <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
            {metrics.totalVotesInView}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-medium">Current Leader</span>
          <span className="text-xs font-bold text-[#0B3B2C] mt-0.5 truncate block">
            {metrics.leader ? metrics.leader.candidateName : 'No votes yet'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-medium">Lead Margin</span>
          <span className="text-base font-bold font-mono text-emerald-700 mt-0.5 block">
            {metrics.leader ? `+${metrics.margin} votes` : '—'}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] text-slate-500 block font-medium">Active Candidates</span>
          <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">
            {metrics.candidateCount}
          </span>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="p-5">
        {chartData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-2">
            <Layers className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
            <p className="text-sm font-medium text-slate-600">No candidate voting data found</p>
            <p className="text-xs text-slate-400">
              As soon as students cast their ballots, live counts will animate into this chart.
            </p>
          </div>
        ) : (
          <div
            className={`w-full ${
              orientation === 'horizontal' ? 'h-[380px]' : compact ? 'h-[280px]' : 'h-[360px]'
            }`}
          >
            <ResponsiveContainer width="100%" height="100%">
              {orientation === 'vertical' ? (
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: -10, bottom: 45 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis
                    dataKey="candidateName"
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    stroke="#94A3B8"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'monospace' }}
                    stroke="#94A3B8"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="voteCount"
                    radius={[6, 6, 0, 0]}
                    animationDuration={600}
                    animationEasing="ease-out"
                  >
                    {chartData.map((entry, index) => {
                      const isLeading = entry.isWinner && entry.voteCount > 0;
                      return (
                        <Cell
                          key={`cell-${entry.id || index}`}
                          fill={isLeading ? '#0B3B2C' : entry.color}
                          opacity={isLeading ? 1 : 0.85}
                          stroke={isLeading ? '#05231A' : 'transparent'}
                          strokeWidth={isLeading ? 2 : 0}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748B', fontFamily: 'monospace' }}
                    stroke="#94A3B8"
                  />
                  <YAxis
                    type="category"
                    dataKey="candidateName"
                    tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                    width={110}
                    stroke="#94A3B8"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="voteCount"
                    radius={[0, 6, 6, 0]}
                    animationDuration={600}
                    animationEasing="ease-out"
                  >
                    {chartData.map((entry, index) => {
                      const isLeading = entry.isWinner && entry.voteCount > 0;
                      return (
                        <Cell
                          key={`cell-h-${entry.id || index}`}
                          fill={isLeading ? '#0B3B2C' : entry.color}
                          opacity={isLeading ? 1 : 0.85}
                        />
                      );
                    })}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend and Candidate Pills */}
        {chartData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Candidates:
              </span>
              {chartData.slice(0, 6).map((c) => (
                <div key={c.id} className="flex items-center gap-1.5 text-slate-700">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-2xs"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="font-medium text-slate-800">{c.candidateName}</span>
                  <span className="font-mono text-slate-400 text-[11px]">({c.voteCount})</span>
                </div>
              ))}
              {chartData.length > 6 && (
                <span className="text-slate-400 text-[11px]">
                  +{chartData.length - 6} more candidates
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <Trophy className="w-3 h-3 text-emerald-600" /> Leading Candidate
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

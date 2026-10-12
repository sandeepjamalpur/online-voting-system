import React, { useState, useEffect } from 'react';
import {
  Trophy,
  BarChart3,
  PieChart,
  Download,
  Loader2,
  RefreshCw,
  Vote,
  LayoutGrid,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { ResultsData } from '../../types';
import { DoughnutChartComponent, BarChartComponent } from '../ChartComponent';
import { RechartsLiveBarChart } from './RechartsLiveBarChart';

interface AdminResultsTabProps {
  onExport: (type: string) => void;
  electionId?: string;
}

type ChartDisplayMode = 'both' | 'bar' | 'doughnut';

export const AdminResultsTab: React.FC<AdminResultsTabProps> = ({ onExport, electionId }) => {
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayMode, setDisplayMode] = useState<ChartDisplayMode>('both');

  const fetchResults = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      else setIsRefreshing(true);
      const url = electionId ? `/api/results?electionId=${encodeURIComponent(electionId)}` : '/api/results';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load results');
      const data = await res.json();
      setResultsData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [electionId]);

  const palette = ['#0B3B2C', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

  const getInitials = (name: string) => {
    const clean = name.trim();
    if (!clean) return 'C';
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Overall position totals for aggregate comparison bar chart
  const overallPositionLabels = resultsData?.positions.map((p) => p.position) || [];
  const overallPositionVotes = resultsData?.positions.map((p) => p.totalVotes) || [];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Live Chart.js Visualizations
            </span>
            <span className="text-xs text-slate-400">• Real-Time Excel Tabulation</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">Election Results & Analytics</h2>
          <p className="text-xs text-slate-500">
            Real-time candidate vote share and volume distributions visualized via Bar and Doughnut charts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Chart Display Mode Selector */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDisplayMode('both')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'both' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Bar & Doughnut</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('bar')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'bar' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Bar Only</span>
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode('doughnut')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                displayMode === 'doughnut' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Doughnut Only</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => fetchResults(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Refresh Results"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => onExport('results')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B3B2C] hover:bg-[#07291F] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            id="export-results-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Results (.xlsx)</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-700 mb-2" />
          <p className="text-sm font-semibold">Tabulating votes and rendering Chart.js distributions...</p>
        </div>
      ) : !resultsData || resultsData.positions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
          <p className="text-sm font-semibold">No positions or votes recorded yet.</p>
        </div>
      ) : (
        <>
          {/* RECHARTS LIVE CANDIDATE OVERSIGHT BAR CHART */}
          <RechartsLiveBarChart
            electionId={electionId}
            initialData={resultsData}
            onRefreshParent={() => fetchResults(true)}
            title="Real-Time Candidate Vote Oversight (Recharts)"
          />

          {/* OVERALL POSITION COMPARISON BAR CHART BANNER */}
          {overallPositionLabels.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0B3B2C]">
                    Aggregate Election Overview
                  </span>
                  <h3 className="text-lg font-bold text-slate-900">
                    Total Ballots Cast Across All Positions
                  </h3>
                </div>
                <div className="text-xs text-slate-500 font-medium bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  Total Ballots Recorded: <strong className="text-slate-900">{resultsData.totalVotesRecorded}</strong>
                </div>
              </div>

              <div className="h-64 w-full">
                <BarChartComponent
                  labels={overallPositionLabels}
                  data={overallPositionVotes}
                  datasetLabel="Total Votes Cast"
                  colors={['#10b981', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']}
                  title="Position Voter Turnout Comparison"
                />
              </div>
            </div>
          )}

          {/* PER-POSITION DETAILED RESULTS & CHARTS */}
          <div className="space-y-8">
            {resultsData.positions.map((pos) => {
              const chartLabels = pos.candidates.map((c) => c.candidateName);
              const chartData = pos.candidates.map((c) => c.voteCount);

              return (
                <div
                  key={pos.position}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6"
                >
                  {/* Position Title Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Position / Office
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-900 uppercase">
                        {pos.position}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-1.5 text-right">
                        <span className="text-xs font-bold text-[#0B3B2C] block">
                          Total Votes: {pos.totalVotes}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Main Section: Candidate Cards + Visual Chart.js Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Candidate Vote Share Cards (5 or 6 cols depending on display mode) */}
                    <div className={displayMode === 'both' ? 'lg:col-span-4 space-y-3' : 'lg:col-span-6 space-y-3'}>
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                        Candidate Tallies
                      </span>

                      {pos.candidates.map((cand, rank) => {
                        return (
                          <div
                            key={cand.candidateId}
                            className={`p-3.5 rounded-xl border transition-all ${
                              cand.isWinner && pos.totalVotes > 0
                                ? 'bg-amber-50/60 border-amber-300 shadow-xs ring-1 ring-amber-400/30'
                                : 'bg-slate-50/70 border-slate-200'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 mb-2">
                              <div className="flex items-center gap-2.5">
                                <span
                                  className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                                    cand.isWinner && pos.totalVotes > 0
                                      ? 'bg-amber-500 text-white shadow-2xs'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {rank + 1}
                                </span>

                                {cand.imagePath ? (
                                  <img
                                    src={cand.imagePath}
                                    alt={cand.candidateName}
                                    className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-200 shadow-2xs"
                                    onError={(e) => {
                                      (e.target as HTMLElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#0B3B2C] font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-200 shadow-2xs">
                                    {getInitials(cand.candidateName)}
                                  </div>
                                )}

                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                                      {cand.candidateName}
                                    </h4>
                                    {cand.isWinner && pos.totalVotes > 0 && (
                                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                        <Trophy className="w-2.5 h-2.5 text-amber-600" /> Leading
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 font-medium">
                                    {cand.candidateId} • {cand.group}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-sm font-extrabold text-slate-900 block">
                                  {cand.voteCount} <span className="text-[10px] font-medium text-slate-500">votes</span>
                                </span>
                                <span className="text-xs font-bold text-[#0B3B2C] font-mono">
                                  {cand.votePercentage}%
                                </span>
                              </div>
                            </div>

                            {/* Vote Share Bar */}
                            <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                              <div
                                className={`h-1.5 rounded-full transition-all duration-500 ${
                                  cand.isWinner && pos.totalVotes > 0
                                    ? 'bg-amber-500'
                                    : 'bg-[#0B3B2C]'
                                }`}
                                style={{ width: `${Math.max(2, cand.votePercentage)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* CHARTS CONTAINER (8 cols if both, 6 cols if single) */}
                    <div className={displayMode === 'both' ? 'lg:col-span-8' : 'lg:col-span-6'}>
                      <div className={`grid gap-4 ${displayMode === 'both' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                        {/* 1. BAR CHART */}
                        {(displayMode === 'both' || displayMode === 'bar') && (
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <BarChart3 className="w-4 h-4 text-emerald-700" />
                                <span>Vote Count Comparison</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Bar Chart</span>
                            </div>

                            <BarChartComponent
                              labels={chartLabels}
                              data={chartData}
                              colors={palette}
                              datasetLabel="Votes Received"
                            />
                          </div>
                        )}

                        {/* 2. DOUGHNUT CHART */}
                        {(displayMode === 'both' || displayMode === 'doughnut') && (
                          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                                <PieChart className="w-4 h-4 text-emerald-600" />
                                <span>Vote Share Distribution</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">Doughnut Chart</span>
                            </div>

                            <DoughnutChartComponent
                              labels={chartLabels}
                              data={chartData}
                              colors={palette}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};

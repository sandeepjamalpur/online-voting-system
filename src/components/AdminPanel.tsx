import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Award,
  Vote,
  BarChart3,
  Settings,
  AlertTriangle,
  ArrowLeft,
  Menu,
  X,
  Download,
  Loader2,
  Building,
  ShieldCheck,
  Plus,
  Key,
  Copy,
  ChevronDown,
  Layers,
  LogOut,
  Trash2,
  Bell,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react';
import { AdminAccount, AdminStats, Election, ElectionSettings } from '../types';
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { VoteEaseLogo } from './VoteEaseLogo';
import { AdminAuth } from './admin/AdminAuth';
import { AllElectionsDashboard } from './admin/AllElectionsDashboard';
import { CreateElectionModal } from './admin/CreateElectionModal';
import { AdminDashboardOverview } from './admin/AdminDashboardOverview';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminCandidatesTab } from './admin/AdminCandidatesTab';
import { AdminVotesTab } from './admin/AdminVotesTab';
import { AdminResultsTab } from './admin/AdminResultsTab';
import { AdminSettingsTab } from './admin/AdminSettingsTab';
import { AdminClearTab } from './admin/AdminClearTab';

interface AdminPanelProps {
  onBackToHome: () => void;
  settings: ElectionSettings;
  onRefreshSettings: () => Promise<void>;
}

type AdminViewMode = 'all_elections' | 'elections' | 'manage_election';
type AdminTab = 'dashboard' | 'users' | 'candidates' | 'votes' | 'results' | 'settings' | 'clear';

const ADMIN_SESSION_KEY = 'college_election_admin_session';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onBackToHome,
  settings,
  onRefreshSettings,
}) => {
  // Admin Session State
  const [admin, setAdmin] = useState<AdminAccount | null>(() => {
    try {
      const stored = localStorage.getItem(ADMIN_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.collegeName === 'ACE Engineering College') {
          parsed.collegeName = '';
          try {
            localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(parsed));
          } catch {}
        }
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Multi-Election State
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [viewMode, setViewMode] = useState<AdminViewMode>('all_elections');
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // In-app Delete Election Confirmation State
  const [electionToDelete, setElectionToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingElection, setIsDeletingElection] = useState(false);

  // Stats for the active election
  const [stats, setStats] = useState<AdminStats>({
    totalVoters: 0,
    totalVotes: 0,
    votedCount: 0,
    notVotedCount: 0,
    votingPercentage: 0,
    activePositionsCount: 0,
    activeCandidatesCount: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Save session to localStorage
  const handleLoginSuccess = (account: AdminAccount) => {
    setAdmin(account);
    try {
      localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(account));
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setAdmin(null);
    setSelectedElection(null);
    setViewMode('all_elections');
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch all elections for this admin
  const fetchElections = async () => {
    if (!admin) return;
    try {
      const res = await fetch(`/api/admin/elections?adminId=${encodeURIComponent(admin.id)}`);
      let electionList: Election[] = [];
      if (res.ok) {
        const data = await res.json();
        electionList = Array.isArray(data) ? data : data.elections || [];
      }

      // If backend returned empty list or had issue, query Firestore cloud database directly
      if (electionList.length === 0) {
        try {
          const snap = await getDocs(collection(db, 'elections'));
          if (!snap.empty) {
            const fsList = snap.docs.map((d) => d.data() as Election);
            electionList = fsList.filter((e) => !admin.id || e.adminId === admin.id || admin.id === 'admin_1');
          }
        } catch (fsErr) {
          console.warn('[Firestore] Could not load elections from Firestore:', fsErr);
        }
      }

      setElections(electionList);

      // If an election is currently selected, refresh its details
      if (selectedElection) {
        const updated = electionList.find((e: Election) => e.id === selectedElection.id);
        if (updated) setSelectedElection(updated);
      }
    } catch (err) {
      console.warn('API fetch elections failed, falling back to Firestore...', err);
      try {
        const snap = await getDocs(collection(db, 'elections'));
        if (!snap.empty) {
          const fsList = snap.docs.map((d) => d.data() as Election);
          const filtered = fsList.filter((e) => !admin.id || e.adminId === admin.id || admin.id === 'admin_1');
          setElections(filtered);
        }
      } catch (fsErr) {
        console.error('Failed to fetch elections from Firestore:', fsErr);
      }
    }
  };

  useEffect(() => {
    if (admin) {
      fetchElections();
    }
  }, [admin?.id]);

  // Fetch stats for the selected election
  const fetchStats = async () => {
    if (!selectedElection) return;
    try {
      setIsLoadingStats(true);
      const res = await fetch(`/api/stats?electionId=${encodeURIComponent(selectedElection.id)}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (selectedElection && viewMode === 'manage_election') {
      fetchStats();
    }
  }, [selectedElection?.id, currentTab, viewMode]);

  // Handle select election to manage
  const handleSelectElection = (election: Election, initialTab: AdminTab = 'dashboard') => {
    setSelectedElection(election);
    setViewMode('manage_election');
    setCurrentTab(initialTab);
  };

  // Handle newly created election
  const handleElectionCreated = (newElection: Election) => {
    setElections((prev) => [newElection, ...prev]);
    setSelectedElection(newElection);
    setViewMode('manage_election');
    setCurrentTab('dashboard');
  };

  // Handle toggle election status
  const handleToggleElectionStatus = async (election: Election) => {
    try {
      const res = await fetch(`/api/admin/elections/${election.id}/toggle-status`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setElections((prev) =>
          prev.map((e) => (e.id === election.id ? { ...e, electionStatus: data.electionStatus } : e))
        );
        if (selectedElection?.id === election.id) {
          setSelectedElection((prev) =>
            prev ? { ...prev, electionStatus: data.electionStatus } : null
          );
        }
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  // Handle initiate delete election
  const handleInitiateDeleteElection = async (electionId: string, electionName: string) => {
    setElectionToDelete({ id: electionId, name: electionName });
  };

  // Confirm delete election
  const handleConfirmDeleteElection = async () => {
    if (!electionToDelete) return;
    setIsDeletingElection(true);

    try {
      const res = await fetch(`/api/admin/elections/${electionToDelete.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setElections((prev) => prev.filter((e) => e.id !== electionToDelete.id));
        if (selectedElection?.id === electionToDelete.id) {
          setSelectedElection(null);
          setViewMode('all_elections');
        }
        setElectionToDelete(null);
      }
    } catch (err) {
      console.error('Failed to delete election', err);
    } finally {
      setIsDeletingElection(false);
    }
  };

  const handleExport = (type: string) => {
    const electionParam = selectedElection ? `?electionId=${encodeURIComponent(selectedElection.id)}` : '';
    window.location.href = `/api/export/${type}${electionParam}`;
  };

  const handleUpdateSettings = async (newSettings: Partial<ElectionSettings>) => {
    const electionParam = selectedElection ? `?electionId=${encodeURIComponent(selectedElection.id)}` : '';
    const res = await fetch(`/api/settings${electionParam}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newSettings, electionId: selectedElection?.id }),
    });
    if (!res.ok) throw new Error('Failed to update settings');
    await onRefreshSettings();
    await fetchStats();
    await fetchElections();
  };

  const handleCopyCode = () => {
    if (!selectedElection) return;
    navigator.clipboard.writeText(selectedElection.securityCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // 1. IF NOT LOGGED IN, RENDER ADMIN AUTH (Registration / Login)
  if (!admin) {
    return <AdminAuth onLoginSuccess={handleLoginSuccess} onBackToHome={onBackToHome} />;
  }

  // Navigation Items for active election
  const navItems = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users' as AdminTab, label: 'Users / Voters', icon: Users },
    { id: 'candidates' as AdminTab, label: 'Candidates', icon: Award },
    { id: 'votes' as AdminTab, label: 'Votes Log', icon: Vote },
    { id: 'results' as AdminTab, label: 'Results', icon: BarChart3 },
    { id: 'settings' as AdminTab, label: 'Settings', icon: Settings },
    { id: 'clear' as AdminTab, label: 'Clear System', icon: AlertTriangle, danger: true },
  ];

  // Active election settings proxy for components
  const activeSettings: ElectionSettings = {
    collegeName: selectedElection?.collegeName || admin.collegeName,
    electionName: selectedElection?.electionName || 'Student Election',
    electionStatus: selectedElection?.electionStatus || 'Active',
    securityCode: selectedElection?.securityCode || '',
    positions: selectedElection?.positions || [],
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col md:flex-row select-none">
      {/* SIDEBAR (Desktop: Dark Forest Green #0B3B2C matching Mockup Screen 6) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0B3B2C] text-slate-200 border-r border-[#07291F] shrink-0 select-none justify-between">
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-emerald-900/40">
            <VoteEaseLogo size="sm" inverted />
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <button
              type="button"
              onClick={() => {
                setViewMode('all_elections');
                setCurrentTab('dashboard');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'all_elections'
                  ? 'bg-[#134E3C] text-white shadow-xs'
                  : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('elections');
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'elections'
                  ? 'bg-[#134E3C] text-white shadow-xs'
                  : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span>Elections</span>
              <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded font-mono">
                {elections.length}
              </span>
            </button>

            {viewMode === 'manage_election' && selectedElection && (
              <>
                <div className="pt-2 pb-1 px-3 text-[10px] font-bold text-emerald-300/70 uppercase tracking-wider">
                  Active Election
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentTab === 'dashboard'
                      ? 'bg-[#134E3C] text-white shadow-xs'
                      : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('users')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentTab === 'users'
                      ? 'bg-[#134E3C] text-white shadow-xs'
                      : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Voters</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('candidates')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentTab === 'candidates'
                      ? 'bg-[#134E3C] text-white shadow-xs'
                      : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Award className="w-4 h-4 shrink-0" />
                  <span>Candidates</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('results')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentTab === 'results'
                      ? 'bg-[#134E3C] text-white shadow-xs'
                      : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>Results</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('votes')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentTab === 'votes'
                      ? 'bg-[#134E3C] text-white shadow-xs'
                      : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Vote className="w-4 h-4 shrink-0" />
                  <span>Reports</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentTab('settings')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentTab === 'settings'
                      ? 'bg-[#134E3C] text-white shadow-xs'
                      : 'text-emerald-100/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Settings</span>
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Sidebar Footer (Matching Mockup: Fair Elections / Stronger Communities) */}
        <div className="p-6 border-t border-emerald-900/40 space-y-3">
          <div className="text-[11px] text-emerald-200/60 leading-relaxed font-sans">
            <p className="font-semibold text-emerald-200/80">Fair Elections</p>
            <p>Stronger Communities</p>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onBackToHome}
              className="flex-1 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] text-white font-medium text-center transition-colors cursor-pointer"
            >
              Public Home
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="py-1.5 px-3 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-[11px] text-rose-200 font-medium text-center transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* MOBILE HEADER BAR */}
      <div className="md:hidden bg-[#0B3B2C] text-white p-4 flex items-center justify-between border-b border-[#07291F]">
        <div className="flex items-center gap-2">
          <VoteEaseLogo size="xs" inverted showText={false} />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
            {viewMode === 'manage_election' && selectedElection
              ? selectedElection.electionName
              : 'Admin Control'}
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-white/10 text-white cursor-pointer"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0B3B2C] border-b border-[#07291F] p-4 space-y-2">
          <button
            onClick={() => {
              setViewMode('all_elections');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
              viewMode === 'all_elections' ? 'bg-[#134E3C] text-white' : 'text-emerald-100/80 hover:bg-white/10'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              setViewMode('elections');
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
              viewMode === 'elections' ? 'bg-[#134E3C] text-white' : 'text-emerald-100/80 hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>All Elections ({elections.length})</span>
          </button>

          <button
            onClick={() => {
              setIsCreateModalOpen(true);
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 text-white"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Election</span>
          </button>

          {viewMode === 'manage_election' && selectedElection && (
            <div className="pt-2 border-t border-emerald-900/60 space-y-1">
              <div className="text-[10px] text-emerald-300 font-bold px-3">
                {selectedElection.electionName} Tabs:
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                      isActive
                        ? 'bg-[#134E3C] text-white shadow-xs'
                        : item.danger
                        ? 'text-rose-300'
                        : 'text-emerald-100/80 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="pt-2 border-t border-emerald-900/60 flex gap-2">
            <button
              onClick={onBackToHome}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-200 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Home</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-rose-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN ADMIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAF9] text-slate-900">
        {/* TOP BAR: Notification Bell + Admin Profile */}
        <header className="h-16 border-b px-6 sm:px-8 flex items-center justify-between shrink-0 bg-white/90 backdrop-blur-md border-slate-200/80 text-slate-900 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">
              {admin.collegeName || 'Campus Administration'}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-bold text-[#0B3B2C]">
              {selectedElection ? selectedElection.electionName : 'All Elections'}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <button
              type="button"
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>

            {/* Admin Profile & Logout */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-100 text-[#0B3B2C] border border-emerald-200">
                {admin.fullName ? admin.fullName.slice(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="text-xs hidden sm:block">
                <span className="font-semibold block text-slate-900">
                  Welcome, {admin.fullName ? admin.fullName.split(' ')[0] : 'Admin'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer font-medium ml-1"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {/* VIEW 1: ALL ELECTIONS / DASHBOARD */}
        {(viewMode === 'all_elections' || viewMode === 'elections') && (
          <AllElectionsDashboard
            admin={admin}
            elections={elections}
            activeView={viewMode === 'elections' ? 'elections' : 'dashboard'}
            onNavigateView={(mode) => setViewMode(mode === 'dashboard' ? 'all_elections' : 'elections')}
            onSelectElection={handleSelectElection}
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onRefreshElections={fetchElections}
            onDeleteElection={handleInitiateDeleteElection}
            onToggleStatus={handleToggleElectionStatus}
          />
        )}

        {/* VIEW 2: MANAGE SPECIFIC ELECTION */}
        {viewMode === 'manage_election' && selectedElection && (
          <div className="space-y-6">
            {/* TOP NAVIGATION BREADCRUMB & ELECTION SWITCHER */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setViewMode('all_elections')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>All Elections</span>
                  </button>

                  <div className="h-5 w-px bg-slate-200" />

                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                      {selectedElection.electionName}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        selectedElection.electionStatus === 'Closed'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          selectedElection.electionStatus === 'Closed'
                            ? 'bg-rose-500'
                            : 'bg-emerald-500 animate-pulse'
                        }`}
                      />
                      {selectedElection.electionStatus}
                    </span>
                  </div>
                </div>

                {/* SECURITY CODE BADGE & SWITCHER */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Voting Security Code Pill */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-950 shadow-2xs">
                    <Key className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">Access Code:</span>
                    <span className="font-mono text-xs font-bold text-emerald-950 tracking-wider">{selectedElection.securityCode}</span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-800 transition-colors cursor-pointer"
                      title="Copy Voting Security Code"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copiedCode && <span className="text-[10px] text-emerald-700 font-bold ml-1">Copied!</span>}
                  </div>

                  {/* Switch Election Dropdown */}
                  {elections.length > 1 && (
                    <select
                      value={selectedElection.id}
                      onChange={(e) => {
                        const found = elections.find((el) => el.id === e.target.value);
                        if (found) setSelectedElection(found);
                      }}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0B3B2C] cursor-pointer shadow-2xs"
                    >
                      {elections.map((el) => (
                        <option key={el.id} value={el.id}>
                          {el.electionName} ({el.securityCode})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* HORIZONTAL IN-PAGE TAB BAR (Seamless switching matching website) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-slate-100 pb-0.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCurrentTab(item.id)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0B3B2C] text-white shadow-xs'
                          : item.danger
                          ? 'text-rose-600 hover:bg-rose-50'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB CONTENTS (All scoped with electionId) */}
            {currentTab === 'dashboard' && (
              <AdminDashboardOverview
                stats={stats}
                settings={activeSettings}
                election={selectedElection}
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onExport={handleExport}
                onToggleStatus={() => handleToggleElectionStatus(selectedElection)}
                onBackToAllElections={() => setViewMode('all_elections')}
              />
            )}

            {currentTab === 'users' && (
              <AdminUsersTab
                onExport={handleExport}
                electionId={selectedElection.id}
              />
            )}

            {currentTab === 'candidates' && (
              <AdminCandidatesTab
                onExport={handleExport}
                electionId={selectedElection.id}
                electionPositions={selectedElection.positions}
              />
            )}

            {currentTab === 'votes' && (
              <AdminVotesTab
                onExport={handleExport}
                electionId={selectedElection.id}
              />
            )}

            {currentTab === 'results' && (
              <AdminResultsTab
                onExport={handleExport}
                electionId={selectedElection.id}
              />
            )}

            {currentTab === 'settings' && (
              <AdminSettingsTab
                settings={activeSettings}
                onUpdateSettings={handleUpdateSettings}
              />
            )}

            {currentTab === 'clear' && (
              <AdminClearTab
                electionId={selectedElection.id}
                onResetComplete={async () => {
                  await fetchStats();
                  await fetchElections();
                  await onRefreshSettings();
                }}
              />
            )}
          </div>
        )}
      </main>
      </div>

      {/* CREATE ELECTION MODAL */}
      {isCreateModalOpen && admin && (
        <CreateElectionModal
          isOpen={isCreateModalOpen}
          admin={admin}
          onClose={() => setIsCreateModalOpen(false)}
          onElectionCreated={handleElectionCreated}
          onGoToAllElections={() => {
            setIsCreateModalOpen(false);
            setViewMode('all_elections');
          }}
        />
      )}

      {/* CONFIRM DELETE ELECTION MODAL */}
      {electionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Delete Entire Election?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to permanently delete{' '}
                <span className="font-bold text-slate-800">{electionToDelete.name}</span>?
              </p>
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                This will permanently delete this voting system, including its voter roll, candidates, and cast ballots.
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setElectionToDelete(null)}
                disabled={isDeletingElection}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteElection}
                disabled={isDeletingElection}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeletingElection ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete Election</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

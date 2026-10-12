import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { RollNumberPage } from './components/RollNumberPage';
import { VotingPage } from './components/VotingPage';
import { SuccessPage } from './components/SuccessPage';
import { AdminPanel } from './components/AdminPanel';
import { HowItWorksPage } from './components/HowItWorksPage';
import { AppView, ElectionSettings } from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [activeElection, setActiveElection] = useState<any>(null);
  const [selectedSecurityCode, setSelectedSecurityCode] = useState<string>('');
  const [activeStudent, setActiveStudent] = useState<{ rollNumber: string; studentName: string } | null>(null);
  const [voteReceipt, setVoteReceipt] = useState<{
    voteReferenceId: string;
    date: string;
    time: string;
    electionName?: string;
    collegeName?: string;
    securityCode?: string;
    rollNumber?: string;
    selections?: { position: string; candidateName: string }[];
  } | null>(null);

  const [settings, setSettings] = useState<ElectionSettings>({
    collegeName: '',
    electionName: 'Student Council Elections 2026',
    electionStatus: 'Active',
  });
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSelectUser = (securityCode?: string) => {
    setSelectedSecurityCode(securityCode || '');
    setCurrentView('user_roll');
  };

  const handleSelectAdmin = () => {
    setCurrentView('admin');
  };

  const handleValidRollNumber = (
    student: { rollNumber: string; studentName: string },
    election: any
  ) => {
    setActiveStudent(student);
    setActiveElection(election);
    setCurrentView('voting');
  };

  const handleVoteSuccess = (receipt: {
    voteReferenceId: string;
    date: string;
    time: string;
    electionName?: string;
    collegeName?: string;
    securityCode?: string;
    rollNumber?: string;
    selections?: { position: string; candidateName: string }[];
  }) => {
    setVoteReceipt(receipt);
    setCurrentView('success');
  };

  const handleReturnHome = () => {
    setActiveStudent(null);
    setActiveElection(null);
    setCurrentView('home');
  };

  if (isLoadingSettings) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-700 mx-auto" />
          <p className="text-sm font-semibold text-slate-700">Connecting to Excel Voting Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-950">
      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={(view) => {
          if (view === 'home') handleReturnHome();
          else setCurrentView(view);
        }}
        settings={settings}
      />

      {/* Main View Router */}
      <div className="flex-1 flex flex-col">
        {currentView === 'home' && (
          <HomePage
            onSelectUser={handleSelectUser}
            onSelectAdmin={handleSelectAdmin}
            onSelectHowItWorks={() => setCurrentView('how_it_works')}
            settings={settings}
          />
        )}

        {currentView === 'how_it_works' && (
          <HowItWorksPage
            onSelectUser={handleSelectUser}
            onSelectAdmin={handleSelectAdmin}
            onBackToHome={handleReturnHome}
            settings={settings}
          />
        )}

        {currentView === 'user_roll' && (
          <RollNumberPage
            onBackToHome={handleReturnHome}
            onValidRollNumber={handleValidRollNumber}
            initialSecurityCode={selectedSecurityCode}
          />
        )}

        {currentView === 'voting' && activeStudent && (
          <VotingPage
            student={activeStudent}
            election={activeElection}
            settings={settings}
            onVoteSuccess={handleVoteSuccess}
            onCancel={handleReturnHome}
          />
        )}

        {currentView === 'success' && voteReceipt && (
          <SuccessPage
            voteReferenceId={voteReceipt.voteReferenceId}
            date={voteReceipt.date}
            time={voteReceipt.time}
            electionName={voteReceipt.electionName}
            collegeName={voteReceipt.collegeName}
            securityCode={voteReceipt.securityCode}
            rollNumber={voteReceipt.rollNumber || activeStudent?.rollNumber}
            selections={voteReceipt.selections}
            onReturnHome={handleReturnHome}
            settings={settings}
          />
        )}

        {currentView === 'admin' && (
          <AdminPanel
            onBackToHome={handleReturnHome}
            settings={settings}
            onRefreshSettings={fetchSettings}
          />
        )}
      </div>
    </div>
  );
}

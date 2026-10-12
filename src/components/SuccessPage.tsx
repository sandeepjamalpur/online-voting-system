import React, { useState } from 'react';
import { Copy, Check, ArrowRight } from 'lucide-react';
import { ElectionSettings } from '../types';
import { CelebrationHornIllustration } from './Illustrations';
import { VoteEaseLogo } from './VoteEaseLogo';

interface SuccessPageProps {
  voteReferenceId: string;
  date: string;
  time: string;
  electionName?: string;
  collegeName?: string;
  securityCode?: string;
  rollNumber?: string;
  selections?: { position: string; candidateName: string }[];
  onReturnHome: () => void;
  onVoteAnother?: () => void;
  settings?: ElectionSettings;
}

export const SuccessPage: React.FC<SuccessPageProps> = ({
  voteReferenceId,
  electionName,
  collegeName,
  onReturnHome,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(voteReferenceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#F8FAF9] flex items-center justify-center p-6 select-none">
      {/* CARD: Matching Mockup Screen 5 */}
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/90 shadow-xl text-center space-y-6">
        
        {/* Top Header Logo */}
        <div className="flex justify-center">
          <VoteEaseLogo size="sm" />
        </div>

        {/* Celebration Horn Icon Badge (Matching Mockup Screen 5) */}
        <div className="w-20 h-20 mx-auto flex items-center justify-center">
          <CelebrationHornIllustration className="w-20 h-20 drop-shadow-sm" />
        </div>

        {/* Heading & Subtitle */}
        <div className="space-y-2">
          {electionName && (
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200/80 text-xs font-bold">
              {electionName}
            </span>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Thank You!
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed">
            Your vote has been submitted successfully.<br />
            Together for a better tomorrow.
          </p>
        </div>

        {/* Transaction Reference ID Box (Matching Mockup Screen 5) */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-left">
          <span className="text-xs text-slate-500 font-medium">
            Transaction Reference ID
          </span>

          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-900 tracking-wider">
              {voteReferenceId}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              title="Copy Transaction Reference ID"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Action Button: Return to Home (Matching Mockup Screen 5) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onReturnHome}
            className="w-full py-3.5 px-6 rounded-full bg-[#0B3B2C] hover:bg-[#07291F] text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
          >
            Return to Home
          </button>
        </div>

      </div>
    </div>
  );
};

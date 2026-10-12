export interface AdminAccount {
  id: string;
  fullName: string;
  collegeName: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface Election {
  id: string;
  adminId: string;
  electionName: string;
  collegeName: string;
  securityCode: string;
  positions: string[];
  electionStatus: 'Active' | 'Closed';
  createdAt: string;
  description?: string;
  votersCount?: number;
  votesCount?: number;
  candidatesCount?: number;
  turnoutPercentage?: number;
  endDate?: string;
  scheduledDate?: string;
}

export interface User {
  rollNumber: string;
  studentName: string;
  status: 'Active' | 'Inactive';
  hasVoted: 'Yes' | 'No';
  votedAt?: string;
  electionId?: string;
}

export interface Candidate {
  candidateId: string;
  candidateName: string;
  position: string;
  group: string;
  imagePath: string;
  status: 'Active' | 'Inactive';
  electionId?: string;
}

export interface VoteRecord {
  voteId: string;
  rollNumber: string;
  candidateId: string;
  candidateName: string;
  position: string;
  date: string;
  time: string;
  timestamp?: string;
  electionId?: string;
}

export interface PositionCandidateResult {
  candidateId: string;
  candidateName: string;
  group: string;
  imagePath: string;
  voteCount: number;
  votePercentage: number;
  isWinner: boolean;
}

export interface PositionResult {
  position: string;
  totalVotes: number;
  candidates: PositionCandidateResult[];
}

export interface ResultsData {
  positions: PositionResult[];
  totalVotesRecorded: number;
}

export interface ElectionSettings {
  collegeName: string;
  electionName: string;
  electionStatus: 'Active' | 'Closed';
  securityCode?: string;
  electionId?: string;
  positions?: string[];
  description?: string;
  voterAvatar?: string;
  adminAvatar?: string;
  operationMode?: 'live' | 'sandbox' | 'kiosk';
  themeMode?: 'light' | 'dark' | 'system';
  resultsMode?: 'live' | 'sealed';
  scheduledDate?: string;
}

export interface AdminStats {
  totalVoters: number;
  totalVotes: number;
  votedCount: number;
  notVotedCount: number;
  votingPercentage: number;
  activePositionsCount: number;
  activeCandidatesCount: number;
}

export interface PositionVotingData {
  positionName: string;
  candidates: Candidate[];
}

export interface VoteReceipt {
  voteReferenceId: string;
  date: string;
  time: string;
  electionName: string;
  collegeName: string;
  securityCode: string;
  rollNumber: string;
  studentName?: string;
  selections?: { position: string; candidateName: string }[];
}

export type AppView = 'home' | 'user_roll' | 'voting' | 'success' | 'admin' | 'how_it_works';
export type AdminTab = 'dashboard' | 'users' | 'candidates' | 'votes' | 'results' | 'settings' | 'clear';


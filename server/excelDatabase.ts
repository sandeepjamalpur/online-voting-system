import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import {
  syncElectionToFirestore,
  deleteElectionFromFirestore,
  syncCandidateToFirestore,
  deleteCandidateFromFirestore,
  syncVoterToFirestore,
  deleteVoterFromFirestore,
  clearAllVotersFromFirestore,
  syncVoteToFirestore,
  syncSettingsToFirestore,
} from './firebaseSync';

const DB_JSON_PATH = path.resolve(process.cwd(), 'voting_system_data.json');
const DB_XLSX_PATH = path.resolve(process.cwd(), 'voting_database.xlsx');

export interface AdminRecord {
  id: string;
  fullName: string;
  collegeName: string;
  username: string;
  email: string;
  password: string; // Plain/hashed for session auth
  createdAt: string;
}

export interface ElectionRecord {
  id: string;
  adminId: string;
  electionName: string;
  collegeName: string;
  securityCode: string;
  positions: string[];
  electionStatus: 'Active' | 'Closed';
  createdAt: string;
  description?: string;
  operationMode?: 'live' | 'sandbox' | 'kiosk';
  themeMode?: 'light' | 'dark' | 'system';
  resultsMode?: 'live' | 'sealed';
  scheduledDate?: string;
}

export interface UserRow {
  rollNumber: string;
  studentName: string;
  status: 'Active' | 'Inactive';
  hasVoted: 'Yes' | 'No';
  votedAt?: string;
  electionId: string;
}

export interface CandidateRow {
  candidateId: string;
  candidateName: string;
  position: string;
  group: string;
  imagePath: string;
  status: 'Active' | 'Inactive';
  electionId: string;
}

export interface VoteRow {
  voteId: string;
  rollNumber: string;
  candidateId: string;
  candidateName: string;
  position: string;
  date: string;
  time: string;
  timestamp?: string;
  electionId: string;
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

export interface DatabaseState {
  admins: AdminRecord[];
  elections: ElectionRecord[];
  users: UserRow[];
  candidates: CandidateRow[];
  votes: VoteRow[];
  customAvatars?: {
    voterAvatar?: string;
    adminAvatar?: string;
  };
}

// In-memory state cache with disk persistence
let dbState: DatabaseState = {
  admins: [],
  elections: [],
  users: [],
  candidates: [],
  votes: [],
};

let lockPromise = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const next = lockPromise.then(fn, fn);
  lockPromise = next.then(() => {}, () => {});
  return next;
}

// Seed data
function createDefaultSeed(): DatabaseState {
  const defaultAdmin: AdminRecord = {
    id: 'admin_1',
    fullName: 'Prof. Sandeep Jamalpur',
    collegeName: '',
    username: 'admin',
    email: 'jamalpursandeep41@gmail.com',
    password: 'admin', // Simple default for effortless initial login
    createdAt: new Date().toISOString(),
  };

  const elections: ElectionRecord[] = [
    {
      id: 'elec_student_council',
      adminId: 'admin_1',
      electionName: 'Student Council Election 2026',
      collegeName: '',
      securityCode: 'VOTE-SC2026',
      positions: ['President', 'Vice President', 'Secretary', 'Joint Secretary'],
      electionStatus: 'Active',
      createdAt: new Date().toISOString(),
      description: 'Official annual student council leadership election for the academic year 2026.',
    },
  ];

  return {
    admins: [defaultAdmin],
    elections,
    users: [],
    candidates: [],
    votes: [],
  };
}

export class ExcelDatabase {
  public static async init(): Promise<void> {
    return withLock(async () => {
      try {
        if (fs.existsSync(DB_JSON_PATH)) {
          const raw = fs.readFileSync(DB_JSON_PATH, 'utf-8');
          dbState = JSON.parse(raw);
          // If structure is completely missing admins or elections, initialize default seed
          if (!Array.isArray(dbState.admins) || !Array.isArray(dbState.elections)) {
            dbState = createDefaultSeed();
            ExcelDatabase.saveSync();
          }
          if (!Array.isArray(dbState.users)) dbState.users = [];
          if (!Array.isArray(dbState.candidates)) dbState.candidates = [];
          if (!Array.isArray(dbState.votes)) dbState.votes = [];
        } else {
          dbState = createDefaultSeed();
          ExcelDatabase.saveSync();
        }
        // Also ensure Excel database is written
        await ExcelDatabase.exportAllToExcelFile();
      } catch (err) {
        console.error('Error initializing database, using seed:', err);
        dbState = createDefaultSeed();
        ExcelDatabase.saveSync();
      }
    });
  }

  private static saveSync(): void {
    try {
      fs.writeFileSync(DB_JSON_PATH, JSON.stringify(dbState, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to JSON:', err);
    }
  }

  public static getDatabaseFilePath(): string {
    return DB_XLSX_PATH;
  }

  // ================= ADMIN AUTH =================

  public static async getAdminById(id: string): Promise<AdminRecord | null> {
    return dbState.admins.find((a) => a.id === id) || null;
  }

  public static async getAdminByUsernameOrEmail(identifier: string): Promise<AdminRecord | null> {
    const idf = identifier.trim().toLowerCase();
    return (
      dbState.admins.find(
        (a) => a.username.toLowerCase() === idf || a.email.toLowerCase() === idf
      ) || null
    );
  }

  public static async registerAdmin(data: {
    fullName: string;
    collegeName: string;
    username: string;
    email: string;
    password: string;
  }): Promise<AdminRecord> {
    return withLock(async () => {
      const u = data.username.trim();
      const e = data.email.trim();
      const existing = await ExcelDatabase.getAdminByUsernameOrEmail(u) || await ExcelDatabase.getAdminByUsernameOrEmail(e);
      if (existing) {
        throw new Error('An administrator with this username or email already exists.');
      }

      const newAdmin: AdminRecord = {
        id: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        fullName: data.fullName.trim(),
        collegeName: data.collegeName.trim(),
        username: u,
        email: e,
        password: data.password, // In real apps use bcrypt; plain/token for simple session in prototype
        createdAt: new Date().toISOString(),
      };

      dbState.admins.push(newAdmin);
      ExcelDatabase.saveSync();
      return newAdmin;
    });
  }

  public static async authenticateAdmin(usernameOrEmail: string, password: string): Promise<AdminRecord> {
    const admin = await ExcelDatabase.getAdminByUsernameOrEmail(usernameOrEmail);
    if (!admin) {
      throw new Error('No administrator found with that username or email.');
    }
    if (admin.password !== password) {
      throw new Error('Incorrect password. Please try again.');
    }
    return admin;
  }

  // ================= ELECTION MANAGEMENT =================

  public static generateUniqueSecurityCode(electionName = 'VOTE'): string {
    // Generate clean alphanumeric security code, e.g. VOTE-74892 or BR-3921
    const prefix = electionName
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 4)
      .toUpperCase() || 'VOTE';
    
    let code = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 100) {
      attempts++;
      const randNum = Math.floor(10000 + Math.random() * 90000);
      code = `${prefix}-${randNum}`;
      const found = dbState.elections.some((e) => e.securityCode.toUpperCase() === code.toUpperCase());
      if (!found) isUnique = true;
    }
    return code;
  }

  public static async getElections(adminId?: string): Promise<ElectionRecord[]> {
    let list = dbState.elections;
    if (adminId) {
      list = list.filter((e) => e.adminId === adminId);
    }
    return list;
  }

  public static async getElectionById(electionId: string): Promise<ElectionRecord | null> {
    return dbState.elections.find((e) => e.id === electionId) || null;
  }

  public static async getElectionBySecurityCode(code: string): Promise<ElectionRecord | null> {
    const cleanCode = code.trim().toUpperCase();
    return (
      dbState.elections.find(
        (e) => e.securityCode.trim().toUpperCase() === cleanCode
      ) || null
    );
  }

  public static async createElection(data: {
    adminId: string;
    electionName: string;
    collegeName: string;
    positions: string[];
    securityCode?: string;
    description?: string;
    candidates?: Array<{ candidateName: string; position: string; group?: string; imagePath?: string }>;
    eligibleRollNumbers?: Array<{ rollNumber: string; studentName?: string }>;
    scheduledDate?: string;
  }): Promise<ElectionRecord> {
    return withLock(async () => {
      const electionId = `elec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const securityCode = data.securityCode?.trim().toUpperCase() || ExcelDatabase.generateUniqueSecurityCode(data.electionName);

      // Verify code uniqueness
      const existingCode = dbState.elections.find((e) => e.securityCode.toUpperCase() === securityCode);
      if (existingCode) {
        throw new Error(`Security code "${securityCode}" is already in use by another election. Please generate a unique code.`);
      }

      const cleanPositions = Array.from(new Set(data.positions.map((p) => p.trim()).filter(Boolean)));
      if (cleanPositions.length === 0) {
        throw new Error('At least one position must be specified for the election.');
      }

      const newElection: ElectionRecord = {
        id: electionId,
        adminId: data.adminId,
        electionName: data.electionName.trim(),
        collegeName: data.collegeName.trim(),
        securityCode,
        positions: cleanPositions,
        electionStatus: 'Active',
        createdAt: new Date().toISOString(),
        description: data.description?.trim() || `Election for ${data.electionName.trim()}`,
        scheduledDate: data.scheduledDate ? data.scheduledDate.trim() : undefined,
      };

      dbState.elections.push(newElection);

      // Add initial candidates if provided (serial numbers restart at 1 for each specific position)
      if (data.candidates && data.candidates.length > 0) {
        const positionSerialCounters: Record<string, number> = {};
        for (const c of data.candidates) {
          if (!c.candidateName.trim() || !c.position.trim()) continue;
          const pos = c.position.trim();
          positionSerialCounters[pos] = (positionSerialCounters[pos] || 0) + 1;
          const posNum = positionSerialCounters[pos];
          const posPrefix = pos.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'CAN';
          dbState.candidates.push({
            candidateId: `${posPrefix}-${String(posNum).padStart(2, '0')}`,
            candidateName: c.candidateName.trim(),
            position: pos,
            group: c.group?.trim() || 'Independent',
            imagePath: c.imagePath?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            status: 'Active',
            electionId,
          });
        }
      }

      // Add initial eligible voters if provided
      if (data.eligibleRollNumbers && data.eligibleRollNumbers.length > 0) {
        for (const v of data.eligibleRollNumbers) {
          const r = v.rollNumber.trim().toUpperCase();
          if (!r) continue;
          // check duplicate within this election
          if (!dbState.users.some((u) => u.electionId === electionId && u.rollNumber.toUpperCase() === r)) {
            dbState.users.push({
              rollNumber: r,
              studentName: v.studentName?.trim() || `Student ${r}`,
              status: 'Active',
              hasVoted: 'No',
              electionId,
            });
          }
        }
      }

      ExcelDatabase.saveSync();
      syncElectionToFirestore(newElection);
      if (data.candidates && data.candidates.length > 0) {
        dbState.candidates
          .filter((c) => c.electionId === newElection.id)
          .forEach((c) => syncCandidateToFirestore(newElection.id, c));
      }
      if (data.eligibleRollNumbers && data.eligibleRollNumbers.length > 0) {
        dbState.users
          .filter((u) => u.electionId === newElection.id)
          .forEach((u) => syncVoterToFirestore(newElection.id, u));
      }
      return newElection;
    });
  }

  public static async updateElection(
    electionId: string,
    updates: Partial<ElectionRecord>
  ): Promise<ElectionRecord> {
    return withLock(async () => {
      const idx = dbState.elections.findIndex((e) => e.id === electionId);
      if (idx === -1) throw new Error('Election not found');

      if (updates.securityCode) {
        const clean = updates.securityCode.trim().toUpperCase();
        const conflict = dbState.elections.find(
          (e) => e.id !== electionId && e.securityCode.toUpperCase() === clean
        );
        if (conflict) {
          throw new Error(`Security code "${clean}" is already assigned to another election.`);
        }
        updates.securityCode = clean;
      }

      if (updates.positions && Array.isArray(updates.positions)) {
        const cleanPositions = Array.from(
          new Set(updates.positions.map((p) => p.trim()).filter(Boolean))
        );
        if (cleanPositions.length === 0) {
          throw new Error('Election must have at least one position.');
        }
        updates.positions = cleanPositions;
      }

      dbState.elections[idx] = {
        ...dbState.elections[idx],
        ...updates,
      };

      ExcelDatabase.saveSync();
      syncElectionToFirestore(dbState.elections[idx]);
      return dbState.elections[idx];
    });
  }

  public static async deleteElection(electionId: string): Promise<void> {
    return withLock(async () => {
      dbState.elections = dbState.elections.filter((e) => e.id !== electionId);
      dbState.users = dbState.users.filter((u) => u.electionId !== electionId);
      dbState.candidates = dbState.candidates.filter((c) => c.electionId !== electionId);
      dbState.votes = dbState.votes.filter((v) => v.electionId !== electionId);
      ExcelDatabase.saveSync();
      await deleteElectionFromFirestore(electionId);
    });
  }

  // Helper to resolve targeted election (defaults to first election if not specified)
  private static resolveElectionId(electionId?: string): string {
    if (electionId && dbState.elections.some((e) => e.id === electionId)) {
      return electionId;
    }
    return dbState.elections[0]?.id || 'default';
  }

  // ================= SETTINGS (Backward Compatible) =================

  public static async getSettings(electionId?: string): Promise<{
    collegeName: string;
    electionName: string;
    electionStatus: 'Active' | 'Closed';
    securityCode?: string;
    electionId: string;
    positions: string[];
    voterAvatar: string;
    adminAvatar: string;
    operationMode?: 'live' | 'sandbox' | 'kiosk';
    themeMode?: 'light' | 'dark' | 'system';
    resultsMode?: 'live' | 'sealed';
    scheduledDate?: string;
  }> {
    const eId = ExcelDatabase.resolveElectionId(electionId);
    const election = dbState.elections.find((e) => e.id === eId) || dbState.elections[0];
    const voterAvatar = dbState.customAvatars?.voterAvatar || '/avatars/voter_avatar.png';
    const adminAvatar = dbState.customAvatars?.adminAvatar || '/avatars/admin_avatar.png';

    if (!election) {
      return {
        collegeName: '',
        electionName: 'College Student Elections',
        electionStatus: 'Active',
        securityCode: 'VOTE-2026',
        electionId: 'default',
        positions: [],
        voterAvatar,
        adminAvatar,
        operationMode: 'live',
        themeMode: 'light',
        resultsMode: 'live',
      };
    }
    return {
      collegeName: election.collegeName,
      electionName: election.electionName,
      electionStatus: election.electionStatus,
      securityCode: election.securityCode,
      electionId: election.id,
      positions: election.positions || [],
      voterAvatar,
      adminAvatar,
      operationMode: election.operationMode || 'live',
      themeMode: election.themeMode || 'light',
      resultsMode: election.resultsMode || 'live',
      scheduledDate: election.scheduledDate,
    };
  }

  public static async updateSettings(updates: {
    collegeName?: string;
    electionName?: string;
    electionStatus?: 'Active' | 'Closed';
    electionId?: string;
    positions?: string[];
    voterAvatar?: string;
    adminAvatar?: string;
    operationMode?: 'live' | 'sandbox' | 'kiosk';
    themeMode?: 'light' | 'dark' | 'system';
    resultsMode?: 'live' | 'sealed';
    scheduledDate?: string;
  }): Promise<any> {
    if (updates.voterAvatar !== undefined || updates.adminAvatar !== undefined) {
      if (!dbState.customAvatars) {
        dbState.customAvatars = {};
      }
      if (updates.voterAvatar !== undefined) {
        dbState.customAvatars.voterAvatar = updates.voterAvatar;
      }
      if (updates.adminAvatar !== undefined) {
        dbState.customAvatars.adminAvatar = updates.adminAvatar;
      }
      ExcelDatabase.saveSync();
    }

    let eId = ExcelDatabase.resolveElectionId(updates.electionId);
    let election = dbState.elections.find((e) => e.id === eId);
    if (!election) {
      if (dbState.elections.length === 0) {
        election = await ExcelDatabase.createElection({
          adminId: 'admin_1',
          electionName: updates.electionName || 'College Student Elections',
          collegeName: updates.collegeName || 'ACE Engineering College',
          positions: updates.positions || [],
          securityCode: 'VOTE-2026',
        });
        eId = election.id;
      }
    }

    const updated = await ExcelDatabase.updateElection(eId, {
      ...(updates.collegeName ? { collegeName: updates.collegeName } : {}),
      ...(updates.electionName ? { electionName: updates.electionName } : {}),
      ...(updates.electionStatus ? { electionStatus: updates.electionStatus } : {}),
      ...(updates.positions ? { positions: updates.positions } : {}),
      ...(updates.operationMode ? { operationMode: updates.operationMode } : {}),
      ...(updates.themeMode ? { themeMode: updates.themeMode } : {}),
      ...(updates.resultsMode ? { resultsMode: updates.resultsMode } : {}),
      ...(updates.scheduledDate !== undefined ? { scheduledDate: updates.scheduledDate } : {}),
    });
    const result = {
      collegeName: updated.collegeName,
      electionName: updated.electionName,
      electionStatus: updated.electionStatus,
      securityCode: updated.securityCode,
      electionId: updated.id,
      positions: updated.positions || [],
      voterAvatar: dbState.customAvatars?.voterAvatar || '/avatars/voter_avatar.png',
      adminAvatar: dbState.customAvatars?.adminAvatar || '/avatars/admin_avatar.png',
      operationMode: updated.operationMode || 'live',
      themeMode: updated.themeMode || 'light',
      resultsMode: updated.resultsMode || 'live',
      scheduledDate: updated.scheduledDate,
    };
    syncSettingsToFirestore(result);
    return result;
  }

  // ================= USERS / ELIGIBLE VOTERS =================

  public static async getUsers(electionId?: string): Promise<UserRow[]> {
    const eId = ExcelDatabase.resolveElectionId(electionId);
    return dbState.users.filter((u) => u.electionId === eId);
  }

  public static async getUserByRollNumber(rollNumber: string, electionId?: string): Promise<UserRow | null> {
    const eId = ExcelDatabase.resolveElectionId(electionId);
    const cleanRoll = rollNumber.trim().toUpperCase();
    return dbState.users.find((u) => u.electionId === eId && u.rollNumber.toUpperCase() === cleanRoll) || null;
  }

  public static async addUser(user: { rollNumber: string; studentName?: string; status?: 'Active' | 'Inactive'; electionId?: string }): Promise<UserRow> {
    return withLock(async () => {
      const eId = ExcelDatabase.resolveElectionId(user.electionId);
      const cleanRoll = user.rollNumber.trim().toUpperCase();
      if (!cleanRoll) throw new Error('Roll number is required');

      const existing = dbState.users.find((u) => u.electionId === eId && u.rollNumber.toUpperCase() === cleanRoll);
      if (existing) {
        throw new Error(`Roll number "${cleanRoll}" is already registered for this election.`);
      }

      const newUser: UserRow = {
        rollNumber: cleanRoll,
        studentName: user.studentName?.trim() || `Student ${cleanRoll}`,
        status: user.status || 'Active',
        hasVoted: 'No',
        electionId: eId,
      };

      dbState.users.push(newUser);
      ExcelDatabase.saveSync();
      syncVoterToFirestore(eId, newUser);
      return newUser;
    });
  }

  public static async updateUser(rollNumber: string, updates: Partial<UserRow>, electionId?: string): Promise<UserRow> {
    return withLock(async () => {
      const eId = ExcelDatabase.resolveElectionId(electionId);
      const cleanRoll = rollNumber.trim().toUpperCase();
      const idx = dbState.users.findIndex((u) => u.electionId === eId && u.rollNumber.toUpperCase() === cleanRoll);
      if (idx === -1) throw new Error(`User with roll number ${cleanRoll} not found in this election`);

      dbState.users[idx] = {
        ...dbState.users[idx],
        ...updates,
      };

      ExcelDatabase.saveSync();
      syncVoterToFirestore(eId, dbState.users[idx]);
      return dbState.users[idx];
    });
  }

  public static async deleteUser(rollNumber: string, electionId?: string): Promise<void> {
    return withLock(async () => {
      const eId = ExcelDatabase.resolveElectionId(electionId);
      const cleanRoll = rollNumber.trim().toUpperCase();
      const beforeCount = dbState.users.length;
      dbState.users = dbState.users.filter((u) => !(u.electionId === eId && u.rollNumber.toUpperCase() === cleanRoll));
      if (dbState.users.length === beforeCount) {
        throw new Error(`Student ${cleanRoll} not found`);
      }
      ExcelDatabase.saveSync();
      deleteVoterFromFirestore(eId, cleanRoll);
    });
  }

  public static async emptyAllUsers(electionId?: string): Promise<{ success: boolean; clearedCount: number }> {
    return withLock(async () => {
      const eId = ExcelDatabase.resolveElectionId(electionId);
      const before = dbState.users.filter((u) => u.electionId === eId).length;
      dbState.users = dbState.users.filter((u) => u.electionId !== eId);
      ExcelDatabase.saveSync();
      clearAllVotersFromFirestore(eId);
      return { success: true, clearedCount: before };
    });
  }

  public static async bulkAddUsers(
    voters: Array<{ rollNumber: string; studentName?: string; status?: string }>,
    electionId?: string
  ): Promise<{ added: number; skipped: number; total: number }> {
    return withLock(async () => {
      const eId = ExcelDatabase.resolveElectionId(electionId);
      let added = 0;
      let skipped = 0;

      for (const v of voters) {
        const roll = (v.rollNumber || '').trim().toUpperCase();
        if (!roll) {
          skipped++;
          continue;
        }

        const exists = dbState.users.some((u) => u.electionId === eId && u.rollNumber.toUpperCase() === roll);
        if (exists) {
          skipped++;
          continue;
        }

        dbState.users.push({
          rollNumber: roll,
          studentName: v.studentName?.trim() || `Student ${roll}`,
          status: (v.status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
          hasVoted: 'No',
          electionId: eId,
        });
        added++;
      }

      ExcelDatabase.saveSync();
      const total = dbState.users.filter((u) => u.electionId === eId).length;
      return { added, skipped, total };
    });
  }

  // ================= CANDIDATES =================

  public static async getCandidates(electionId?: string): Promise<CandidateRow[]> {
    const eId = ExcelDatabase.resolveElectionId(electionId);
    return dbState.candidates.filter((c) => c.electionId === eId);
  }

  public static async addCandidate(candidate: {
    candidateId?: string;
    candidateName: string;
    position: string;
    group?: string;
    imagePath?: string;
    status?: 'Active' | 'Inactive';
    electionId?: string;
  }): Promise<CandidateRow> {
    return withLock(async () => {
      const eId = ExcelDatabase.resolveElectionId(candidate.electionId);
      const electionCandidates = dbState.candidates.filter((c) => c.electionId === eId);

      let cId = candidate.candidateId?.trim().toUpperCase();
      if (!cId) {
        const positionCandidates = dbState.candidates.filter(
          (c) => c.electionId === eId && c.position.toLowerCase() === candidate.position.trim().toLowerCase()
        );
        const posSerial = positionCandidates.length + 1;
        const posPrefix = candidate.position.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'CAN';
        let proposed = `${posPrefix}-${String(posSerial).padStart(2, '0')}`;
        // If proposed exists, avoid conflict
        if (electionCandidates.some((c) => c.candidateId.toUpperCase() === proposed)) {
          proposed = `${posPrefix}-${String(posSerial).padStart(2, '0')}-${Date.now().toString(36).slice(-3).toUpperCase()}`;
        }
        cId = proposed;
      }

      const existing = electionCandidates.find((c) => c.candidateId.toUpperCase() === cId);
      if (existing) {
        throw new Error(`Candidate with ID "${cId}" already exists in this election.`);
      }

      const newCand: CandidateRow = {
        candidateId: cId,
        candidateName: candidate.candidateName.trim(),
        position: candidate.position.trim(),
        group: candidate.group?.trim() || 'Independent',
        imagePath: candidate.imagePath?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        status: candidate.status || 'Active',
        electionId: eId,
      };

      dbState.candidates.push(newCand);

      // Ensure position is added to election's positions array
      const elec = dbState.elections.find((e) => e.id === eId);
      if (elec && !elec.positions.includes(newCand.position)) {
        elec.positions.push(newCand.position);
      }

      ExcelDatabase.saveSync();
      syncCandidateToFirestore(eId, newCand);
      return newCand;
    });
  }

  public static async updateCandidate(
    candidateId: string,
    updates: Partial<CandidateRow>,
    electionId?: string
  ): Promise<CandidateRow> {
    return withLock(async () => {
      const eId = ExcelDatabase.resolveElectionId(electionId);
      const cleanId = candidateId.trim().toUpperCase();
      const idx = dbState.candidates.findIndex(
        (c) => c.electionId === eId && c.candidateId.toUpperCase() === cleanId
      );
      if (idx === -1) throw new Error(`Candidate ${cleanId} not found in this election`);

      dbState.candidates[idx] = {
        ...dbState.candidates[idx],
        ...updates,
      };

      ExcelDatabase.saveSync();
      syncCandidateToFirestore(eId, dbState.candidates[idx]);
      return dbState.candidates[idx];
    });
  }

  public static async deleteCandidate(candidateId: string, electionId?: string): Promise<void> {
    return withLock(async () => {
      const eId = ExcelDatabase.resolveElectionId(electionId);
      const cleanId = candidateId.trim().toUpperCase();
      const beforeCount = dbState.candidates.length;
      dbState.candidates = dbState.candidates.filter(
        (c) => !(c.electionId === eId && c.candidateId.toUpperCase() === cleanId)
      );
      if (dbState.candidates.length === beforeCount) {
        throw new Error(`Candidate ${cleanId} not found`);
      }
      ExcelDatabase.saveSync();
      deleteCandidateFromFirestore(eId, cleanId);
    });
  }

  // ================= VOTING & BALLOT =================

  public static async submitVote(
    rollNumber: string,
    selections: Record<string, string>,
    studentName?: string,
    electionId?: string,
    clientTimeInfo?: { date?: string; time?: string; timestamp?: string }
  ): Promise<{ voteReferenceId: string; date: string; time: string; timestamp: string; electionId: string }> {
    return withLock(async () => {
      const eId = ExcelDatabase.resolveElectionId(electionId);
      const election = dbState.elections.find((e) => e.id === eId);
      if (!election) throw new Error('Election not found');
      if (election.electionStatus === 'Closed') {
        throw new Error('Voting is currently closed for this election.');
      }

      const cleanRoll = rollNumber.trim().toUpperCase();
      const voter = dbState.users.find(
        (u) => u.electionId === eId && u.rollNumber.toUpperCase() === cleanRoll
      );

      if (!voter) {
        throw new Error(`Roll number "${cleanRoll}" is not registered as an eligible voter for ${election.electionName}.`);
      }

      if (voter.status === 'Inactive') {
        throw new Error('This student voter profile is currently inactive.');
      }

      if (voter.hasVoted === 'Yes') {
        throw new Error(`Roll number "${cleanRoll}" has already cast a vote for this election. Multiple voting is prevented.`);
      }

      const now = new Date();
      // Use real date and time from client if provided, or format real local string
      const dateStr = clientTimeInfo?.date || now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      });
      const timeStr = clientTimeInfo?.time || now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const isoTimestamp = clientTimeInfo?.timestamp || now.toISOString();

      const voteRefId = `VOTE-${eId.substring(0, 4).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Record each position vote
      const electionCandidates = dbState.candidates.filter((c) => c.electionId === eId);
      for (const [pos, candId] of Object.entries(selections)) {
        if (!candId) continue;
        const cand = electionCandidates.find((c) => c.candidateId.toUpperCase() === candId.toUpperCase());
        dbState.votes.push({
          voteId: `${voteRefId}-${pos.replace(/\s+/g, '_')}`,
          rollNumber: cleanRoll,
          candidateId: candId,
          candidateName: cand ? cand.candidateName : candId,
          position: pos,
          date: dateStr,
          time: timeStr,
          timestamp: isoTimestamp,
          electionId: eId,
        });
      }

      // Mark voter as hasVoted = Yes
      voter.hasVoted = 'Yes';
      voter.votedAt = `${dateStr} ${timeStr}`;
      if (studentName && studentName.trim()) {
        voter.studentName = studentName.trim();
      }

      ExcelDatabase.saveSync();

      // Sync cast votes to Firestore
      dbState.votes
        .filter((v) => v.voteId.startsWith(voteRefId))
        .forEach((v) => syncVoteToFirestore(eId, v));
      syncVoterToFirestore(eId, voter);

      return {
        voteReferenceId: voteRefId,
        date: dateStr,
        time: timeStr,
        timestamp: isoTimestamp,
        electionId: eId,
      };
    });
  }

  // ================= RESULTS & STATS =================

  public static async getVotes(electionId?: string): Promise<VoteRow[]> {
    const eId = ExcelDatabase.resolveElectionId(electionId);
    return dbState.votes.filter((v) => v.electionId === eId);
  }

  public static async getResults(electionId?: string): Promise<ResultsData> {
    const eId = ExcelDatabase.resolveElectionId(electionId);
    const election = dbState.elections.find((e) => e.id === eId);
    const electionVotes = dbState.votes.filter((v) => v.electionId === eId);
    const electionCandidates = dbState.candidates.filter((c) => c.electionId === eId);

    // Tally votes per candidate
    const tally: Record<string, number> = {};
    for (const v of electionVotes) {
      tally[v.candidateId.toUpperCase()] = (tally[v.candidateId.toUpperCase()] || 0) + 1;
    }

    // Positions strictly come from election's configured positions
    const configuredPositions =
      election?.positions && election.positions.length > 0
        ? election.positions
        : Array.from(new Set(electionCandidates.map((c) => c.position)));

    const positionsMap: Record<string, CandidateRow[]> = {};
    for (const p of configuredPositions) {
      positionsMap[p] = [];
    }

    for (const c of electionCandidates) {
      const candidatePos = (c.position || '').trim().toLowerCase();
      const matched = configuredPositions.find(
        (p) => p.trim().toLowerCase() === candidatePos
      );
      if (matched) {
        positionsMap[matched].push(c);
      }
    }

    const positions: PositionResult[] = configuredPositions.map((positionName) => {
      const cands = positionsMap[positionName] || [];
      let posTotalVotes = 0;
      const candResults: PositionCandidateResult[] = cands.map((c) => {
        const count = tally[c.candidateId.toUpperCase()] || 0;
        posTotalVotes += count;
        return {
          candidateId: c.candidateId,
          candidateName: c.candidateName,
          group: c.group,
          imagePath: c.imagePath,
          voteCount: count,
          votePercentage: 0,
          isWinner: false,
        };
      });

      // Calculate percentages
      candResults.forEach((cr) => {
        cr.votePercentage = posTotalVotes > 0 ? Math.round((cr.voteCount / posTotalVotes) * 1000) / 10 : 0;
      });

      // Winner determination (highest votes if > 0)
      if (posTotalVotes > 0) {
        const maxVotes = Math.max(...candResults.map((r) => r.voteCount));
        if (maxVotes > 0) {
          candResults.forEach((cr) => {
            if (cr.voteCount === maxVotes) cr.isWinner = true;
          });
        }
      }

      // Sort descending by vote count
      candResults.sort((a, b) => b.voteCount - a.voteCount);

      return {
        position: positionName,
        totalVotes: posTotalVotes,
        candidates: candResults,
      };
    });

    return {
      positions,
      totalVotesRecorded: electionVotes.length,
    };
  }

  public static async getStats(electionId?: string): Promise<{
    totalVoters: number;
    totalVotes: number;
    votedCount: number;
    notVotedCount: number;
    votingPercentage: number;
    activePositionsCount: number;
    activeCandidatesCount: number;
  }> {
    const eId = ExcelDatabase.resolveElectionId(electionId);
    const election = dbState.elections.find((e) => e.id === eId);
    const users = dbState.users.filter((u) => u.electionId === eId);
    const votes = dbState.votes.filter((v) => v.electionId === eId);
    const candidates = dbState.candidates.filter((c) => c.electionId === eId);

    const totalVoters = users.length;
    const votedCount = users.filter((u) => u.hasVoted === 'Yes').length;
    const notVotedCount = totalVoters - votedCount;
    const votingPercentage = totalVoters > 0 ? Math.round((votedCount / totalVoters) * 1000) / 10 : 0;

    const activePositionsCount =
      election?.positions && election.positions.length > 0
        ? election.positions.length
        : new Set(candidates.filter((c) => c.status === 'Active').map((c) => c.position)).size;

    return {
      totalVoters,
      totalVotes: votes.length,
      votedCount,
      notVotedCount,
      votingPercentage,
      activePositionsCount,
      activeCandidatesCount: candidates.filter((c) => c.status === 'Active').length,
    };
  }

  public static async resetVotingSystem(electionId?: string): Promise<{ success: boolean; message: string }> {
    return withLock(async () => {
      const eId = ExcelDatabase.resolveElectionId(electionId);
      // Clear votes for this election
      dbState.votes = dbState.votes.filter((v) => v.electionId !== eId);
      // Reset hasVoted flag for voters in this election
      dbState.users.forEach((u) => {
        if (u.electionId === eId) {
          u.hasVoted = 'No';
          delete u.votedAt;
        }
      });
      ExcelDatabase.saveSync();
      return { success: true, message: 'All votes reset and voter participation cleared for this election.' };
    });
  }

  public static async purgeAllData(): Promise<{ success: boolean; message: string }> {
    return withLock(async () => {
      dbState.elections = [];
      dbState.users = [];
      dbState.candidates = [];
      dbState.votes = [];
      ExcelDatabase.saveSync();
      await ExcelDatabase.exportAllToExcelFile();
      return { success: true, message: 'All data (elections, voters roster, candidates, and votes) permanently cleared from the website.' };
    });
  }

  // ================= EXCEL EXPORTS =================

  public static async exportElectionToExcel(electionId?: string): Promise<ExcelJS.Workbook> {
    const eId = ExcelDatabase.resolveElectionId(electionId);
    const election = dbState.elections.find((e) => e.id === eId) || dbState.elections[0];
    const users = election ? dbState.users.filter((u) => u.electionId === election.id) : [];
    const candidates = election ? dbState.candidates.filter((c) => c.electionId === election.id) : [];
    const votes = election ? dbState.votes.filter((v) => v.electionId === election.id) : [];
    const results = election ? await ExcelDatabase.getResults(election.id) : { positions: [], totalVotesRecorded: 0 };

    const wb = new ExcelJS.Workbook();
    wb.creator = 'Online Voting System';
    wb.created = new Date();

    const headerStyle = (row: ExcelJS.Row, bg = '1E3A8A') => {
      row.font = { bold: true, color: { argb: 'FFFFFF' }, size: 11 };
      row.alignment = { vertical: 'middle', horizontal: 'center' };
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      row.height = 24;
    };

    // 1. SUMMARY SHEET
    const summaryWs = wb.addWorksheet('SUMMARY');
    summaryWs.columns = [{ width: 28 }, { width: 45 }];
    const titleRow = summaryWs.addRow(['ELECTION OFFICIAL REPORT', election?.electionName || 'No Active Election']);
    titleRow.font = { bold: true, size: 14 };
    summaryWs.addRow(['College / Organization', election?.collegeName || 'N/A']);
    summaryWs.addRow(['Security Code', election?.securityCode || 'N/A']);
    summaryWs.addRow(['Election Status', election?.electionStatus || 'N/A']);
    summaryWs.addRow(['Total Eligible Voters', users.length]);
    summaryWs.addRow(['Votes Cast (Voters who voted)', users.filter((u) => u.hasVoted === 'Yes').length]);
    const turnout = users.length > 0 ? ((users.filter((u) => u.hasVoted === 'Yes').length / users.length) * 100).toFixed(1) + '%' : '0%';
    summaryWs.addRow(['Voter Turnout Rate', turnout]);
    summaryWs.addRow(['Total Position Votes Logged', votes.length]);
    summaryWs.addRow(['Report Generated', new Date().toLocaleString()]);

    // 2. USERS SHEET
    const usersWs = wb.addWorksheet('VOTERS_ROSTER');
    usersWs.columns = [
      { header: 'Roll Number', key: 'rollNumber', width: 22 },
      { header: 'Student Name', key: 'studentName', width: 28 },
      { header: 'Status', key: 'status', width: 14 },
      { header: 'Has Voted', key: 'hasVoted', width: 14 },
      { header: 'Voted Timestamp', key: 'votedAt', width: 24 },
    ];
    headerStyle(usersWs.getRow(1), '1E40AF');
    users.forEach((u) => {
      usersWs.addRow({
        rollNumber: u.rollNumber,
        studentName: u.studentName,
        status: u.status,
        hasVoted: u.hasVoted,
        votedAt: u.votedAt || 'N/A',
      });
    });

    // 3. CANDIDATES SHEET
    const candWs = wb.addWorksheet('CANDIDATES');
    candWs.columns = [
      { header: 'S.No', key: 'sno', width: 8 },
      { header: 'Position', key: 'position', width: 26 },
      { header: 'Candidate ID', key: 'candidateId', width: 16 },
      { header: 'Candidate Name', key: 'candidateName', width: 26 },
      { header: 'Group / Party', key: 'group', width: 26 },
      { header: 'Status', key: 'status', width: 14 },
    ];
    headerStyle(candWs.getRow(1), '047857');
    const posCounters: Record<string, number> = {};
    candidates.forEach((c) => {
      const p = c.position || 'General';
      posCounters[p] = (posCounters[p] || 0) + 1;
      candWs.addRow({
        sno: posCounters[p],
        position: c.position,
        candidateId: c.candidateId,
        candidateName: c.candidateName,
        group: c.group,
        status: c.status,
      });
    });

    // 4. VOTES SHEET
    const votesWs = wb.addWorksheet('VOTES_AUDIT_LOG');
    votesWs.columns = [
      { header: 'Vote ID', key: 'voteId', width: 34 },
      { header: 'Roll Number', key: 'rollNumber', width: 20 },
      { header: 'Position', key: 'position', width: 26 },
      { header: 'Candidate Chosen', key: 'candidateName', width: 26 },
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Time', key: 'time', width: 14 },
    ];
    headerStyle(votesWs.getRow(1), '4338CA');
    votes.forEach((v) => {
      votesWs.addRow({
        voteId: v.voteId,
        rollNumber: v.rollNumber,
        position: v.position,
        candidateName: v.candidateName,
        date: v.date,
        time: v.time,
      });
    });

    // 5. RESULTS SHEET
    const resWs = wb.addWorksheet('ELECTION_RESULTS');
    resWs.columns = [
      { header: 'Position', key: 'position', width: 26 },
      { header: 'Candidate Name', key: 'candidateName', width: 26 },
      { header: 'Group / Party', key: 'group', width: 26 },
      { header: 'Votes Received', key: 'votes', width: 18 },
      { header: 'Vote Share %', key: 'percentage', width: 16 },
      { header: 'Result Outcome', key: 'outcome', width: 18 },
    ];
    headerStyle(resWs.getRow(1), 'B45309');
    results.positions.forEach((pos) => {
      pos.candidates.forEach((c) => {
        resWs.addRow({
          position: pos.position,
          candidateName: c.candidateName,
          group: c.group,
          votes: c.voteCount,
          percentage: `${c.votePercentage}%`,
          outcome: c.isWinner ? 'WINNER 🏆' : '-',
        });
      });
    });

    return wb;
  }

  public static async exportAllToExcelFile(): Promise<void> {
    const wb = await ExcelDatabase.exportElectionToExcel();
    await wb.xlsx.writeFile(DB_XLSX_PATH);
  }
}

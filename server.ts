import express from 'express';
import path from 'path';
import fs from 'fs';
import { ExcelDatabase } from './server/excelDatabase';
import * as pgDb from './src/db/operations';

export async function createExpressApp() {
  // Initialize Excel & JSON database on server startup
  await ExcelDatabase.init();

  const app = express();

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Firebase Firestore Connection Status
  app.get('/api/firebase/status', (req, res) => {
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        res.json({
          status: 'connected',
          projectId: config.projectId,
          firestoreDatabaseId: config.firestoreDatabaseId,
          authDomain: config.authDomain,
        });
      } else {
        res.json({ status: 'not_configured' });
      }
    } catch {
      res.json({ status: 'error' });
    }
  });

  // Database Connection Status (Cloud SQL / PostgreSQL)
  app.get('/api/db/status', async (req, res) => {
    try {
      const electionList = await pgDb.getElections();
      res.json({
        status: 'connected',
        engine: 'PostgreSQL',
        electionsCount: electionList.length,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Database query failed' });
    }
  });

  // ================= ADMIN AUTH =================

  // Admin Registration
  app.post('/api/admin/register', async (req, res) => {
    try {
      const { fullName, collegeName, username, email, password } = req.body;
      if (!fullName || !collegeName || !username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required to register an administrator.' });
      }
      const newAdmin = await ExcelDatabase.registerAdmin({
        fullName,
        collegeName,
        username,
        email,
        password,
      });
      res.status(201).json({
        success: true,
        message: 'Admin account created successfully.',
        admin: {
          id: newAdmin.id,
          fullName: newAdmin.fullName,
          collegeName: newAdmin.collegeName,
          username: newAdmin.username,
          email: newAdmin.email,
          createdAt: newAdmin.createdAt,
        },
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  });

  // Admin Login
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { usernameOrEmail, password } = req.body;
      if (!usernameOrEmail || !password) {
        return res.status(400).json({ error: 'Username/Email and Password are required.' });
      }
      const admin = await ExcelDatabase.authenticateAdmin(usernameOrEmail, password);
      res.json({
        success: true,
        message: 'Login successful',
        admin: {
          id: admin.id,
          fullName: admin.fullName,
          collegeName: admin.collegeName,
          username: admin.username,
          email: admin.email,
          createdAt: admin.createdAt,
        },
      });
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Authentication failed' });
    }
  });

  // ================= ELECTIONS MANAGEMENT =================

  // Helper to get elections list with turnout statistics
  const getElectionsWithStats = async (adminId?: string) => {
    const elections = await ExcelDatabase.getElections(adminId);
    return Promise.all(
      elections.map(async (e) => {
        const stats = await ExcelDatabase.getStats(e.id);
        return {
          ...e,
          votersCount: stats.totalVoters,
          votesCount: stats.votedCount,
          candidatesCount: stats.activeCandidatesCount,
          turnoutPercentage: stats.votingPercentage,
        };
      })
    );
  };

  // List elections with live turnout stats (Admin route)
  app.get('/api/admin/elections', async (req, res) => {
    try {
      const adminId = req.query.adminId as string | undefined;
      const fullList = await getElectionsWithStats(adminId);
      res.json({ success: true, elections: fullList });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch elections' });
    }
  });

  // List elections with live turnout stats (Public / standard route)
  app.get('/api/elections', async (req, res) => {
    try {
      const adminId = req.query.adminId as string | undefined;
      const fullList = await getElectionsWithStats(adminId);
      res.json(fullList);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch elections' });
    }
  });

  // Toggle election status (Active <-> Closed)
  const toggleElectionStatusHandler = async (req: express.Request, res: express.Response) => {
    try {
      const { electionId } = req.params;
      const election = await ExcelDatabase.getElectionById(electionId);
      if (!election) return res.status(404).json({ error: 'Election not found' });
      const nextStatus = election.electionStatus === 'Active' ? 'Closed' : 'Active';
      const updated = await ExcelDatabase.updateElection(electionId, { electionStatus: nextStatus });
      res.json({ success: true, electionStatus: updated.electionStatus, election: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to toggle election status' });
    }
  };

  app.post('/api/admin/elections/:electionId/toggle-status', toggleElectionStatusHandler);
  app.post('/api/elections/:electionId/toggle-status', toggleElectionStatusHandler);

  // Create election
  const createElectionHandler = async (req: express.Request, res: express.Response) => {
    try {
      const {
        adminId,
        electionName,
        collegeName,
        positions,
        securityCode,
        description,
        candidates,
        eligibleRollNumbers,
        scheduledDate,
      } = req.body;

      if (!electionName || !collegeName || !positions || !Array.isArray(positions) || positions.length === 0) {
        return res.status(400).json({ error: 'Election name, college/org name, and at least one position are required.' });
      }

      const newElection = await ExcelDatabase.createElection({
        adminId: adminId || 'admin_1',
        electionName,
        collegeName,
        positions,
        securityCode,
        description,
        candidates,
        eligibleRollNumbers,
        scheduledDate,
      });

      const stats = await ExcelDatabase.getStats(newElection.id);

      res.status(201).json({
        ...newElection,
        votersCount: stats.totalVoters,
        votesCount: stats.votedCount,
        turnoutPercentage: stats.votingPercentage,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to create election' });
    }
  };

  app.post('/api/elections', createElectionHandler);
  app.post('/api/admin/elections', createElectionHandler);

  // Get single election details
  const getSingleElectionHandler = async (req: express.Request, res: express.Response) => {
    try {
      const { electionId } = req.params;
      const election = await ExcelDatabase.getElectionById(electionId);
      if (!election) return res.status(404).json({ error: 'Election not found' });
      const stats = await ExcelDatabase.getStats(electionId);
      res.json({
        ...election,
        stats,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get election' });
    }
  };

  app.get('/api/elections/:electionId', getSingleElectionHandler);
  app.get('/api/admin/elections/:electionId', getSingleElectionHandler);

  // Update election
  const updateElectionHandler = async (req: express.Request, res: express.Response) => {
    try {
      const { electionId } = req.params;
      const { electionName, collegeName, positions, securityCode, electionStatus, description, scheduledDate } = req.body;
      const updated = await ExcelDatabase.updateElection(electionId, {
        electionName,
        collegeName,
        positions,
        securityCode,
        electionStatus,
        description,
        ...(scheduledDate !== undefined ? { scheduledDate } : {}),
      });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update election' });
    }
  };

  app.put('/api/elections/:electionId', updateElectionHandler);
  app.put('/api/admin/elections/:electionId', updateElectionHandler);

  // Delete election
  const deleteElectionHandler = async (req: express.Request, res: express.Response) => {
    try {
      const { electionId } = req.params;
      await ExcelDatabase.deleteElection(electionId);
      res.json({ success: true, message: 'Election deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete election' });
    }
  };

  app.delete('/api/elections/:electionId', deleteElectionHandler);
  app.delete('/api/admin/elections/:electionId', deleteElectionHandler);

  // ================= VOTER PORTAL FLOW =================

  // 1. Verify Voting Security Code
  app.post('/api/voter/verify-code', async (req, res) => {
    try {
      const { securityCode } = req.body;
      if (!securityCode || !securityCode.trim()) {
        return res.status(400).json({
          valid: false,
          message: 'Please enter the Voting Security Code provided by your election administrator.',
        });
      }

      const election = await ExcelDatabase.getElectionBySecurityCode(securityCode.trim());
      if (!election) {
        return res.status(200).json({
          valid: false,
          message: `No active election found with Security Code "${securityCode.trim().toUpperCase()}". Please verify the code with your administrator.`,
        });
      }

      const candidates = await ExcelDatabase.getCandidates(election.id);
      const voters = await ExcelDatabase.getUsers(election.id);

      // Check scheduled election date validity
      let dateValidity: 'open' | 'upcoming' | 'expired' = 'open';
      let dateMessage: string | undefined = undefined;

      if (election.scheduledDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        const schedStr = election.scheduledDate;
        if (todayStr < schedStr) {
          dateValidity = 'upcoming';
          dateMessage = `This election is scheduled for ${schedStr}. Voting will only be open on that particular date.`;
        } else if (todayStr > schedStr) {
          dateValidity = 'expired';
          dateMessage = `This election was scheduled for ${schedStr} and has now concluded.`;
        } else {
          dateValidity = 'open';
          dateMessage = `Voting is active today (${schedStr}).`;
        }
      }

      return res.status(200).json({
        valid: true,
        election: {
          id: election.id,
          electionName: election.electionName,
          collegeName: election.collegeName,
          securityCode: election.securityCode,
          positions: election.positions,
          electionStatus: election.electionStatus,
          candidatesCount: candidates.filter((c) => c.status === 'Active').length,
          totalEligibleVoters: voters.length,
          isClosed: election.electionStatus === 'Closed',
          scheduledDate: election.scheduledDate,
          dateValidity,
          dateMessage,
          note: election.scheduledDate ? 'Note: This election is valid for that particular date only.' : undefined,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to verify security code' });
    }
  });

  // 2. Validate Roll Number for Identified Election
  app.post('/api/voter/validate-roll', async (req, res) => {
    try {
      const { electionId, securityCode, rollNumber } = req.body;

      if (!rollNumber || !rollNumber.trim()) {
        return res.status(400).json({
          valid: false,
          reason: 'empty',
          message: 'Please enter your student Roll Number.',
        });
      }

      // Resolve election
      let election = null;
      if (electionId) {
        election = await ExcelDatabase.getElectionById(electionId);
      } else if (securityCode) {
        election = await ExcelDatabase.getElectionBySecurityCode(securityCode);
      }

      if (!election) {
        return res.status(404).json({
          valid: false,
          reason: 'election_not_found',
          message: 'Election not found. Please re-enter your Voting Security Code.',
        });
      }

      // Check election status
      if (election.electionStatus === 'Closed') {
        return res.status(200).json({
          valid: false,
          reason: 'voting_closed',
          message: `Voting for "${election.electionName}" is currently closed by the administrator.`,
          election: {
            id: election.id,
            electionName: election.electionName,
            collegeName: election.collegeName,
          },
        });
      }

      // Check scheduled election date constraint (Single-Day Election)
      if (election.scheduledDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        const schedStr = election.scheduledDate;
        if (todayStr < schedStr) {
          return res.status(200).json({
            valid: false,
            reason: 'election_upcoming',
            message: `This election is scheduled for ${schedStr}. Voting will only be open on that particular date.`,
            note: 'Note: This election is valid for that particular date only.',
            scheduledDate: schedStr,
            election: {
              id: election.id,
              electionName: election.electionName,
              collegeName: election.collegeName,
            },
          });
        }
        if (todayStr > schedStr) {
          return res.status(200).json({
            valid: false,
            reason: 'election_expired',
            message: `This election was scheduled for ${schedStr} and has now concluded.`,
            note: 'Note: This election is valid for that particular date only.',
            scheduledDate: schedStr,
            election: {
              id: election.id,
              electionName: election.electionName,
              collegeName: election.collegeName,
            },
          });
        }
      }

      const cleanRoll = rollNumber.trim().toUpperCase();
      const user = await ExcelDatabase.getUserByRollNumber(cleanRoll, election.id);

      if (!user) {
        return res.status(200).json({
          valid: false,
          reason: 'not_found',
          message: `Roll number "${cleanRoll}" is not found in the eligible voter list for "${election.electionName}". Only pre-listed voters are authorized to cast a ballot.`,
          election: {
            id: election.id,
            electionName: election.electionName,
          },
        });
      }

      if (user.status === 'Inactive') {
        return res.status(200).json({
          valid: false,
          reason: 'inactive',
          message: `The voter record for roll number "${cleanRoll}" is currently inactive. Please contact your election officer.`,
        });
      }

      if (user.hasVoted === 'Yes') {
        return res.status(200).json({
          valid: false,
          reason: 'already_voted',
          message: `Roll number "${cleanRoll}" has already cast a vote in "${election.electionName}". Each eligible student can vote only once.`,
          student: {
            rollNumber: user.rollNumber,
            studentName: user.studentName,
            votedAt: user.votedAt,
          },
          election: {
            id: election.id,
            electionName: election.electionName,
          },
        });
      }

      // Valid & Eligible & Not Voted!
      return res.status(200).json({
        valid: true,
        student: {
          rollNumber: user.rollNumber,
          studentName: user.studentName,
        },
        election: {
          id: election.id,
          electionName: election.electionName,
          collegeName: election.collegeName,
          securityCode: election.securityCode,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Validation failed' });
    }
  });

  // 3. Voting Ballot Data (Positions & Candidates for Election)
  app.get('/api/voter/ballot/:electionId', async (req, res) => {
    try {
      const { electionId } = req.params;
      const election = await ExcelDatabase.getElectionById(electionId);
      if (!election) return res.status(404).json({ error: 'Election not found' });

      const candidates = await ExcelDatabase.getCandidates(electionId);
      const activeCandidates = candidates.filter((c) => c.status === 'Active');

      // The ballot positions must STRICTLY match the positions configured by the admin
      const configuredPositions = election.positions && election.positions.length > 0
        ? election.positions
        : Array.from(new Set(activeCandidates.map((c) => c.position)));

      const positionsMap: Record<string, typeof activeCandidates> = {};
      configuredPositions.forEach((pos) => {
        positionsMap[pos] = [];
      });

      // Place candidates only into their matching configured position (case-insensitive trim)
      activeCandidates.forEach((c) => {
        const candidatePos = (c.position || '').trim().toLowerCase();
        const matched = configuredPositions.find(
          (p) => p.trim().toLowerCase() === candidatePos
        );
        if (matched) {
          positionsMap[matched].push(c);
        }
      });

      // Return EXACTLY the positions configured for this election, no rogue positions
      const positions = configuredPositions.map((positionName) => ({
        positionName,
        candidates: positionsMap[positionName] || [],
      }));

      res.json({
        election: {
          id: election.id,
          electionName: election.electionName,
          collegeName: election.collegeName,
          securityCode: election.securityCode,
          electionStatus: election.electionStatus,
          positions: configuredPositions,
          scheduledDate: election.scheduledDate,
        },
        positions,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch ballot data' });
    }
  });

  // 4. Submit Ballot Vote
  app.post('/api/voter/cast-vote', async (req, res) => {
    try {
      const { electionId, rollNumber, selections, studentName, date, time, timestamp } = req.body;
      if (!electionId || !rollNumber || !selections || typeof selections !== 'object') {
        return res.status(400).json({ error: 'Election ID, roll number, and candidate selections are required.' });
      }

      const election = await ExcelDatabase.getElectionById(electionId);
      if (!election) return res.status(404).json({ error: 'Election not found' });

      // Enforce scheduled date if specified
      if (election.scheduledDate) {
        const todayStr = new Date().toISOString().split('T')[0];
        if (todayStr !== election.scheduledDate) {
          return res.status(400).json({
            error: `Ballots can only be cast on the scheduled date (${election.scheduledDate}). Note: This election is valid for that particular date only.`,
            note: 'Note: This election is valid for that particular date only.'
          });
        }
      }

      const clientTimeInfo = (date || time || timestamp) ? { date, time, timestamp } : undefined;
      const result = await ExcelDatabase.submitVote(rollNumber, selections, studentName, electionId, clientTimeInfo);

      // Return receipt details
      res.json({
        success: true,
        voteReferenceId: result.voteReferenceId,
        date: result.date,
        time: result.time,
        timestamp: result.timestamp,
        electionName: election.electionName,
        collegeName: election.collegeName,
        securityCode: election.securityCode,
        rollNumber: rollNumber.trim().toUpperCase(),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Vote casting failed' });
    }
  });

  // ================= LEGACY & UNIFIED ENDPOINTS =================
  // Keeps compatibility with existing tabs by allowing optional electionId query/body

  // Settings
  app.get('/api/settings', async (req, res) => {
    try {
      const electionId = req.query.electionId as string | undefined;
      const settings = await ExcelDatabase.getSettings(electionId);
      res.json(settings);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get settings' });
    }
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const {
        collegeName,
        electionName,
        electionStatus,
        electionId,
        positions,
        voterAvatar,
        adminAvatar,
        operationMode,
        themeMode,
        resultsMode,
      } = req.body;
      const updated = await ExcelDatabase.updateSettings({
        collegeName,
        electionName,
        electionStatus,
        electionId,
        positions,
        voterAvatar,
        adminAvatar,
        operationMode,
        themeMode,
        resultsMode,
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update settings' });
    }
  });

  // Stats for Admin Dashboard
  app.get('/api/stats', async (req, res) => {
    try {
      const electionId = req.query.electionId as string | undefined;
      const stats = await ExcelDatabase.getStats(electionId);
      res.json(stats);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to get stats' });
    }
  });

  // Legacy validate-user
  app.post('/api/validate-user', async (req, res) => {
    try {
      const { rollNumber, electionId, securityCode } = req.body;
      if (!rollNumber || !rollNumber.trim()) {
        return res.status(400).json({
          valid: false,
          reason: 'empty',
          message: 'Please enter your college Roll Number.',
        });
      }

      // Check election
      let targetElectionId = electionId;
      if (!targetElectionId && securityCode) {
        const found = await ExcelDatabase.getElectionBySecurityCode(securityCode);
        if (found) targetElectionId = found.id;
      }

      const settings = await ExcelDatabase.getSettings(targetElectionId);
      if (settings.electionStatus === 'Closed') {
        return res.status(200).json({
          valid: false,
          reason: 'voting_closed',
          message: 'Voting is currently closed. Please contact the election administrator.',
        });
      }

      const user = await ExcelDatabase.getUserByRollNumber(rollNumber, targetElectionId);
      if (user) {
        if (user.status === 'Inactive') {
          return res.status(200).json({
            valid: false,
            reason: 'inactive',
            message: 'This student account is currently inactive. Please contact the administrator.',
          });
        }

        if (user.hasVoted === 'Yes') {
          return res.status(200).json({
            valid: false,
            reason: 'already_voted',
            message: 'You have already cast your vote. Each student can vote only once.',
            student: {
              rollNumber: user.rollNumber,
              studentName: user.studentName,
            },
          });
        }

        return res.status(200).json({
          valid: true,
          student: {
            rollNumber: user.rollNumber,
            studentName: user.studentName,
          },
        });
      }

      return res.status(200).json({
        valid: false,
        reason: 'not_found',
        message: `Roll number "${rollNumber.trim()}" is not found in the voter list. Only pre-listed voters are eligible to vote. Please contact the election administrator.`,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Validation failed' });
    }
  });

  // Voting data & ballot loader
  const getBallotHandler = async (req: express.Request, res: express.Response) => {
    try {
      const electionId = (req.params.electionId || req.query.electionId) as string | undefined;
      const settings = await ExcelDatabase.getSettings(electionId);
      const candidates = await ExcelDatabase.getCandidates(electionId);
      const activeCandidates = candidates.filter((c) => c.status === 'Active');

      const configuredPositions = settings.positions && settings.positions.length > 0
        ? settings.positions
        : Array.from(new Set(activeCandidates.map((c) => c.position)));

      const positionsMap: Record<string, typeof activeCandidates> = {};
      configuredPositions.forEach((pos) => {
        positionsMap[pos] = [];
      });

      activeCandidates.forEach((c) => {
        const candidatePos = (c.position || '').trim().toLowerCase();
        const matched = configuredPositions.find(
          (p) => p.trim().toLowerCase() === candidatePos
        );
        if (matched) {
          positionsMap[matched].push(c);
        }
      });

      const positions = configuredPositions.map((posName) => ({
        positionName: posName,
        candidates: positionsMap[posName] || [],
      }));

      res.json({
        settings,
        positions,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch voting data' });
    }
  };

  app.get('/api/voting-data', getBallotHandler);
  app.get('/api/voter/ballot/:electionId', getBallotHandler);

  // Submit vote handler (both /api/submit-vote and /api/voter/submit-vote)
  const submitVoteHandler = async (req: express.Request, res: express.Response) => {
    try {
      const { rollNumber, selections, votes, studentName, electionId, date, time, timestamp } = req.body;
      const targetSelections = selections || votes;
      if (!rollNumber || !targetSelections || typeof targetSelections !== 'object') {
        return res.status(400).json({ error: 'Roll number and candidate selections are required.' });
      }

      const clientTimeInfo = (date || time || timestamp) ? { date, time, timestamp } : undefined;
      const result = await ExcelDatabase.submitVote(rollNumber, targetSelections, studentName, electionId, clientTimeInfo);
      res.json({
        success: true,
        voteReferenceId: result.voteReferenceId,
        date: result.date,
        time: result.time,
        timestamp: result.timestamp,
        electionId: result.electionId,
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Vote submission failed' });
    }
  };

  app.post('/api/submit-vote', submitVoteHandler);
  app.post('/api/voter/submit-vote', submitVoteHandler);

  // Users management
  app.get('/api/users', async (req, res) => {
    try {
      const electionId = req.query.electionId as string | undefined;
      const users = await ExcelDatabase.getUsers(electionId);
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch users' });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const { rollNumber, studentName, status, electionId } = req.body;
      const newUser = await ExcelDatabase.addUser({ rollNumber, studentName, status, electionId });
      res.status(201).json(newUser);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to add user' });
    }
  });

  app.put('/api/users/:rollNumber', async (req, res) => {
    try {
      const { rollNumber } = req.params;
      const electionId = (req.query.electionId as string) || req.body.electionId;
      const { studentName, status, hasVoted } = req.body;
      const updated = await ExcelDatabase.updateUser(rollNumber, { studentName, status, hasVoted }, electionId);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update user' });
    }
  });

  app.delete('/api/users/:rollNumber', async (req, res) => {
    try {
      const { rollNumber } = req.params;
      const electionId = (req.query.electionId as string) || (req.body && req.body.electionId);
      await ExcelDatabase.deleteUser(rollNumber, electionId);
      res.json({ success: true, message: 'User deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete user' });
    }
  });

  app.post('/api/users/:rollNumber/toggle-status', async (req, res) => {
    try {
      const { rollNumber } = req.params;
      const electionId = (req.query.electionId as string) || req.body.electionId;
      const user = await ExcelDatabase.getUserByRollNumber(rollNumber, electionId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
      const updated = await ExcelDatabase.updateUser(rollNumber, { status: nextStatus }, electionId);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to toggle status' });
    }
  });

  // Empty all voters list
  app.post('/api/users/clear-all', async (req, res) => {
    try {
      const electionId = req.body.electionId || (req.query.electionId as string);
      const result = await ExcelDatabase.emptyAllUsers(electionId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to empty voters list' });
    }
  });

  // Bulk add voters
  app.post('/api/users/bulk', async (req, res) => {
    try {
      const { voters, electionId } = req.body;
      if (!Array.isArray(voters)) {
        return res.status(400).json({ error: 'Expected an array of voters' });
      }
      const result = await ExcelDatabase.bulkAddUsers(voters, electionId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to bulk add voters' });
    }
  });

  // Candidates management
  app.get('/api/candidates', async (req, res) => {
    try {
      const electionId = req.query.electionId as string | undefined;
      const candidates = await ExcelDatabase.getCandidates(electionId);
      res.json(candidates);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch candidates' });
    }
  });

  app.post('/api/candidates', async (req, res) => {
    try {
      const { candidateId, candidateName, position, group, imagePath, status, electionId } = req.body;
      const newCand = await ExcelDatabase.addCandidate({ candidateId, candidateName, position, group, imagePath, status, electionId });
      res.status(201).json(newCand);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to add candidate' });
    }
  });

  app.put('/api/candidates/:candidateId', async (req, res) => {
    try {
      const { candidateId } = req.params;
      const electionId = (req.query.electionId as string) || req.body.electionId;
      const { candidateName, position, group, imagePath, status } = req.body;
      const updated = await ExcelDatabase.updateCandidate(candidateId, { candidateName, position, group, imagePath, status }, electionId);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update candidate' });
    }
  });

  // Update candidate photo directly
  app.put('/api/candidates/:candidateId/photo', async (req, res) => {
    try {
      const { candidateId } = req.params;
      const electionId = (req.query.electionId as string) || req.body.electionId;
      const { imagePath } = req.body;
      const updated = await ExcelDatabase.updateCandidate(candidateId, { imagePath: imagePath !== undefined ? imagePath : '' }, electionId);
      res.json({ success: true, candidate: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update candidate photo' });
    }
  });

  app.delete('/api/candidates/:candidateId', async (req, res) => {
    try {
      const { candidateId } = req.params;
      const electionId = (req.query.electionId as string) || (req.body && req.body.electionId);
      await ExcelDatabase.deleteCandidate(candidateId, electionId);
      res.json({ success: true, message: 'Candidate deleted' });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete candidate' });
    }
  });

  app.post('/api/candidates/:candidateId/toggle-status', async (req, res) => {
    try {
      const { candidateId } = req.params;
      const electionId = (req.query.electionId as string) || req.body.electionId;
      const candidates = await ExcelDatabase.getCandidates(electionId);
      const cand = candidates.find((c) => c.candidateId.toUpperCase() === candidateId.toUpperCase());
      if (!cand) return res.status(404).json({ error: 'Candidate not found' });
      const nextStatus = cand.status === 'Active' ? 'Inactive' : 'Active';
      const updated = await ExcelDatabase.updateCandidate(candidateId, { status: nextStatus }, electionId);
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to toggle status' });
    }
  });

  // Votes records
  app.get('/api/votes', async (req, res) => {
    try {
      const electionId = req.query.electionId as string | undefined;
      const votes = await ExcelDatabase.getVotes(electionId);
      res.json(votes);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch votes' });
    }
  });

  // Results
  app.get('/api/results', async (req, res) => {
    try {
      const electionId = req.query.electionId as string | undefined;
      const results = await ExcelDatabase.getResults(electionId);
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch results' });
    }
  });

  // CLEAR / RESET VOTES FOR ELECTION
  app.post('/api/reset', async (req, res) => {
    try {
      const electionId = req.body.electionId || (req.query.electionId as string);
      const result = await ExcelDatabase.resetVotingSystem(electionId);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to reset voting system' });
    }
  });

  // PURGE ALL DATA FROM WEBSITE
  const purgeAllDataHandler = async (req: express.Request, res: express.Response) => {
    try {
      const result = await ExcelDatabase.purgeAllData();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to purge all data' });
    }
  };

  app.post('/api/admin/purge-all-data', purgeAllDataHandler);
  app.post('/api/system/purge-all', purgeAllDataHandler);

  // EXPORT EXCEL ENDPOINT
  app.get('/api/export/:type', async (req, res) => {
    try {
      const { type } = req.params;
      const electionId = req.query.electionId as string | undefined;

      const wb = await ExcelDatabase.exportElectionToExcel(electionId);
      const filename = `election_${electionId || 'report'}_${type}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      await wb.xlsx.write(res);
      res.end();
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Export failed' });
    }
  });

  // API Fallback 404 Handler - Ensure API routes return JSON errors, never HTML
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  return app;
}

async function startServer() {
  const app = await createExpressApp();
  const PORT = 3000;

  // Serve static public avatar images
  const publicAvatarsPath = path.join(process.cwd(), 'public', 'avatars');
  app.use('/avatars', express.static(publicAvatarsPath));

  // --- VITE MIDDLEWARE / STATIC ASSETS ---
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Voting System server running on http://localhost:${PORT}`);
  });
}

// Only start standalone server when run directly (not inside Vercel serverless functions)
if (!process.env.VERCEL) {
  startServer();
}

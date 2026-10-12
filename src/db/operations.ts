import { eq, and, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  admins,
  elections,
  voters,
  candidates,
  votes,
  electionSettings,
  users,
} from './schema.ts';

// User / Auth Helpers (Firebase Auth link)
export async function getOrCreateUser(uid: string, email: string) {
  try {
    const result = await db
      .insert(users)
      .values({ uid, email })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed for getOrCreateUser:', error);
    throw new Error('Database operation failed. Please try again later.', { cause: error });
  }
}

// Admins
export async function getAdmins() {
  try {
    return await db.select().from(admins);
  } catch (error) {
    console.error('Database query failed for getAdmins:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getAdminByUsernameOrEmail(identifier: string) {
  try {
    const list = await db
      .select()
      .from(admins)
      .where(sql`${admins.username} = ${identifier} OR ${admins.email} = ${identifier}`);
    return list[0] || null;
  } catch (error) {
    console.error('Database query failed for getAdminByUsernameOrEmail:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function createAdmin(data: {
  id: string;
  fullName: string;
  collegeName: string;
  username: string;
  email: string;
  passwordHash: string;
}) {
  try {
    const result = await db.insert(admins).values(data).returning();
    return result[0];
  } catch (error) {
    console.error('Database insert failed for createAdmin:', error);
    throw new Error('Database insert failed. Please try again later.', { cause: error });
  }
}

// Elections
export async function getElections(adminId?: string) {
  try {
    if (adminId) {
      return await db.select().from(elections).where(eq(elections.adminId, adminId));
    }
    return await db.select().from(elections);
  } catch (error) {
    console.error('Database query failed for getElections:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getElectionById(id: string) {
  try {
    const list = await db.select().from(elections).where(eq(elections.id, id));
    return list[0] || null;
  } catch (error) {
    console.error('Database query failed for getElectionById:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function createElection(data: {
  id: string;
  adminId?: string;
  name: string;
  collegeName: string;
  description?: string;
  securityCode: string;
  startDate: string;
  endDate: string;
  status?: string;
  allowAbstain?: boolean;
  isPublic?: boolean;
}) {
  try {
    const result = await db.insert(elections).values(data).returning();
    return result[0];
  } catch (error) {
    console.error('Database insert failed for createElection:', error);
    throw new Error('Database insert failed. Please try again later.', { cause: error });
  }
}

export async function updateElection(id: string, updates: Partial<{
  name: string;
  collegeName: string;
  description: string;
  securityCode: string;
  status: string;
  startDate: string;
  endDate: string;
  allowAbstain: boolean;
  isPublic: boolean;
}>) {
  try {
    const result = await db.update(elections).set(updates).where(eq(elections.id, id)).returning();
    return result[0];
  } catch (error) {
    console.error('Database update failed for updateElection:', error);
    throw new Error('Database update failed. Please try again later.', { cause: error });
  }
}

export async function deleteElection(id: string) {
  try {
    await db.delete(votes).where(eq(votes.electionId, id));
    await db.delete(candidates).where(eq(candidates.electionId, id));
    await db.delete(voters).where(eq(voters.electionId, id));
    return await db.delete(elections).where(eq(elections.id, id)).returning();
  } catch (error) {
    console.error('Database delete failed for deleteElection:', error);
    throw new Error('Database delete failed. Please try again later.', { cause: error });
  }
}

// Voters
export async function getVoters(electionId: string) {
  try {
    return await db.select().from(voters).where(eq(voters.electionId, electionId));
  } catch (error) {
    console.error('Database query failed for getVoters:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function getVoterByRoll(electionId: string, rollNumber: string) {
  try {
    const list = await db
      .select()
      .from(voters)
      .where(and(eq(voters.electionId, electionId), eq(voters.rollNumber, rollNumber)));
    return list[0] || null;
  } catch (error) {
    console.error('Database query failed for getVoterByRoll:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function markVoterVoted(id: string, votedAt: string) {
  try {
    const result = await db
      .update(voters)
      .set({ hasVoted: 'Yes', votedAt })
      .where(eq(voters.id, id))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database update failed for markVoterVoted:', error);
    throw new Error('Database update failed. Please try again later.', { cause: error });
  }
}

// Candidates
export async function getCandidates(electionId: string) {
  try {
    return await db.select().from(candidates).where(eq(candidates.electionId, electionId));
  } catch (error) {
    console.error('Database query failed for getCandidates:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

// Votes
export async function recordVote(vote: {
  id: string;
  electionId: string;
  rollNumber: string;
  candidateId: string;
  position: string;
  securityCode: string;
  voteHash: string;
}) {
  try {
    const result = await db.insert(votes).values(vote).returning();
    // Increment candidate vote count
    await db
      .update(candidates)
      .set({ votes: sql`${candidates.votes} + 1` })
      .where(eq(candidates.id, vote.candidateId));
    return result[0];
  } catch (error) {
    console.error('Database insert failed for recordVote:', error);
    throw new Error('Database insert failed. Please try again later.', { cause: error });
  }
}

// Settings
export async function getElectionSettings() {
  try {
    const list = await db.select().from(electionSettings);
    return list[0] || null;
  } catch (error) {
    console.error('Database query failed for getElectionSettings:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

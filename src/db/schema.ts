import { pgTable, serial, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (Firebase Auth linkage)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Admins table
export const admins = pgTable('admins', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  collegeName: text('college_name').notNull(),
  username: text('username').notNull().unique(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Elections table
export const elections = pgTable('elections', {
  id: text('id').primaryKey(),
  adminId: text('admin_id'),
  name: text('name').notNull(),
  collegeName: text('college_name').notNull(),
  description: text('description'),
  securityCode: text('security_code').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  status: text('status').notNull().default('Upcoming'),
  allowAbstain: boolean('allow_abstain').default(true),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Voters table
export const voters = pgTable('voters', {
  id: text('id').primaryKey(),
  electionId: text('election_id').notNull(),
  rollNumber: text('roll_number').notNull(),
  studentName: text('student_name').notNull(),
  department: text('department'),
  year: text('year'),
  email: text('email'),
  phone: text('phone'),
  hasVoted: text('has_voted').notNull().default('No'),
  votedAt: text('voted_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Candidates table
export const candidates = pgTable('candidates', {
  id: text('id').primaryKey(),
  electionId: text('election_id').notNull(),
  name: text('name').notNull(),
  position: text('position').notNull(),
  symbol: text('symbol'),
  manifesto: text('manifesto'),
  photoUrl: text('photo_url'),
  votes: integer('votes').default(0),
  createdAt: timestamp('created_at').defaultNow(),
});

// Votes table (Audit trail)
export const votes = pgTable('votes', {
  id: text('id').primaryKey(),
  electionId: text('election_id').notNull(),
  rollNumber: text('roll_number').notNull(),
  candidateId: text('candidate_id').notNull(),
  position: text('position').notNull(),
  securityCode: text('security_code').notNull(),
  voteHash: text('vote_hash').notNull(),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Global settings
export const electionSettings = pgTable('election_settings', {
  id: text('id').primaryKey(),
  collegeName: text('college_name').notNull(),
  allowStudentSelfVerify: boolean('allow_student_self_verify').default(true),
  votingTimeLimitMinutes: integer('voting_time_limit_minutes').default(15),
  supportEmail: text('support_email'),
  supportPhone: text('support_phone'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const electionsRelations = relations(elections, ({ many }) => ({
  voters: many(voters),
  candidates: many(candidates),
  votes: many(votes),
}));

export const votersRelations = relations(voters, ({ one }) => ({
  election: one(elections, {
    fields: [voters.electionId],
    references: [elections.id],
  }),
}));

export const candidatesRelations = relations(candidates, ({ one }) => ({
  election: one(elections, {
    fields: [candidates.electionId],
    references: [elections.id],
  }),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  election: one(elections, {
    fields: [votes.electionId],
    references: [elections.id],
  }),
}));

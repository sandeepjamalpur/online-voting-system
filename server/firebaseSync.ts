import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
  Firestore,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

let firestoreDb: Firestore | null = null;

export function initServerFirebase(): Firestore | null {
  try {
    if (firestoreDb) return firestoreDb;

    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      console.warn('[FirebaseSync] firebase-applet-config.json not found');
      return null;
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const app = initializeApp(config, 'voteease-server-firebase');
    firestoreDb = getFirestore(app, config.firestoreDatabaseId);
    console.log('[FirebaseSync] Connected to Firestore database:', config.firestoreDatabaseId);
    return firestoreDb;
  } catch (err: any) {
    console.error('[FirebaseSync] Failed to init Firebase on server:', err.message);
    return null;
  }
}

export async function syncElectionToFirestore(election: any) {
  try {
    const db = initServerFirebase();
    if (!db || !election?.id) return;
    await setDoc(
      doc(db, 'elections', election.id),
      {
        id: election.id,
        adminId: election.adminId || 'admin_1',
        electionName: election.electionName || '',
        collegeName: election.collegeName || '',
        securityCode: election.securityCode || '',
        positions: election.positions || [],
        electionStatus: election.electionStatus || 'Active',
        scheduledDate: election.scheduledDate || null,
        description: election.description || '',
        createdAt: election.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn('[FirebaseSync] Error syncing election to Firestore:', err.message);
  }
}

export async function deleteElectionFromFirestore(electionId: string) {
  try {
    const db = initServerFirebase();
    if (!db || !electionId) return;

    console.log(`[FirebaseSync] Deleting election ${electionId} and all associated data from Firestore...`);

    // 1. Delete all candidate documents in /elections/{electionId}/candidates
    try {
      const candidatesSnap = await getDocs(collection(db, 'elections', electionId, 'candidates'));
      for (const d of candidatesSnap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e: any) {
      console.warn(`[FirebaseSync] Warning deleting candidates subcollection:`, e.message);
    }

    // 2. Delete all voter documents in /elections/{electionId}/voters
    try {
      const votersSnap = await getDocs(collection(db, 'elections', electionId, 'voters'));
      for (const d of votersSnap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e: any) {
      console.warn(`[FirebaseSync] Warning deleting voters subcollection:`, e.message);
    }

    // 3. Delete all vote audit documents in /elections/{electionId}/votes
    try {
      const votesSnap = await getDocs(collection(db, 'elections', electionId, 'votes'));
      for (const d of votesSnap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e: any) {
      console.warn(`[FirebaseSync] Warning deleting votes subcollection:`, e.message);
    }

    // 4. Delete the election document itself in /elections/{electionId}
    await deleteDoc(doc(db, 'elections', electionId));
    console.log(`[FirebaseSync] Election ${electionId} and all subcollections deleted from Firestore.`);
  } catch (err: any) {
    console.warn('[FirebaseSync] Error deleting election from Firestore:', err.message);
  }
}

export async function deleteCandidateFromFirestore(electionId: string, candidateId: string) {
  try {
    const db = initServerFirebase();
    if (!db || !electionId || !candidateId) return;
    await deleteDoc(doc(db, 'elections', electionId, 'candidates', candidateId));
  } catch (err: any) {
    console.warn('[FirebaseSync] Error deleting candidate from Firestore:', err.message);
  }
}

export async function deleteVoterFromFirestore(electionId: string, rollNumber: string) {
  try {
    const db = initServerFirebase();
    if (!db || !electionId || !rollNumber) return;
    const voterDocId = rollNumber.replace(/[^a-zA-Z0-9_\-]/g, '_');
    await deleteDoc(doc(db, 'elections', electionId, 'voters', voterDocId));
  } catch (err: any) {
    console.warn('[FirebaseSync] Error deleting voter from Firestore:', err.message);
  }
}

export async function clearAllVotersFromFirestore(electionId: string) {
  try {
    const db = initServerFirebase();
    if (!db || !electionId) return;
    const votersSnap = await getDocs(collection(db, 'elections', electionId, 'voters'));
    for (const d of votersSnap.docs) {
      await deleteDoc(d.ref);
    }
  } catch (err: any) {
    console.warn('[FirebaseSync] Error clearing voters from Firestore:', err.message);
  }
}

export async function syncCandidateToFirestore(electionId: string, candidate: any) {
  try {
    const db = initServerFirebase();
    if (!db || !electionId || !candidate?.id) return;
    await setDoc(
      doc(db, 'elections', electionId, 'candidates', candidate.id),
      {
        id: candidate.id,
        electionId,
        candidateName: candidate.candidateName,
        position: candidate.position,
        group: candidate.group || 'Independent',
        status: candidate.status || 'Active',
        votesCount: Number(candidate.votesCount || 0),
        serialNumber: Number(candidate.serialNumber || 1),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn('[FirebaseSync] Error syncing candidate to Firestore:', err.message);
  }
}

export async function syncVoterToFirestore(electionId: string, voter: any) {
  try {
    const db = initServerFirebase();
    if (!db || !electionId || !voter?.rollNumber) return;
    const voterDocId = voter.rollNumber.replace(/[^a-zA-Z0-9_\\-]/g, '_');
    await setDoc(
      doc(db, 'elections', electionId, 'voters', voterDocId),
      {
        id: voterDocId,
        electionId,
        rollNumber: voter.rollNumber,
        studentName: voter.studentName || '',
        hasVoted: voter.hasVoted || 'No',
        status: voter.status || 'Active',
        votedAt: voter.votedAt || null,
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn('[FirebaseSync] Error syncing voter to Firestore:', err.message);
  }
}

export async function syncVoteToFirestore(electionId: string, vote: any) {
  try {
    const db = initServerFirebase();
    if (!db || !electionId || !vote?.id) return;
    await setDoc(
      doc(db, 'elections', electionId, 'votes', vote.id),
      {
        id: vote.id,
        electionId,
        rollNumber: vote.rollNumber,
        voteReferenceId: vote.voteReferenceId,
        timestamp: vote.timestamp || new Date().toISOString(),
        date: vote.date || '',
        time: vote.time || '',
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn('[FirebaseSync] Error syncing vote to Firestore:', err.message);
  }
}

export async function syncSettingsToFirestore(settings: any) {
  try {
    const db = initServerFirebase();
    if (!db) return;
    await setDoc(
      doc(db, 'settings', 'global'),
      {
        collegeName: settings.collegeName || '',
        electionName: settings.electionName || '',
        electionStatus: settings.electionStatus || 'Active',
        securityCode: settings.securityCode || '',
        operationMode: settings.operationMode || 'live',
        themeMode: settings.themeMode || 'light',
        resultsMode: settings.resultsMode || 'live',
        scheduledDate: settings.scheduledDate || null,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn('[FirebaseSync] Error syncing settings to Firestore:', err.message);
  }
}

export async function fetchAllElectionsFromFirestore(): Promise<any[]> {
  try {
    const db = initServerFirebase();
    if (!db) return [];
    const snap = await getDocs(collection(db, 'elections'));
    return snap.docs.map((d) => d.data());
  } catch (err: any) {
    console.warn('[FirebaseSync] Could not fetch elections from Firestore:', err.message);
    return [];
  }
}

export async function syncAdminToFirestore(admin: any) {
  try {
    const db = initServerFirebase();
    if (!db || !admin?.id) return;
    await setDoc(
      doc(db, 'admins', admin.id),
      {
        id: admin.id,
        fullName: admin.fullName || '',
        collegeName: admin.collegeName || '',
        username: (admin.username || '').toLowerCase(),
        email: (admin.email || '').toLowerCase(),
        password: admin.password || '', // Stored for simple prototype credential check
        createdAt: admin.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err: any) {
    console.warn('[FirebaseSync] Error syncing admin to Firestore:', err.message);
  }
}

export async function fetchAllAdminsFromFirestore(): Promise<any[]> {
  try {
    const db = initServerFirebase();
    if (!db) return [];
    const snap = await getDocs(collection(db, 'admins'));
    return snap.docs.map((d) => d.data());
  } catch (err: any) {
    console.warn('[FirebaseSync] Could not fetch admins from Firestore:', err.message);
    return [];
  }
}

export async function fetchAdminFromFirestore(identifier: string): Promise<any | null> {
  try {
    const db = initServerFirebase();
    if (!db || !identifier) return null;
    const cleanIdf = identifier.trim().toLowerCase();

    // 1. Try by doc ID
    const directDoc = await getDoc(doc(db, 'admins', cleanIdf));
    if (directDoc.exists()) return directDoc.data();

    // 2. Query by username
    const usernameQuery = query(collection(db, 'admins'), where('username', '==', cleanIdf));
    const userSnap = await getDocs(usernameQuery);
    if (!userSnap.empty) return userSnap.docs[0].data();

    // 3. Query by email
    const emailQuery = query(collection(db, 'admins'), where('email', '==', cleanIdf));
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) return emailSnap.docs[0].data();

    return null;
  } catch (err: any) {
    console.warn('[FirebaseSync] Could not fetch admin from Firestore:', err.message);
    return null;
  }
}


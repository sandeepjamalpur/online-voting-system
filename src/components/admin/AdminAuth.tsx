import React, { useState } from 'react';
import { ShieldCheck, Lock, User, Mail, Building, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { AdminAccount } from '../../types';
import { VoteEaseLogo } from '../VoteEaseLogo';
import { auth, db } from '../../firebase/config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

interface AdminAuthProps {
  onLoginSuccess: (admin: AdminAccount) => void;
  onBackToHome: () => void;
}

export const AdminAuth: React.FC<AdminAuthProps> = ({ onLoginSuccess, onBackToHome }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Register form
  const [fullName, setFullName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginIdentifier.trim() || !loginPassword.trim()) {
      setLoginError('Please enter both username/email and password.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    const idf = loginIdentifier.trim();
    const isEmail = idf.includes('@');

    // Quick login for default officer demo credentials
    if ((idf.toLowerCase() === 'admin' || idf.toLowerCase() === 'jamalpursandeep41@gmail.com') && loginPassword === 'admin') {
      const defaultAdmin: AdminAccount = {
        id: 'admin_1',
        fullName: 'Prof. Sandeep Jamalpur',
        collegeName: '',
        username: 'admin',
        email: 'jamalpursandeep41@gmail.com',
        createdAt: new Date().toISOString(),
      };
      onLoginSuccess(defaultAdmin);
      setLoginLoading(false);
      return;
    }

    try {
      let authenticatedAdmin: AdminAccount | null = null;
      let emailToAuth = isEmail ? idf.toLowerCase() : '';

      // 1. Look up profile in Firebase Firestore database
      try {
        if (!isEmail) {
          const usernameQ = query(collection(db, 'admins'), where('username', '==', idf.toLowerCase()));
          const snap = await getDocs(usernameQ);
          if (!snap.empty) {
            const d = snap.docs[0].data();
            emailToAuth = d.email || '';
            authenticatedAdmin = {
              id: d.id || snap.docs[0].id,
              fullName: d.fullName || '',
              collegeName: d.collegeName || '',
              username: d.username || idf,
              email: d.email || '',
              createdAt: d.createdAt || new Date().toISOString(),
            };
            if (d.password && d.password === loginPassword) {
              onLoginSuccess(authenticatedAdmin);
              return;
            }
          }
        }
      } catch (fsLookupErr) {
        console.warn('Firestore lookup warning:', fsLookupErr);
      }

      // 2. Try Firebase Authentication with email
      if (emailToAuth) {
        try {
          const userCred = await signInWithEmailAndPassword(auth, emailToAuth, loginPassword);
          const user = userCred.user;
          try {
            const adminDocSnap = await getDoc(doc(db, 'admins', user.uid));
            if (adminDocSnap.exists()) {
              const d = adminDocSnap.data();
              authenticatedAdmin = {
                id: user.uid,
                fullName: d.fullName || user.displayName || 'Administrator',
                collegeName: d.collegeName || '',
                username: d.username || idf,
                email: d.email || user.email || '',
                createdAt: d.createdAt || new Date().toISOString(),
              };
            }
          } catch {}
          if (!authenticatedAdmin) {
            authenticatedAdmin = {
              id: user.uid,
              fullName: user.displayName || 'Administrator',
              collegeName: '',
              username: idf,
              email: user.email || emailToAuth,
              createdAt: new Date().toISOString(),
            };
          }
          onLoginSuccess(authenticatedAdmin);
          return;
        } catch (fbAuthErr: any) {
          if (fbAuthErr.code === 'auth/wrong-password' || fbAuthErr.code === 'auth/invalid-credential') {
            throw new Error('Incorrect password. Please try again.');
          }
          console.warn('Firebase Auth sign-in warning:', fbAuthErr);
        }
      }

      // 3. Fallback to server API /api/admin/login
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usernameOrEmail: idf,
            password: loginPassword,
          }),
        });

        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.admin) {
            onLoginSuccess(data.admin);
            return;
          } else if (!res.ok) {
            throw new Error(data.error || 'Authentication failed. Please verify credentials.');
          }
        }
      } catch (apiErr: any) {
        if (apiErr.message?.includes('Authentication failed') || apiErr.message?.includes('credentials') || apiErr.message?.includes('Incorrect password')) {
          throw apiErr;
        }
        console.warn('Server API auth check skipped:', apiErr);
      }

      throw new Error('No administrator found with that username or email. Please check your credentials.');
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!fullName.trim() || !collegeName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setRegError('Please complete all required fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match. Please re-check.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters long for secure authentication.');
      return;
    }

    setRegLoading(true);

    try {
      let firebaseUid = `admin_${Date.now()}`;
      const cleanEmail = regEmail.trim().toLowerCase();
      const cleanUsername = regUsername.trim().toLowerCase();

      // 1. Authenticate with Firebase Authentication
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, regPassword);
        firebaseUid = userCredential.user.uid;
        if (fullName.trim()) {
          try {
            await updateProfile(userCredential.user, { displayName: fullName.trim() });
          } catch {}
        }
      } catch (fbAuthErr: any) {
        if (fbAuthErr.code === 'auth/email-already-in-use') {
          throw new Error('An administrator account with this email address already exists.');
        } else if (fbAuthErr.code === 'auth/weak-password') {
          throw new Error('Password is too weak. Please choose a stronger password.');
        } else if (fbAuthErr.code === 'auth/invalid-email') {
          throw new Error('Invalid email address format.');
        }
        console.warn('Firebase Auth note (saving profile to database):', fbAuthErr);
      }

      const adminData: AdminAccount = {
        id: firebaseUid,
        fullName: fullName.trim(),
        collegeName: collegeName.trim(),
        username: cleanUsername,
        email: cleanEmail,
        createdAt: new Date().toISOString(),
      };

      // 2. Save admin record in Firebase Firestore database
      try {
        await setDoc(doc(db, 'admins', adminData.id), {
          ...adminData,
          password: regPassword,
          updatedAt: new Date().toISOString(),
        });
      } catch (fsErr) {
        console.warn('Firestore database save warning:', fsErr);
      }

      // 3. Sync to backend API (best-effort)
      try {
        await fetch('/api/admin/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName.trim(),
            collegeName: collegeName.trim(),
            username: cleanUsername,
            email: cleanEmail,
            password: regPassword,
          }),
        });
      } catch (apiErr) {
        console.warn('Backend API notification skipped:', apiErr);
      }

      setRegSuccess('Admin account created! Automatically logging you in...');
      setTimeout(() => {
        onLoginSuccess(adminData);
      }, 800);
    } catch (err: any) {
      setRegError(err.message || 'Registration failed.');
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-4.5rem)] bg-[#F8FAF9] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center select-none overflow-hidden">
      {/* Dynamic Background Curved Accents (Matching Website Mockup) */}
      <div className="absolute top-0 right-0 w-[55vw] h-[85vh] pointer-events-none overflow-hidden opacity-40">
        <svg
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full object-cover -translate-y-12 translate-x-24"
        >
          <path
            d="M200 0 C450 150 700 350 800 700 L800 0 Z"
            fill="url(#goldGradientAuth)"
          />
          <path
            d="M400 0 C550 200 750 450 800 800 L800 0 Z"
            fill="url(#greenGradientAuth)"
          />
          <defs>
            <linearGradient id="goldGradientAuth" x1="200" y1="0" x2="800" y2="700" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F59E0B" stopOpacity="0.12" />
              <stop offset="1" stopColor="#D97706" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="greenGradientAuth" x1="400" y1="0" x2="800" y2="800" gradientUnits="userSpaceOnUse">
              <stop stopColor="#10B981" stopOpacity="0.15" />
              <stop offset="1" stopColor="#0B3B2C" stopOpacity="0.05" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
          <div className="bg-gradient-to-r from-[#0B3B2C] via-[#07291F] to-[#041B14] p-6 text-white text-center relative">
            <div className="flex justify-center mb-3">
              <div className="py-2 px-4 rounded-2xl bg-white shadow-sm border border-slate-200">
                <VoteEaseLogo size="sm" />
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Election Officer Portal</h1>
            <p className="text-emerald-200 text-xs mt-1">
              Multi-Election Management & Voting Security System
            </p>

            {/* Toggle Modes Tab */}
            <div className="mt-5 inline-flex p-1 bg-black/30 backdrop-blur-md rounded-xl border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setLoginError(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-[#0B3B2C] text-white shadow-md'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                Admin Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setRegError(null);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  mode === 'register'
                    ? 'bg-[#0B3B2C] text-white shadow-md'
                    : 'text-emerald-200 hover:text-white'
                }`}
              >
                Create Admin Account
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {/* LOGIN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                {loginError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. admin or officer@college.edu"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full mt-2 py-3 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loginLoading ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <span>Sign In to Admin Panel</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* REGISTER FORM */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                {regError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{regError}</span>
                  </div>
                )}
                {regSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{regSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name & Title *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Prof. Sandeep Jamalpur"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    College / Organization Name *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="e.g. University / College Name"
                      className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="e.g. sandeep_admin"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="e.g. admin@ace.edu"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Create password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Confirm Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regLoading}
                  className="w-full mt-3 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {regLoading ? (
                    <span>Registering...</span>
                  ) : (
                    <>
                      <span>Register Admin Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Back button */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onBackToHome}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors cursor-pointer"
              >
                ← Return to Public Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

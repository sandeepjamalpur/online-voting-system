import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Edit2,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  UserCheck,
  UserPlus,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
  PlusCircle,
  FileText,
} from 'lucide-react';
import { User } from '../../types';

interface AdminUsersTabProps {
  onExport: (type: string) => void;
  electionId?: string;
}

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ onExport, electionId }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [votedFilter, setVotedFilter] = useState<'All' | 'Yes' | 'No'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');

  // In-app Delete Confirmation state (fixes iframe window.confirm block)
  const [deleteTargetUser, setDeleteTargetUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Add Single Voter Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRollNumber, setNewRollNumber] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStatus, setNewStatus] = useState<'Active' | 'Inactive'>('Active');
  const [addError, setAddError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Bulk Add Modal state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ added: number; skipped: number } | null>(null);

  // Empty List Confirmation Modal state
  const [isEmptyConfirmOpen, setIsEmptyConfirmOpen] = useState(false);
  const [isEmptying, setIsEmptying] = useState(false);
  const [emptySuccessMsg, setEmptySuccessMsg] = useState<string | null>(null);

  // Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formRollNumber, setFormRollNumber] = useState('');
  const [formStudentName, setFormStudentName] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const url = electionId ? `/api/users?electionId=${encodeURIComponent(electionId)}` : '/api/users';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [electionId]);

  // Handle Add Single Voter
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRollNumber.trim() || !newStudentName.trim()) {
      setAddError('Roll Number and Student Name are both required.');
      return;
    }

    setIsAdding(true);
    setAddError(null);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rollNumber: newRollNumber.trim(),
          studentName: newStudentName.trim(),
          status: newStatus,
          electionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add voter');

      setIsAddModalOpen(false);
      setNewRollNumber('');
      setNewStudentName('');
      setNewStatus('Active');
      await fetchUsers();
    } catch (err: any) {
      setAddError(err.message || 'Operation failed');
    } finally {
      setIsAdding(false);
    }
  };

  // Handle Bulk Add Voters
  const handleBulkAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkText.trim()) {
      setBulkError('Please enter at least one voter record.');
      return;
    }

    const lines = bulkText.split('\n');
    const parsedVoters: { rollNumber: string; studentName: string; status: 'Active' | 'Inactive' }[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Support comma, tab, or hyphen separator
      let roll = '';
      let name = '';

      if (line.includes(',')) {
        const parts = line.split(',');
        roll = parts[0]?.trim() || '';
        name = parts.slice(1).join(',').trim() || '';
      } else if (line.includes('\t')) {
        const parts = line.split('\t');
        roll = parts[0]?.trim() || '';
        name = parts.slice(1).join(' ').trim() || '';
      } else if (line.includes(' - ')) {
        const parts = line.split(' - ');
        roll = parts[0]?.trim() || '';
        name = parts.slice(1).join(' ').trim() || '';
      } else {
        // Just roll number
        roll = line;
        name = `Student (${roll})`;
      }

      if (roll) {
        parsedVoters.push({
          rollNumber: roll,
          studentName: name || `Student (${roll})`,
          status: 'Active',
        });
      }
    }

    if (parsedVoters.length === 0) {
      setBulkError('No valid voter lines detected. Format: RollNumber, StudentName');
      return;
    }

    setIsBulkAdding(true);
    setBulkError(null);

    try {
      const res = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voters: parsedVoters, electionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to bulk import voters');

      setBulkResult({ added: data.added, skipped: data.skipped });
      setBulkText('');
      await fetchUsers();
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setBulkResult(null);
      }, 1500);
    } catch (err: any) {
      setBulkError(err.message || 'Bulk import failed');
    } finally {
      setIsBulkAdding(false);
    }
  };

  // Handle Empty All Voters
  const handleEmptyAllUsers = async () => {
    setIsEmptying(true);
    try {
      const res = await fetch('/api/users/clear-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to empty voters list');

      setIsEmptyConfirmOpen(false);
      setEmptySuccessMsg('All voters have been removed. The voters list is now completely empty.');
      await fetchUsers();
      setTimeout(() => setEmptySuccessMsg(null), 4000);
    } catch (err: any) {
      setEmptySuccessMsg(err.message || 'Failed to empty voters list');
    } finally {
      setIsEmptying(false);
    }
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setFormRollNumber(user.rollNumber);
    setFormStudentName(user.studentName);
    setFormStatus(user.status);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentName.trim()) {
      setEditError('Student Name is required.');
      return;
    }

    if (!editingUser) return;

    setIsSaving(true);
    setEditError(null);

    try {
      const electionParam = electionId ? `?electionId=${encodeURIComponent(electionId)}` : '';
      const res = await fetch(`/api/users/${encodeURIComponent(editingUser.rollNumber)}${electionParam}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: formStudentName.trim(),
          status: formStatus,
          electionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update student');

      setIsEditModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setEditError(err.message || 'Operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Click delete button -> opens in-app confirmation modal
  const handleInitiateDelete = (user: User) => {
    setDeleteTargetUser(user);
  };

  // User confirms delete inside modal
  const handleConfirmDeleteUser = async () => {
    if (!deleteTargetUser) return;
    setIsDeleting(true);

    try {
      const electionParam = electionId ? `?electionId=${encodeURIComponent(electionId)}` : '';
      const res = await fetch(`/api/users/${encodeURIComponent(deleteTargetUser.rollNumber)}${electionParam}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete student');
      }
      setDeleteTargetUser(null);
      await fetchUsers();
    } catch (err: any) {
      console.error(err.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (rollNumber: string) => {
    try {
      const electionParam = electionId ? `?electionId=${encodeURIComponent(electionId)}` : '';
      const res = await fetch(`/api/users/${encodeURIComponent(rollNumber)}/toggle-status${electionParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionId }),
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      await fetchUsers();
    } catch (err: any) {
      console.error(err.message || 'Failed to toggle status');
    }
  };

  // Filtered users list
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.studentName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesVoted = votedFilter === 'All' ? true : u.hasVoted === votedFilter;
    const matchesStatus = statusFilter === 'All' ? true : u.status === statusFilter;

    return matchesSearch && matchesVoted && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900">Voter Roster &amp; Eligibility</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-[#0B3B2C] border border-emerald-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-700" /> Listed Voters Only
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Only pre-listed students can vote. Unlisted roll numbers are blocked from casting a ballot.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setNewRollNumber('');
              setNewStudentName('');
              setNewStatus('Active');
              setAddError(null);
              setIsAddModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B3B2C] hover:bg-[#07291F] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            id="add-voter-btn"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Voter</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setBulkText('');
              setBulkError(null);
              setBulkResult(null);
              setIsBulkModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-[#0B3B2C] border border-emerald-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            id="bulk-add-voters-btn"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Bulk Add</span>
          </button>

          <button
            type="button"
            onClick={() => onExport('users')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            id="export-users-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export (.xlsx)</span>
          </button>

          {users.length > 0 && (
            <button
              type="button"
              onClick={() => setIsEmptyConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              id="empty-voters-list-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty List</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Banner if emptied */}
      {emptySuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-xs font-medium animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{emptySuccessMsg}</span>
        </div>
      )}

      {/* Strict Voter Policy Notice Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#0B3B2C] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
          <Lock className="w-4 h-4" />
        </div>
        <div className="text-xs space-y-0.5 text-emerald-950">
          <p className="font-bold text-emerald-950">
            Strict Eligibility Enforced: Only Listed Voters Are Eligible to Vote
          </p>
          <p className="text-emerald-800 leading-relaxed">
            Every voter must be registered on this roster with an &ldquo;Active&rdquo; status to cast their ballot. Students not in this list will receive a &ldquo;Not Registered to Vote&rdquo; notification upon entering their roll number.
          </p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Roll Number or Name..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Has Voted:</span>
            <select
              value={votedFilter}
              onChange={(e) => setVotedFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-hidden"
            >
              <option value="All">All Statuses</option>
              <option value="Yes">Voted (Yes)</option>
              <option value="No">Not Voted (No)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Account:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-hidden"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <span className="text-xs text-slate-400 ml-auto md:ml-0 font-medium">
            Showing {filteredUsers.length} of {users.length} voters
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Roll Number</th>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Account Status</th>
                <th className="py-3.5 px-4">Has Voted</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-emerald-700 mb-2" />
                    <span>Loading voters from Excel database...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Users className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-slate-800">
                          Voters List Is Empty
                        </h4>
                        <p className="text-xs text-slate-500">
                          All voters have been emptied from the database. No students are currently eligible to vote until added to this roster.
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setNewRollNumber('');
                            setNewStudentName('');
                            setNewStatus('Active');
                            setAddError(null);
                            setIsAddModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B3B2C] hover:bg-[#07291F] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add Voter</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setBulkText('');
                            setBulkError(null);
                            setBulkResult(null);
                            setIsBulkModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>Bulk Import</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No voters match the current search / filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.rollNumber} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {user.rollNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-semibold">
                      {user.studentName}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(user.rollNumber)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                          user.status === 'Active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle status"
                      >
                        {user.status === 'Active' ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-slate-500" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          user.hasVoted === 'Yes'
                            ? 'bg-emerald-100 text-[#0B3B2C]'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {user.hasVoted === 'Yes' ? '✓ Voted (Yes)' : '○ Not Voted (No)'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Voter"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleInitiateDelete(user)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center border border-transparent hover:border-rose-200"
                        title="Delete Voter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD SINGLE VOTER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-700" />
                <h3 className="text-lg font-bold text-slate-900">Add Eligible Voter</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newRollNumber}
                  onChange={(e) => setNewRollNumber(e.target.value)}
                  placeholder="e.g. 2024-CSE-001, 1004, MECH/23/045"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden font-mono"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 bg-white focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden font-medium"
                >
                  <option value="Active">Active (Eligible to Vote)</option>
                  <option value="Inactive">Inactive (Blocked from Voting)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAdding}
                  className="px-5 py-2 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{isAdding ? 'Adding...' : 'Add to Roster'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BULK ADD VOTERS MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                <h3 className="text-lg font-bold text-slate-900">Bulk Add Eligible Voters</h3>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Paste voter records below (one per line). Format: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">RollNumber, StudentName</code> or simply <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">RollNumber</code>.
            </p>

            {bulkError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{bulkError}</span>
              </div>
            )}

            {bulkResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>Successfully added {bulkResult.added} voters ({bulkResult.skipped} duplicates/empty skipped).</span>
              </div>
            )}

            <form onSubmit={handleBulkAdd} className="space-y-4">
              <div>
                <textarea
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={8}
                  placeholder={`22A91A0501, Rahul Kumar\n2024-CSE-002, Kiran Kumar\nMECH/23/045, Arjun Verma\n1004, Sneha Patel`}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden font-mono leading-relaxed"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <span className="text-[11px] text-slate-400">
                  {bulkText.split('\n').filter((l) => l.trim().length > 0).length} lines entered
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isBulkAdding || !bulkText.trim()}
                    className="px-5 py-2 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] disabled:opacity-50 text-white text-xs font-semibold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    {isBulkAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
                    <span>{isBulkAdding ? 'Importing...' : 'Import All Voters'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EMPTY ALL VOTERS CONFIRMATION MODAL */}
      {isEmptyConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4 text-center">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full mx-auto flex items-center justify-center shadow-xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Empty All Voters List?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will delete all <span className="font-bold text-rose-600">{users.length}</span> students currently in the voter roster.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-left text-xs text-rose-800 space-y-1">
              <p className="font-semibold">Important:</p>
              <p className="text-[11px] leading-relaxed">
                Since only listed voters can vote, emptying the voter roster means no students can vote until new voters are added.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEmptyConfirmOpen(false)}
                disabled={isEmptying}
                className="w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmptyAllUsers}
                disabled={isEmptying}
                className="w-1/2 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                {isEmptying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isEmptying ? 'Emptying...' : 'Yes, Empty All'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT USER MODAL */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                Edit Voter Details
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Roll Number
                </label>
                <div className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-800">
                  {formRollNumber}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student Name
                </label>
                <input
                  type="text"
                  value={formStudentName}
                  onChange={(e) => setFormStudentName(e.target.value)}
                  placeholder="e.g. Arvind Swamy"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden font-medium"
                >
                  <option value="Active">Active (Eligible to Vote)</option>
                  <option value="Inactive">Inactive (Blocked from Voting)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Update Voter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Remove Eligible Voter?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to remove <span className="font-bold text-slate-800">{deleteTargetUser.studentName}</span> (
                <span className="font-mono font-bold text-[#0B3B2C]">{deleteTargetUser.rollNumber}</span>) from the eligible voter roster?
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                This student will no longer be permitted to log in or cast a vote in this election.
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirm Delete</span>
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

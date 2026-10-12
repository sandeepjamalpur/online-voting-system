import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  LayoutGrid,
  Table as TableIcon,
  Check,
  UserCheck,
  Camera,
  Image as ImageIcon,
  Upload,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { Candidate } from '../../types';

interface AdminCandidatesTabProps {
  onExport: (type: string) => void;
  electionId?: string;
  electionPositions?: string[];
}

// Preset professional portrait avatars for quick candidate setup
const PRESET_AVATARS = [
  {
    name: 'Portrait 1 (F)',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Portrait 2 (M)',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Portrait 3 (F)',
    url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Portrait 4 (M)',
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Portrait 5 (F)',
    url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80',
  },
  {
    name: 'Portrait 6 (M)',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  },
];

// Helper: Resize & optimize local image files using offscreen canvas to keep payloads lean
const resizeImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Please select a valid image file (PNG, JPG, JPEG, WEBP).'));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDimension = 360;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for optimization.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.readAsDataURL(file);
  });
};

export const AdminCandidatesTab: React.FC<AdminCandidatesTabProps> = ({
  onExport,
  electionId,
  electionPositions,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Authoritative positions for this election
  const positionsList =
    electionPositions && electionPositions.length > 0
      ? electionPositions
      : Array.from(new Set(candidates.map((c) => c.position)));

  // In-app Delete Confirmation state
  const [deleteTargetCandidate, setDeleteTargetCandidate] = useState<Candidate | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Full Add/Edit Candidate Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCand, setEditingCand] = useState<Candidate | null>(null);
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formPosition, setFormPosition] = useState('');
  const [customPositionInput, setCustomPositionInput] = useState('');
  const [formGroup, setFormGroup] = useState('');
  const [formImagePath, setFormImagePath] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Dedicated "Edit Photo" Modal State
  const [photoEditCand, setPhotoEditCand] = useState<Candidate | null>(null);
  const [photoEditUrl, setPhotoEditUrl] = useState('');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Quick inline name editing state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineNameValue, setInlineNameValue] = useState('');
  const [inlineSavingId, setInlineSavingId] = useState<string | null>(null);

  const fetchCandidates = async () => {
    try {
      setIsLoading(true);
      const url = electionId ? `/api/candidates?electionId=${encodeURIComponent(electionId)}` : '/api/candidates';
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load candidates');
      const data = await res.json();
      setCandidates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [electionId]);

  const getNextCandidateIdForPosition = (pos: string): string => {
    const posCandidates = candidates.filter(
      (c) => c.position.toLowerCase() === pos.trim().toLowerCase()
    );
    const posSerial = posCandidates.length + 1;
    const prefix = pos.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'CAN';
    return `${prefix}-${String(posSerial).padStart(2, '0')}`;
  };

  const handleOpenAddModal = () => {
    setEditingCand(null);
    const initialPos =
      electionPositions && electionPositions.length > 0
        ? electionPositions[0]
        : positionsList[0] || 'President';
    setFormPosition(initialPos);
    setFormId(getNextCandidateIdForPosition(initialPos));
    setFormName('');
    setCustomPositionInput('');
    setFormGroup('Independent');
    setFormImagePath('');
    setFormStatus('Active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cand: Candidate) => {
    setEditingCand(cand);
    setFormId(cand.candidateId);
    setFormName(cand.candidateName);
    setFormPosition(cand.position);
    setCustomPositionInput('');
    setFormGroup(cand.group || '');
    setFormImagePath(cand.imagePath || '');
    setFormStatus(cand.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open the dedicated Photo Editor Modal
  const handleOpenPhotoModal = (cand: Candidate) => {
    setPhotoEditCand(cand);
    setPhotoEditUrl(cand.imagePath || '');
    setPhotoError(null);
  };

  // Handle uploading and processing local photo from device
  const handleFileSelectForPhotoModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      setPhotoError(null);
      const optimizedDataUrl = await resizeImageFile(file);
      setPhotoEditUrl(optimizedDataUrl);
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to process image file');
    } finally {
      setIsProcessingPhoto(false);
      if (photoFileInputRef.current) photoFileInputRef.current.value = '';
    }
  };

  // Handle uploading and processing local photo in the full add/edit modal
  const handleFileSelectForMainModal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      setFormError(null);
      const optimizedDataUrl = await resizeImageFile(file);
      setFormImagePath(optimizedDataUrl);
    } catch (err: any) {
      setFormError(err.message || 'Failed to process image file');
    } finally {
      setIsProcessingPhoto(false);
      if (modalFileInputRef.current) modalFileInputRef.current.value = '';
    }
  };

  // Save updated photo directly to the server
  const handleSavePhotoModal = async () => {
    if (!photoEditCand) return;
    setIsSavingPhoto(true);
    setPhotoError(null);

    try {
      const electionParam = electionId ? `?electionId=${encodeURIComponent(electionId)}` : '';
      const res = await fetch(`/api/candidates/${encodeURIComponent(photoEditCand.candidateId)}/photo${electionParam}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagePath: photoEditUrl.trim(),
          electionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update candidate photo');

      // Update candidate locally
      setCandidates((prev) =>
        prev.map((c) =>
          c.candidateId === photoEditCand.candidateId
            ? { ...c, imagePath: photoEditUrl.trim() }
            : c
        )
      );

      setPhotoEditCand(null);
    } catch (err: any) {
      setPhotoError(err.message || 'Failed to save candidate photo');
    } finally {
      setIsSavingPhoto(false);
    }
  };

  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPosition =
      formPosition === '__custom__'
        ? customPositionInput.trim()
        : formPosition.trim();

    if (!formId.trim() || !formName.trim() || !finalPosition) {
      setFormError('Candidate ID, Name, and Position are required.');
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      const electionParam = electionId ? `?electionId=${encodeURIComponent(electionId)}` : '';

      if (editingCand) {
        // Edit existing member
        const res = await fetch(`/api/candidates/${encodeURIComponent(editingCand.candidateId)}${electionParam}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateName: formName.trim(),
            position: finalPosition,
            group: formGroup.trim(),
            imagePath: formImagePath.trim(),
            status: formStatus,
            electionId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update candidate member');
      } else {
        // Add new member
        const res = await fetch(`/api/candidates${electionParam}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId: formId.trim().toUpperCase(),
            candidateName: formName.trim(),
            position: finalPosition,
            group: formGroup.trim(),
            imagePath: formImagePath.trim(),
            status: formStatus,
            electionId,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add candidate member');
      }

      setIsModalOpen(false);
      await fetchCandidates();
    } catch (err: any) {
      setFormError(err.message || 'Operation failed');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick inline name save (preserves existing photo)
  const handleStartInlineEdit = (cand: Candidate) => {
    setInlineEditingId(cand.candidateId);
    setInlineNameValue(cand.candidateName);
  };

  const handleCancelInlineEdit = () => {
    setInlineEditingId(null);
    setInlineNameValue('');
  };

  const handleSaveInlineName = async (cand: Candidate) => {
    const trimmed = inlineNameValue.trim();
    if (!trimmed) return;
    if (trimmed === cand.candidateName) {
      setInlineEditingId(null);
      return;
    }

    setInlineSavingId(cand.candidateId);
    try {
      const electionParam = electionId ? `?electionId=${encodeURIComponent(electionId)}` : '';
      const res = await fetch(`/api/candidates/${encodeURIComponent(cand.candidateId)}${electionParam}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: trimmed,
          position: cand.position,
          group: cand.group,
          status: cand.status,
          imagePath: cand.imagePath || '',
          electionId,
        }),
      });
      if (!res.ok) throw new Error('Failed to update member name');
      setInlineEditingId(null);
      await fetchCandidates();
    } catch (err: any) {
      console.error(err.message || 'Failed to update name');
    } finally {
      setInlineSavingId(null);
    }
  };

  const handleInitiateDelete = (cand: Candidate) => {
    setDeleteTargetCandidate(cand);
  };

  const handleConfirmDeleteCandidate = async () => {
    if (!deleteTargetCandidate) return;
    setIsDeleting(true);

    try {
      const electionParam = electionId ? `?electionId=${encodeURIComponent(electionId)}` : '';
      const res = await fetch(`/api/candidates/${encodeURIComponent(deleteTargetCandidate.candidateId)}${electionParam}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete candidate');
      }
      setDeleteTargetCandidate(null);
      await fetchCandidates();
    } catch (err: any) {
      console.error(err.message || 'Failed to delete candidate');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (candidateId: string) => {
    try {
      const electionParam = electionId ? `?electionId=${encodeURIComponent(electionId)}` : '';
      const res = await fetch(`/api/candidates/${encodeURIComponent(candidateId)}/toggle-status${electionParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ electionId }),
      });
      if (!res.ok) throw new Error('Failed to toggle status');
      await fetchCandidates();
    } catch (err: any) {
      console.error(err.message || 'Failed to toggle status');
    }
  };

  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch =
      c.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.candidateId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.group && c.group.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesPosition = positionFilter === 'All' ? true : c.position === positionFilter;

    return matchesSearch && matchesPosition;
  });

  // Group filtered candidates by position so that after each position ends,
  // serial numbers restart starting at #1 for that specific position
  const getGroupedCandidatesByPosition = () => {
    const groups: { position: string; items: Candidate[] }[] = [];
    const processed = new Set<string>();

    // 1. Defined election positions in order
    positionsList.forEach((pos) => {
      const items = filteredCandidates.filter((c) => c.position.toLowerCase() === pos.toLowerCase());
      if (items.length > 0) {
        groups.push({ position: pos, items });
        processed.add(pos.toLowerCase());
      }
    });

    // 2. Any remaining custom positions
    filteredCandidates.forEach((c) => {
      const p = c.position || 'General';
      if (!processed.has(p.toLowerCase())) {
        const items = filteredCandidates.filter((x) => x.position.toLowerCase() === p.toLowerCase());
        groups.push({ position: p, items });
        processed.add(p.toLowerCase());
      }
    });

    return groups;
  };

  const getInitials = (name: string) => {
    const clean = name.trim();
    if (!clean) return 'C';
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getMonogramColor = (id: string) => {
    const colors = [
      'bg-[#0B3B2C] text-white',
      'bg-[#0B3B2C] text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white',
      'bg-rose-600 text-white',
      'bg-cyan-600 text-white',
      'bg-violet-600 text-white',
      'bg-teal-600 text-white',
    ];
    let sum = 0;
    for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
    return colors[sum % colors.length];
  };

  // Reusable avatar component with image error fallback & hover camera edit trigger
  const CandidatePhotoAvatar: React.FC<{
    cand: Candidate;
    size?: 'sm' | 'md' | 'lg';
    showCameraBtn?: boolean;
  }> = ({ cand, size = 'md', showCameraBtn = true }) => {
    const [imgFailed, setImgFailed] = useState(false);

    useEffect(() => {
      setImgFailed(false);
    }, [cand.imagePath]);

    const hasPhoto = Boolean(cand.imagePath && cand.imagePath.trim() && !imgFailed);

    const sizeClass =
      size === 'sm'
        ? 'w-10 h-10 rounded-xl text-xs'
        : size === 'lg'
        ? 'w-20 h-20 rounded-2xl text-xl'
        : 'w-12 h-12 rounded-xl text-xs';

    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          handleOpenPhotoModal(cand);
        }}
        className="relative group shrink-0 cursor-pointer"
        title="Click to Change / Edit Candidate Photo"
      >
        {hasPhoto ? (
          <img
            src={cand.imagePath}
            alt={cand.candidateName}
            onError={() => setImgFailed(true)}
            className={`${sizeClass} object-cover border-2 border-slate-200 shadow-xs group-hover:border-emerald-500 transition-colors`}
          />
        ) : (
          <div
            className={`${sizeClass} font-extrabold flex items-center justify-center shadow-xs border-2 border-white group-hover:scale-105 transition-transform ${getMonogramColor(
              cand.candidateId
            )}`}
          >
            {getInitials(cand.candidateName)}
          </div>
        )}

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold pointer-events-none">
          <Camera className="w-4 h-4 mb-0.5" />
          <span>Edit Photo</span>
        </div>

        {showCameraBtn && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenPhotoModal(cand);
            }}
            className="absolute -bottom-1.5 -right-1.5 bg-[#0B3B2C] hover:bg-[#07291F] text-white p-1.5 rounded-full shadow-md border-2 border-white transition-transform hover:scale-115 cursor-pointer z-10"
            title="Edit Photo"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-slate-900">Council Members & Candidates</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <Camera className="w-3 h-3" /> Photo Upload & Editing Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage candidate profiles with official photos, office nominations, and real-time ballot status.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cards</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table Directory View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => onExport('candidates')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            id="export-candidates-btn"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (filteredCandidates.length > 0) {
                handleOpenPhotoModal(filteredCandidates[0]);
              } else if (candidates.length > 0) {
                handleOpenPhotoModal(candidates[0]);
              } else {
                handleOpenAddModal();
              }
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B3B2C] hover:bg-[#07291F] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer hover:shadow-emerald-900/20"
            id="top-quick-photo-btn"
            title="Upload or Change Candidate Photo"
          >
            <Camera className="w-4 h-4" />
            <span>Upload / Edit Photo</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0B3B2C] hover:bg-[#07291F] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            id="add-candidate-btn"
          >
            <Plus className="w-4 h-4" />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* Info notice explaining Photo Editing Options */}
      <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#0B3B2C] text-white flex items-center justify-center shrink-0 shadow-xs">
            <Camera className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-700 space-y-0.5">
            <p className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <span>Candidate Photo Upload & Editing</span>
              <span className="text-[10px] bg-[#0B3B2C] text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Photo Option Active
              </span>
            </p>
            <p className="text-slate-600">
              Click the <strong className="text-[#0B3B2C] font-bold">"📸 Edit Photo"</strong> button or tap any candidate avatar to upload a photo from your device (JPG/PNG), paste an image URL, or pick from presets.
            </p>
          </div>
        </div>

        {filteredCandidates.length > 0 && (
          <button
            type="button"
            onClick={() => handleOpenPhotoModal(filteredCandidates[0])}
            className="px-3.5 py-2 bg-[#0B3B2C] hover:bg-[#07291F] text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Edit First Candidate Photo</span>
          </button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search member name, ID, or position..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Position:</span>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-medium focus:outline-hidden"
            >
              <option value="All">All Positions</option>
              {positionsList.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-400 ml-auto md:ml-0 font-medium">
            Showing {filteredCandidates.length} of {candidates.length} members
          </span>
        </div>
      </div>

      {/* Main Content: Table View or Grid View */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-700 mb-2" />
          <p className="text-xs">Loading council members from database...</p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 text-xs">
          No members found matching the selected filter.
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW WITH POSITION-SPECIFIC SERIAL NUMBERS */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 w-16 text-center">S.No</th>
                  <th className="py-3 px-4">Member / Candidate</th>
                  <th className="py-3 px-4">Candidate ID</th>
                  <th className="py-3 px-4">Position / Office</th>
                  <th className="py-3 px-4">Party / Group</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {getGroupedCandidatesByPosition().map((group) => (
                  <React.Fragment key={group.position}>
                    {/* Position Section Divider: Clarifies that serial numbers restart at #1 for each position */}
                    <tr className="bg-slate-100/90 border-y border-slate-200">
                      <td colSpan={7} className="py-2.5 px-4 font-bold text-[#0B3B2C] text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
                            <span className="uppercase tracking-wider font-extrabold text-[#0B3B2C]">
                              Position: {group.position}
                            </span>
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              {group.items.length} {group.items.length === 1 ? 'Candidate' : 'Candidates'}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-semibold bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                            Serial Numbers for this position: #1 to #{group.items.length}
                          </span>
                        </div>
                      </td>
                    </tr>

                    {/* Candidates for this specific position: S.No restarts at #1 */}
                    {group.items.map((cand, candIdx) => {
                      const positionSerial = candIdx + 1;
                      const isInlineEditing = inlineEditingId === cand.candidateId;
                      const isInlineSaving = inlineSavingId === cand.candidateId;

                      return (
                        <tr key={cand.candidateId} className="hover:bg-slate-50/70 transition-colors">
                          {/* S.No column: restarts from 1 for each specific position */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 text-[#0B3B2C] font-mono font-black text-xs border border-emerald-200 shadow-2xs">
                              #{positionSerial}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              {/* Photo Avatar with Camera Button */}
                              <CandidatePhotoAvatar cand={cand} size="md" />

                              <div className="flex-1 min-w-[200px]">
                                {isInlineEditing ? (
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      value={inlineNameValue}
                                      onChange={(e) => setInlineNameValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveInlineName(cand);
                                        if (e.key === 'Escape') handleCancelInlineEdit();
                                      }}
                                      className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden bg-white text-slate-900 w-full"
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSaveInlineName(cand)}
                                      disabled={isInlineSaving}
                                      className="p-1 rounded bg-[#0B3B2C] text-white hover:bg-[#07291F] cursor-pointer"
                                      title="Save Name"
                                    >
                                      {isInlineSaving ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelInlineEdit}
                                      className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300 cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 group">
                                    <span className="font-bold text-slate-900 text-sm">
                                      {cand.candidateName}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleStartInlineEdit(cand)}
                                      className="opacity-0 group-hover:opacity-100 text-emerald-700 hover:text-[#0B3B2C] p-1 rounded hover:bg-emerald-50 transition-opacity cursor-pointer text-[11px] font-medium"
                                      title="Quick rename"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                            {cand.candidateId}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-block font-semibold text-[#0B3B2C] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-xs">
                              {cand.position}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 font-medium">
                            {cand.group || 'Independent'}
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(cand.candidateId)}
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border cursor-pointer ${
                                cand.status === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                              }`}
                              title="Click to toggle status"
                            >
                              {cand.status === 'Active' ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  <span>Active</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3 h-3 text-slate-400" />
                                  <span>Inactive</span>
                                </>
                              )}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenPhotoModal(cand)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0B3B2C] hover:bg-[#07291F] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                                title="Edit / Upload Candidate Photo"
                              >
                                <Camera className="w-3.5 h-3.5" />
                                <span>Edit Photo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(cand)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                <span>Edit Info & Photo</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleInitiateDelete(cand)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                title="Delete candidate"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW GROUPED BY POSITION */
        <div className="space-y-8">
          {getGroupedCandidatesByPosition().map((group) => (
            <div key={group.position} className="space-y-3.5">
              {/* Position Header Banner */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#0B3B2C]">
                    Position: {group.position}
                  </h3>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {group.items.length} {group.items.length === 1 ? 'Nominee' : 'Nominees'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  Serial: #1 to #{group.items.length}
                </span>
              </div>

              {/* Cards Grid for this specific position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.items.map((cand, candIdx) => {
                  const positionSerial = candIdx + 1;
                  const isInlineEditing = inlineEditingId === cand.candidateId;
                  const isInlineSaving = inlineSavingId === cand.candidateId;

                  return (
                    <div
                      key={cand.candidateId}
                      className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Top position badge & serial number */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-[#0B3B2C] text-white text-[11px] font-mono font-bold shadow-2xs">
                              S.No #{positionSerial}
                            </span>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B3B2C] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              {cand.position}
                            </span>
                          </div>

                          <button
                            onClick={() => handleToggleStatus(cand.candidateId)}
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer ${
                              cand.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                            title="Click to toggle status"
                          >
                            {cand.status === 'Active' ? 'Active' : 'Inactive'}
                          </button>
                        </div>

                        {/* Photo & Member Info */}
                        <div className="flex items-start gap-4 mb-3">
                          <div className="flex flex-col items-center shrink-0">
                            <CandidatePhotoAvatar cand={cand} size="lg" />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenPhotoModal(cand);
                              }}
                              className="mt-2 w-full text-[11px] font-bold text-[#0B3B2C] hover:text-white bg-emerald-50 hover:bg-[#0B3B2C] border border-emerald-200 py-1 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                              title="Change Candidate Photo"
                            >
                              <Camera className="w-3 h-3" />
                              <span>Change</span>
                            </button>
                          </div>

                          <div className="flex-1 min-w-0">
                            {isInlineEditing ? (
                              <div className="space-y-1.5">
                                <input
                                  type="text"
                                  value={inlineNameValue}
                                  onChange={(e) => setInlineNameValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveInlineName(cand);
                                    if (e.key === 'Escape') handleCancelInlineEdit();
                                  }}
                                  className="w-full px-2.5 py-1 text-xs font-semibold rounded-lg border border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden bg-white text-slate-900"
                                  autoFocus
                                />
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSaveInlineName(cand)}
                                    disabled={isInlineSaving}
                                    className="px-2 py-0.5 rounded bg-[#0B3B2C] text-white text-[10px] font-bold hover:bg-[#07291F] cursor-pointer inline-flex items-center gap-1"
                                  >
                                    {isInlineSaving && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                                    Save Name
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleCancelInlineEdit}
                                    className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold hover:bg-slate-300 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center justify-between gap-1">
                                  <h3 className="font-bold text-slate-900 text-base leading-snug truncate">
                                    {cand.candidateName}
                                  </h3>
                                  <button
                                    type="button"
                                    onClick={() => handleStartInlineEdit(cand)}
                                    className="text-slate-400 hover:text-[#0B3B2C] p-1 rounded hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Quick edit name"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="text-[11px] text-slate-500 font-mono font-medium">
                                  ID: {cand.candidateId}
                                </p>
                                <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                                  {cand.group || 'Independent'}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer Action Buttons */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenPhotoModal(cand)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-[#0B3B2C] hover:bg-[#07291F] text-white rounded-xl shadow-xs transition-colors cursor-pointer"
                            title="Upload or change photo for this candidate"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Edit Photo</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(cand)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors cursor-pointer border border-slate-200"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit Info & Photo</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleInitiateDelete(cand)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DEDICATED "EDIT PHOTO" MODAL */}
      {photoEditCand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Edit Candidate Photo
                  </h3>
                  <p className="text-xs text-slate-500">
                    {photoEditCand.candidateName} • <span className="font-mono">{photoEditCand.candidateId}</span> ({photoEditCand.position})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPhotoEditCand(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {photoError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{photoError}</span>
              </div>
            )}

            {/* Photo Preview Section */}
            <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="relative shrink-0">
                {photoEditUrl ? (
                  <img
                    src={photoEditUrl}
                    alt="Preview"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-white shadow-md"
                    onError={() => {
                      setPhotoError('Image link cannot be loaded. Please check the URL or upload a file.');
                    }}
                  />
                ) : (
                  <div
                    className={`w-24 h-24 rounded-2xl font-extrabold text-2xl flex items-center justify-center border-2 border-white shadow-md ${getMonogramColor(
                      photoEditCand.candidateId
                    )}`}
                  >
                    {getInitials(photoEditCand.candidateName)}
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2 text-center sm:text-left">
                <h4 className="text-sm font-bold text-slate-900">Current Photo Preview</h4>
                <p className="text-xs text-slate-500">
                  {photoEditUrl
                    ? 'This photo will appear on the voting ballot and council directory.'
                    : 'Currently showing initials monogram. Upload a photo or select a preset below.'}
                </p>

                {photoEditUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoEditUrl('')}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo (Use Monogram)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Upload Option 1: File from Computer */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                1. Upload Image from Your Device
              </label>
              <input
                ref={photoFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                onChange={handleFileSelectForPhotoModal}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoFileInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="w-full py-3 px-4 border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-2xl text-xs font-semibold text-slate-700 hover:text-[#0B3B2C] flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {isProcessingPhoto ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                    <span>Optimizing image...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-emerald-700" />
                    <span>Choose Photo File (JPG, PNG, WEBP)</span>
                  </>
                )}
              </button>
            </div>

            {/* Upload Option 2: Image URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                2. Or Enter Image Web Link (URL)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={photoEditUrl}
                  onChange={(e) => {
                    setPhotoEditUrl(e.target.value);
                    setPhotoError(null);
                  }}
                  placeholder="https://example.com/photos/candidate.jpg"
                  className="w-full pl-9 pr-4 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden"
                />
                <ImageIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* Upload Option 3: Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  3. Or Quick Select Preset Portrait
                </label>
                <span className="text-[11px] text-slate-400">Default portraits</span>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPhotoEditUrl(preset.url)}
                    className={`relative rounded-xl overflow-hidden aspect-square border-2 transition-all cursor-pointer hover:scale-105 ${
                      photoEditUrl === preset.url
                        ? 'border-[#0B3B2C] ring-2 ring-emerald-500/30'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                    title={preset.name}
                  >
                    <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                    {photoEditUrl === preset.url && (
                      <div className="absolute inset-0 bg-[#0B3B2C]/30 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPhotoEditCand(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePhotoModal}
                disabled={isSavingPhoto}
                className="px-6 py-2.5 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isSavingPhoto ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Photo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL ADD / EDIT CANDIDATE MODAL (WITH PHOTO CONTROLS) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingCand ? `Edit Member: ${editingCand.candidateName}` : 'Add Candidate Member'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update candidate credentials, office, party affiliation, and portrait photo.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCandidate} className="space-y-4">
              {/* Photo Upload & Preview within Add/Edit Form */}
              <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Candidate Photo / Portrait</span>
                  </label>
                  {formImagePath && (
                    <button
                      type="button"
                      onClick={() => setFormImagePath('')}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-4">
                  <div className="relative shrink-0">
                    {formImagePath ? (
                      <img
                        src={formImagePath}
                        alt="Preview"
                        className="w-18 h-18 rounded-2xl object-cover border-2 border-white shadow-md"
                        onError={() => setFormImagePath('')}
                      />
                    ) : (
                      <div
                        className={`w-18 h-18 rounded-2xl font-extrabold text-xl flex items-center justify-center border-2 border-white shadow-md ${getMonogramColor(
                          formId || 'C001'
                        )}`}
                      >
                        {getInitials(formName || 'New')}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <input
                      ref={modalFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelectForMainModal}
                      className="hidden"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => modalFileInputRef.current?.click()}
                        disabled={isProcessingPhoto}
                        className="px-3.5 py-1.5 bg-[#0B3B2C] hover:bg-[#07291F] text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {isProcessingPhoto ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Upload Photo from Device</span>
                      </button>
                    </div>

                    <input
                      type="url"
                      value={formImagePath}
                      onChange={(e) => setFormImagePath(e.target.value)}
                      placeholder="Or paste direct image URL (https://...)"
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-white focus:border-[#0B3B2C] outline-hidden"
                    />

                    {/* Quick Preset Avatars Chips */}
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                        Or pick a portrait:
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {PRESET_AVATARS.map((preset, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFormImagePath(preset.url)}
                            className={`w-7 h-7 rounded-lg overflow-hidden border-2 transition-transform cursor-pointer hover:scale-110 ${
                              formImagePath === preset.url
                                ? 'border-[#0B3B2C] ring-2 ring-emerald-500/30'
                                : 'border-slate-300'
                            }`}
                            title={preset.name}
                          >
                            <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Candidate ID
                  </label>
                  <span className="text-[11px] font-bold text-[#0B3B2C] bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                    Position S.No #{candidates.filter((c) => c.position.toLowerCase() === formPosition.toLowerCase()).length + (editingCand ? 0 : 1)}
                  </span>
                </div>
                {editingCand ? (
                  <div className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-100 font-mono text-slate-800 font-bold">
                    {formId}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value.toUpperCase())}
                    placeholder="e.g. PRE-01"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden uppercase"
                    required
                  />
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  Serial numbers automatically restart from #1 for each specific position.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Candidate / Member Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Rahul Sen"
                  className="w-full px-3 py-2 text-sm font-medium rounded-xl border border-slate-300 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Position / Office <span className="text-rose-500">*</span>
                </label>
                {positionsList.length > 0 ? (
                  <div className="space-y-2">
                    <select
                      value={formPosition}
                      onChange={(e) => {
                        const selected = e.target.value;
                        setFormPosition(selected);
                        if (selected !== '__custom__') {
                          setCustomPositionInput('');
                          if (!editingCand) {
                            setFormId(getNextCandidateIdForPosition(selected));
                          }
                        }
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden bg-white"
                      required
                    >
                      {positionsList.map((pos) => (
                        <option key={pos} value={pos}>
                          {pos}
                        </option>
                      ))}
                      <option value="__custom__">+ Custom Position...</option>
                    </select>

                    {formPosition === '__custom__' && (
                      <input
                        type="text"
                        value={customPositionInput}
                        onChange={(e) => setCustomPositionInput(e.target.value)}
                        placeholder="Type position name..."
                        className="w-full px-3 py-2 text-xs rounded-xl border border-emerald-400 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden"
                        required
                        autoFocus
                      />
                    )}

                    {/* Quick selection chips */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {positionsList.map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => {
                            setFormPosition(pos);
                            setCustomPositionInput('');
                            if (!editingCand) {
                              setFormId(getNextCandidateIdForPosition(pos));
                            }
                          }}
                          className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition-colors cursor-pointer ${
                            formPosition === pos
                              ? 'bg-[#0B3B2C] text-white border-[#0B3B2C] shadow-2xs'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-[#0B3B2C]'
                          }`}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={formPosition}
                    onChange={(e) => setFormPosition(e.target.value)}
                    placeholder="e.g. President, Vice President..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden"
                    required
                  />
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  Candidate will be listed under this position on the voter&apos;s ballot.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Group / Party / Department
                </label>
                <input
                  type="text"
                  value={formGroup}
                  onChange={(e) => setFormGroup(e.target.value)}
                  placeholder="e.g. Student United Front, Independent, Tech Council"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Election Eligibility Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-[#0B3B2C] focus:ring-2 focus:ring-emerald-100 outline-hidden font-medium"
                >
                  <option value="Active">Active (Eligible & Appears on Ballot)</option>
                  <option value="Inactive">Inactive (Withdrawn / Hidden from Ballot)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white text-xs font-semibold shadow-xs cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCand ? 'Save Member Changes' : 'Create Member'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE CANDIDATE MODAL */}
      {deleteTargetCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Remove Candidate?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to remove <span className="font-bold text-slate-800">{deleteTargetCandidate.candidateName}</span> (
                <span className="font-mono font-bold text-[#0B3B2C]">{deleteTargetCandidate.candidateId}</span>) contesting for{' '}
                <span className="font-semibold text-slate-800">{deleteTargetCandidate.position}</span>?
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                This candidate will be permanently removed from this election ballot.
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetCandidate(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCandidate}
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

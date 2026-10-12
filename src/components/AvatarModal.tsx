import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Link as LinkIcon,
  AlertCircle,
} from 'lucide-react';

export interface AvatarOption {
  id: string;
  name: string;
  category: '3d' | 'photo' | 'custom';
  url: string;
  description: string;
}

export const VOTER_AVATAR_PRESETS: AvatarOption[] = [
  {
    id: 'voter-3d-student',
    name: '3D College Voter',
    category: '3d',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    description: 'Vibrant college student smiling with confident campus presence',
  },
  {
    id: 'voter-campus-leader',
    name: 'Campus Scholar',
    category: 'photo',
    url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
    description: 'Youthful university voter active in student democracy',
  },
  {
    id: 'voter-dicebear-3d',
    name: '3D Vector Student',
    category: '3d',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=VoteStudent&backgroundColor=134e3c',
    description: 'Editorial 3D animated character with collegiate palette',
  },
  {
    id: 'voter-academic',
    name: 'Student Ambassador',
    category: 'photo',
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    description: 'Modern student voter representing diverse faculty cohorts',
  },
];

export const ADMIN_AVATAR_PRESETS: AvatarOption[] = [
  {
    id: 'admin-3d-officer',
    name: '3D Election Officer',
    category: '3d',
    url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=600&q=80',
    description: 'Senior administrator with glasses and executive presence',
  },
  {
    id: 'admin-returning-officer',
    name: 'Campus Registrar',
    category: 'photo',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    description: 'Official collegiate election administrator in professional attire',
  },
  {
    id: 'admin-dicebear-3d',
    name: '3D Vector Executive',
    category: '3d',
    url: 'https://api.dicebear.com/7.x/personas/svg?seed=AdminOfficer&backgroundColor=f8faf9',
    description: 'Polished digital supervisor with administrative dashboard telemetry',
  },
  {
    id: 'admin-election-commissioner',
    name: 'Chief Commissioner',
    category: 'photo',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80',
    description: 'Executive presiding officer ensuring ballot integrity and transparency',
  },
];

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: 'voter' | 'admin';
  currentAvatar: string;
  onSaveAvatar: (role: 'voter' | 'admin', newUrl: string) => void;
  onResetAvatar: (role: 'voter' | 'admin') => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  isOpen,
  onClose,
  targetRole,
  currentAvatar,
  onSaveAvatar,
  onResetAvatar,
}) => {
  const [selectedUrl, setSelectedUrl] = useState<string>(currentAvatar);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const presets = targetRole === 'voter' ? VOTER_AVATAR_PRESETS : ADMIN_AVATAR_PRESETS;
  const roleTitle = targetRole === 'voter' ? 'Voter Portal Avatar' : 'Admin Console Avatar';

  const handleFileProcess = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image size should be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setSelectedUrl(result);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file. Please try another.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleApply = () => {
    onSaveAvatar(targetRole, selectedUrl);
    onClose();
  };

  const handleReset = () => {
    onResetAvatar(targetRole);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{roleTitle}</h3>
            <p className="text-xs text-slate-500">
              Upload your own image avatar or choose a curated style
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Active Preview */}
          <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 shadow-md shrink-0 border border-white">
              <img
                src={selectedUrl}
                alt="Avatar preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80';
                }}
              />
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                <Sparkles className="w-3 h-3" /> Selected Avatar
              </span>
              <p className="text-xs text-slate-600 font-medium">
                This image will appear on the {targetRole === 'voter' ? 'Voter' : 'Admin'} portal card.
              </p>
            </div>
          </div>

          {/* Upload Area */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-2">
              Upload Custom Image from Device
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-[#0B3B2C] bg-emerald-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-[#0B3B2C] hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileProcess(e.target.files[0]);
                  }
                }}
              />
              <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100/70 text-[#0B3B2C] flex items-center justify-center mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-800">
                Click to browse or drag & drop image here
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports PNG, JPG, WebP, or SVG (Up to 5MB)
              </p>
            </div>

            {errorMsg && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Image URL Input Option */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Or Paste an Image URL
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-[#0B3B2C]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (customUrlInput.trim()) {
                    setSelectedUrl(customUrlInput.trim());
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Load
              </button>
            </div>
          </div>

          {/* Curated Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-2">
              Or Choose from Curated Styles
            </label>
            <div className="grid grid-cols-2 gap-3">
              {presets.map((preset) => {
                const isSelected = selectedUrl === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedUrl(preset.url)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0B3B2C] bg-emerald-50/70 shadow-xs ring-1 ring-[#0B3B2C]'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-11 h-11 rounded-lg object-cover bg-slate-200 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 truncate">
                        {preset.name}
                      </p>
                      <p className="text-[10px] text-slate-500 capitalize truncate">
                        {preset.category} style
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#0B3B2C] hover:bg-[#07291F] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Avatar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

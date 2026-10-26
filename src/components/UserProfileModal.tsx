import React, { useState } from 'react';
import { X, Check, Users, ShieldAlert, Sparkles, User } from 'lucide-react';
import { UserProfile } from '../types';
import { PRESET_USERS, saveStoredUser } from '../utils/user';

interface UserProfileModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUserChanged: (newUser: UserProfile) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onUserChanged,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [color, setColor] = useState(currentUser.avatarColor);

  const handleSelectPreset = (preset: UserProfile) => {
    saveStoredUser(preset);
    onUserChanged(preset);
    onClose();
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const initials = name
      .trim()
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const updatedUser: UserProfile = {
      ...currentUser,
      name: name.trim(),
      email: email.trim(),
      avatarColor: color,
      avatarInitials: initials || 'ME',
    };

    saveStoredUser(updatedUser);
    onUserChanged(updatedUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Your Identity & Persona</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Persona Switcher for Live Testing */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700">
                Switch Teammate Persona
              </label>
              <span className="text-[11px] text-indigo-600 font-medium">1-Click Switch</span>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Instantly switch your active persona to simulate multi-user collaboration and see real-time updates across multiple tabs or browsers.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {PRESET_USERS.map((preset) => {
                const isSelected = preset.id === currentUser.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-2xs flex-shrink-0"
                      style={{ backgroundColor: preset.avatarColor }}
                    >
                      {preset.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 truncate">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {preset.email.split('@')[0]}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Custom Identity Editing */}
          <form onSubmit={handleSaveCustom} className="space-y-3">
            <label className="text-xs font-semibold text-slate-700 block">
              Or Customize Profile Details
            </label>

            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Save Details
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

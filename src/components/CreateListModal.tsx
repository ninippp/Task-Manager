import React, { useState } from 'react';
import { X, Sparkles, FolderLock, Users, Check } from 'lucide-react';
import { UserProfile, TaskList } from '../types';
import { createList } from '../services/api';

interface CreateListModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onListCreated: (newList: TaskList) => void;
}

const COLOR_OPTIONS = [
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#64748b', // Slate
];

const ICON_OPTIONS = [
  { id: 'check-square', label: 'Tasks' },
  { id: 'sparkles', label: 'Focus' },
  { id: 'rocket', label: 'Sprint' },
  { id: 'home', label: 'Home' },
  { id: 'briefcase', label: 'Work' },
  { id: 'layers', label: 'Projects' },
  { id: 'heart', label: 'Personal' },
];

export const CreateListModal: React.FC<CreateListModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onListCreated,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState('check-square');
  const [isShared, setIsShared] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const newList = await createList({
        title: title.trim(),
        description: description.trim(),
        color,
        icon,
        isShared,
        user: currentUser,
      });

      onListCreated(newList);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create list');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 text-sm">Create New Task List</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="text-xs p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              List Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Design System Sprint, Grocery List, Daily Habits"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief context or goals for this list"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Privacy Choice: Personal vs Collaborative */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Collaboration Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsShared(false)}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  !isShared
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <FolderLock className={`w-4 h-4 mt-0.5 ${!isShared ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-semibold">Personal</div>
                  <div className="text-[11px] text-slate-500">Only you can view and edit</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsShared(true)}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  isShared
                    ? 'border-indigo-600 bg-indigo-50/40 text-indigo-950 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700'
                }`}
              >
                <Users className={`w-4 h-4 mt-0.5 ${isShared ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-semibold">Collaborative</div>
                  <div className="text-[11px] text-slate-500">Live sync with invited team members</div>
                </div>
              </button>
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Accent Color
            </label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Icon
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {ICON_OPTIONS.map((ico) => (
                <button
                  key={ico.id}
                  type="button"
                  onClick={() => setIcon(ico.id)}
                  className={`py-1.5 px-2 text-xs rounded-lg border text-center transition-colors ${
                    icon === ico.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  {ico.label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors shadow-2xs"
            >
              {isSubmitting ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

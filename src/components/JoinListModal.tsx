import React, { useState } from 'react';
import { X, Compass, ArrowRight } from 'lucide-react';
import { UserProfile, TaskList } from '../types';
import { joinListByCode } from '../services/api';

interface JoinListModalProps {
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onListJoined: (list: TaskList) => void;
}

export const JoinListModal: React.FC<JoinListModalProps> = ({
  currentUser,
  isOpen,
  onClose,
  onListJoined,
}) => {
  if (!isOpen) return null;

  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const list = await joinListByCode(code.trim().toUpperCase(), currentUser);
      onListJoined(list);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid invite code');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Join Collaborative List</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleJoin} className="p-5 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            Enter the 6 to 10-character invite code provided by the list owner to join and collaborate in real time.
          </p>

          {errorMsg && (
            <div className="text-xs p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Invite Code
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. LAUNCH-404"
              className="w-full uppercase font-mono tracking-wider bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white"
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
              disabled={!code.trim() || isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors shadow-2xs"
            >
              <span>{isSubmitting ? 'Joining...' : 'Join List'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

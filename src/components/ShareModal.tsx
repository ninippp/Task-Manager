import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  UserPlus,
  Users,
  Shield,
  Trash2,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { TaskList, UserProfile, CollaboratorRole } from '../types';
import { addCollaborator, removeCollaborator, updateList } from '../services/api';

interface ShareModalProps {
  list: TaskList;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onListUpdated: (updated: TaskList) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  list,
  currentUser,
  isOpen,
  onClose,
  onListUpdated,
}) => {
  if (!isOpen) return null;

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const shareUrl = `${window.location.origin}?invite=${list.inviteCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(list.inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const newCollab = await addCollaborator(list.id, {
        name: name.trim(),
        email: email.trim(),
        role,
      });

      const updated = {
        ...list,
        collaborators: [...list.collaborators, newCollab],
        isShared: true,
      };
      onListUpdated(updated);
      setName('');
      setEmail('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add collaborator');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await removeCollaborator(list.id, userId);
      const updated = {
        ...list,
        collaborators: list.collaborators.filter((c) => c.userId !== userId),
      };
      onListUpdated(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove member');
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      const updated = await updateList(list.id, { isShared: !list.isShared });
      onListUpdated(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update list privacy');
    }
  };

  const openSimulatedCollaborator = () => {
    const testUrl = `${window.location.origin}?invite=${list.inviteCode}&user=jordan`;
    window.open(testUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Share "{list.title}"
              </h3>
              <p className="text-xs text-slate-500">
                Collaborate in real time with teammates or friends
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="text-xs p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {errorMsg}
            </div>
          )}

          {/* Share Link & Invite Code */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Direct Invite Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 select-all font-mono"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
              <div className="text-xs">
                <span className="text-slate-500">Invite Code: </span>
                <span className="font-mono font-bold text-slate-800 tracking-wider">
                  {list.inviteCode}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                {copiedCode ? 'Copied' : 'Copy Code'}
              </button>
            </div>
          </div>

          {/* Test Live Multi-User Collab Tip / Button */}
          <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex items-center justify-between gap-3">
            <div className="text-xs">
              <div className="font-semibold text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Test Collaboration Right Now</span>
              </div>
              <p className="text-indigo-700/80 text-[11px] mt-0.5">
                Open a new tab as <strong>Jordan Lee</strong> to see real-time updates and active presence instantly!
              </p>
            </div>
            <button
              onClick={openSimulatedCollaborator}
              className="flex-shrink-0 px-3 py-1.5 bg-white border border-indigo-200 hover:bg-indigo-600 hover:text-white text-indigo-700 font-medium text-xs rounded-lg shadow-2xs transition-colors flex items-center gap-1"
            >
              <span>Open Tab</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Invite Form */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Invite by Name & Email
            </label>
            <form onSubmit={handleInviteSubmit} className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Collaborator name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
                <input
                  type="email"
                  placeholder="collaborator@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Role:</span>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700"
                  >
                    <option value="editor">Editor (can add/edit tasks)</option>
                    <option value="viewer">Viewer (read-only)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!name.trim() || !email.trim() || isSubmitting}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite</span>
                </button>
              </div>
            </form>
          </div>

          {/* Members List */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Members with Access ({list.collaborators.length})
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {list.collaborators.map((c) => {
                const isMe = c.userId === currentUser.id;
                const isOwner = c.role === 'owner';

                return (
                  <div
                    key={c.userId}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50/80 border border-slate-200/60 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[10px] flex-shrink-0"
                        style={{ backgroundColor: c.avatarColor }}
                      >
                        {c.avatarInitials}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-slate-800 truncate">
                          {c.name} {isMe ? '(You)' : ''}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{c.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[11px] font-medium text-slate-500 capitalize">
                        {c.role}
                      </span>
                      {!isOwner && !isMe && (
                        <button
                          type="button"
                          onClick={() => handleRemove(c.userId)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          title="Remove collaborator"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <button
            onClick={handleTogglePrivacy}
            className="text-slate-600 hover:text-slate-900 underline font-medium"
          >
            {list.isShared ? 'Switch to private personal list' : 'Make collaborative'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

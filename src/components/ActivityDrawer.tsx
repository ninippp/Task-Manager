import React, { useEffect, useState } from 'react';
import { X, History, CheckCircle2, PlusCircle, MessageSquare, Edit3, UserPlus, Clock } from 'lucide-react';
import { ActivityLogItem, TaskList } from '../types';
import { fetchActivities, realtimeSocket } from '../services/api';

interface ActivityDrawerProps {
  list: TaskList;
  isOpen: boolean;
  onClose: () => void;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  create: <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />,
  complete: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
  reopen: <Clock className="w-3.5 h-3.5 text-amber-600" />,
  comment: <MessageSquare className="w-3.5 h-3.5 text-blue-600" />,
  update: <Edit3 className="w-3.5 h-3.5 text-slate-600" />,
  join: <UserPlus className="w-3.5 h-3.5 text-purple-600" />,
  delete: <X className="w-3.5 h-3.5 text-rose-600" />,
};

export const ActivityDrawer: React.FC<ActivityDrawerProps> = ({
  list,
  isOpen,
  onClose,
}) => {
  const [activities, setActivities] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchActivities(list.id)
        .then(setActivities)
        .catch((e) => console.error('Failed to load activities:', e))
        .finally(() => setLoading(false));
    }
  }, [isOpen, list.id]);

  useEffect(() => {
    const unsub = realtimeSocket.on('activity:new', (payload) => {
      if (payload.activity.listId === list.id) {
        setActivities((prev) => [payload.activity, ...prev]);
      }
    });

    return () => unsub();
  }, [list.id]);

  if (!isOpen) return null;

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      const diffMinutes = Math.floor((Date.now() - d.getTime()) / 60000);
      if (diffMinutes < 1) return 'just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return ts;
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-2xs"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Activity Feed</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of activities */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading activity...</div>
          ) : activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No recent activity recorded for this list.
            </div>
          ) : (
            activities.map((item) => (
              <div key={item.id} className="flex gap-3 text-xs">
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-white text-[10px]"
                  style={{ backgroundColor: item.userAvatarColor }}
                >
                  {item.userName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-slate-900">{item.userName}</span>
                    <span className="text-slate-500">{item.details}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      {ACTION_ICONS[item.action] || <Clock className="w-3 h-3" />}
                      <span className="capitalize">{item.action}</span>
                    </span>
                    <span>·</span>
                    <span>{formatTimestamp(item.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

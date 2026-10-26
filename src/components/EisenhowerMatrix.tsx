import React from 'react';
import { TaskItemData } from '../types';
import { Flame, Calendar, Users, Archive, Check } from 'lucide-react';

interface EisenhowerMatrixProps {
  tasks: TaskItemData[];
  onTaskClick: (task: TaskItemData) => void;
  onToggleComplete: (task: TaskItemData) => void;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({
  tasks,
  onTaskClick,
  onToggleComplete,
}) => {
  const activeTasks = tasks.filter((t) => !t.completed);

  // Quadrant 1: Urgent & Important
  const q1 = activeTasks.filter((t) => {
    if (t.priority === 'urgent') return true;
    if (t.priority === 'high' && t.dueDate) {
      const days = (new Date(t.dueDate).getTime() - Date.now()) / (1000 * 3600 * 24);
      return days <= 2;
    }
    return false;
  });

  // Quadrant 2: Important, Not Urgent
  const q2 = activeTasks.filter((t) => {
    if (q1.includes(t)) return false;
    return t.priority === 'high';
  });

  // Quadrant 3: Urgent, Not Important
  const q3 = activeTasks.filter((t) => {
    if (q1.includes(t) || q2.includes(t)) return false;
    if (t.priority === 'medium' && t.dueDate) {
      const days = (new Date(t.dueDate).getTime() - Date.now()) / (1000 * 3600 * 24);
      return days <= 3;
    }
    return t.priority === 'medium';
  });

  // Quadrant 4: Backlog / Low Priority
  const q4 = activeTasks.filter(
    (t) => !q1.includes(t) && !q2.includes(t) && !q3.includes(t)
  );

  const renderCard = (task: TaskItemData) => (
    <div
      key={task.id}
      onClick={() => onTaskClick(task)}
      className="p-3 bg-white/95 border border-slate-200/90 rounded-xl hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer flex items-center justify-between gap-2.5"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task);
          }}
          className="w-5 h-5 rounded-lg border-2 border-slate-300 hover:border-indigo-500 flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform"
        >
          {task.completed && <Check className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />}
        </button>
        <span className="text-xs font-bold text-slate-800 truncate">
          {task.title}
        </span>
      </div>

      {task.assigneeName && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 flex-shrink-0">
          {task.assigneeName.split(' ')[0]}
        </span>
      )}
    </div>
  );

  return (
    <div className="space-y-4 pb-6">
      <div className="text-xs font-semibold text-amber-900 bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/70">
        The Eisenhower Decision Matrix categorizes tasks by urgency and importance to help prioritize execution.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Q1: Do First */}
        <div className="bg-rose-50/60 border border-rose-200 rounded-2xl p-4 min-h-[240px] flex flex-col shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-rose-200/60">
            <div className="flex items-center gap-2 text-rose-900 font-extrabold text-xs md:text-sm">
              <Flame className="w-4 h-4 text-rose-600" />
              <span>1. Urgent & Important (Do First)</span>
            </div>
            <span className="text-xs text-rose-700 font-black px-2 py-0.5 bg-rose-100 rounded-full">{q1.length}</span>
          </div>
          <div className="space-y-2 flex-1">
            {q1.length === 0 ? (
              <p className="text-xs text-rose-400 font-medium italic py-6 text-center">No urgent fires right now</p>
            ) : (
              q1.map(renderCard)
            )}
          </div>
        </div>

        {/* Q2: Schedule */}
        <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4 min-h-[240px] flex flex-col shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-sky-200/60">
            <div className="flex items-center gap-2 text-sky-900 font-extrabold text-xs md:text-sm">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>2. Important, Not Urgent (Schedule)</span>
            </div>
            <span className="text-xs text-sky-700 font-black px-2 py-0.5 bg-sky-100 rounded-full">{q2.length}</span>
          </div>
          <div className="space-y-2 flex-1">
            {q2.length === 0 ? (
              <p className="text-xs text-sky-400 font-medium italic py-6 text-center">No strategic tasks scheduled</p>
            ) : (
              q2.map(renderCard)
            )}
          </div>
        </div>

        {/* Q3: Delegate */}
        <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-4 min-h-[240px] flex flex-col shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-amber-200/60">
            <div className="flex items-center gap-2 text-amber-900 font-extrabold text-xs md:text-sm">
              <Users className="w-4 h-4 text-amber-600" />
              <span>3. Urgent, Less Critical (Delegate)</span>
            </div>
            <span className="text-xs text-amber-700 font-black px-2 py-0.5 bg-amber-100 rounded-full">{q3.length}</span>
          </div>
          <div className="space-y-2 flex-1">
            {q3.length === 0 ? (
              <p className="text-xs text-amber-500 font-medium italic py-6 text-center">No delegate tasks</p>
            ) : (
              q3.map(renderCard)
            )}
          </div>
        </div>

        {/* Q4: Eliminate / Backlog */}
        <div className="bg-violet-50/50 border border-violet-200 rounded-2xl p-4 min-h-[240px] flex flex-col shadow-2xs">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-violet-200/60">
            <div className="flex items-center gap-2 text-violet-900 font-extrabold text-xs md:text-sm">
              <Archive className="w-4 h-4 text-violet-600" />
              <span>4. Low Priority (Backlog)</span>
            </div>
            <span className="text-xs text-violet-700 font-black px-2 py-0.5 bg-violet-100 rounded-full">{q4.length}</span>
          </div>
          <div className="space-y-2 flex-1">
            {q4.length === 0 ? (
              <p className="text-xs text-violet-400 font-medium italic py-6 text-center">Backlog is empty</p>
            ) : (
              q4.map(renderCard)
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

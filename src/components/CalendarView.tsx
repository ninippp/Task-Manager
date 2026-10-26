import React from 'react';
import { Calendar as CalendarIcon, Clock, AlertTriangle, Check, Layers } from 'lucide-react';
import { TaskItemData } from '../types';

interface CalendarViewProps {
  tasks: TaskItemData[];
  onTaskClick: (task: TaskItemData) => void;
  onToggleComplete: (task: TaskItemData) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  onTaskClick,
  onToggleComplete,
}) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfTomorrow = startOfToday + 86400000;
  const endOfWeek = startOfToday + 86400000 * 7;

  const overdue: TaskItemData[] = [];
  const today: TaskItemData[] = [];
  const tomorrow: TaskItemData[] = [];
  const thisWeek: TaskItemData[] = [];
  const later: TaskItemData[] = [];
  const noDate: TaskItemData[] = [];

  tasks.forEach((t) => {
    if (!t.dueDate) {
      noDate.push(t);
      return;
    }

    const tTime = new Date(t.dueDate).getTime();
    if (!t.completed && tTime < startOfToday) {
      overdue.push(t);
    } else if (tTime >= startOfToday && tTime < startOfTomorrow) {
      today.push(t);
    } else if (tTime >= startOfTomorrow && tTime < startOfTomorrow + 86400000) {
      tomorrow.push(t);
    } else if (tTime >= startOfTomorrow + 86400000 && tTime < endOfWeek) {
      thisWeek.push(t);
    } else {
      later.push(t);
    }
  });

  const renderSection = (
    title: string,
    items: TaskItemData[],
    icon: React.ReactNode,
    badgeColor: string
  ) => {
    if (items.length === 0) return null;

    return (
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-xs md:text-sm font-extrabold text-slate-800">
          <span className="text-slate-500">{icon}</span>
          <span>{title}</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-black ${badgeColor}`}>
            {items.length}
          </span>
        </div>

        <div className="space-y-2">
          {items.map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick(task)}
              className={`flex items-center justify-between p-3.5 rounded-2xl border bg-white/95 transition-all cursor-pointer hover:border-indigo-400 hover:shadow-xs ${
                task.completed ? 'border-emerald-200/60 bg-emerald-50/30' : 'border-amber-200/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleComplete(task);
                  }}
                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    task.completed
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'border-slate-300 hover:border-indigo-500 bg-white'
                  }`}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
                <span
                  className={`text-xs md:text-sm font-bold truncate ${
                    task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                  }`}
                >
                  {task.title}
                </span>
              </div>

              <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-500 flex-shrink-0">
                {task.dueDate && (
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[11px]">
                    {new Date(task.dueDate).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                )}
                {task.assigneeName && (
                  <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-bold">
                    {task.assigneeName.split(' ')[0]}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-6">
      {renderSection(
        'Overdue',
        overdue,
        <AlertTriangle className="w-4 h-4 text-rose-500" />,
        'bg-rose-100 text-rose-800'
      )}
      {renderSection(
        'Due Today',
        today,
        <Clock className="w-4 h-4 text-amber-500" />,
        'bg-amber-100 text-amber-900'
      )}
      {renderSection(
        'Tomorrow',
        tomorrow,
        <CalendarIcon className="w-4 h-4 text-sky-500" />,
        'bg-sky-100 text-sky-900'
      )}
      {renderSection(
        'This Week',
        thisWeek,
        <CalendarIcon className="w-4 h-4 text-violet-500" />,
        'bg-violet-100 text-violet-900'
      )}
      {renderSection(
        'Later',
        later,
        <CalendarIcon className="w-4 h-4 text-teal-500" />,
        'bg-teal-100 text-teal-900'
      )}
      {renderSection(
        'No Due Date',
        noDate,
        <Layers className="w-4 h-4 text-slate-400" />,
        'bg-slate-100 text-slate-700'
      )}

      {tasks.length === 0 && (
        <div className="py-14 text-center text-xs font-semibold text-slate-400 bg-white/70 rounded-3xl border border-dashed border-slate-200">
          No deadlines scheduled for this list yet.
        </div>
      )}
    </div>
  );
};

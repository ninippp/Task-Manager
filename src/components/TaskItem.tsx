import React from 'react';
import {
  Check,
  Calendar,
  MessageSquare,
  Trash2,
  ListTodo,
} from 'lucide-react';
import { TaskItemData, Priority } from '../types';

interface TaskItemProps {
  task: TaskItemData;
  onToggleComplete: (task: TaskItemData) => void;
  onClick: (task: TaskItemData) => void;
  onDelete: (taskId: string) => void;
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; bg: string; text: string; dot: string }
> = {
  urgent: {
    label: 'Urgent',
    bg: 'bg-rose-100 text-rose-800',
    text: 'text-rose-700',
    dot: 'bg-rose-500',
  },
  high: {
    label: 'High',
    bg: 'bg-amber-100 text-amber-900',
    text: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  medium: {
    label: 'Medium',
    bg: 'bg-sky-100 text-sky-800',
    text: 'text-sky-700',
    dot: 'bg-sky-500',
  },
  low: {
    label: 'Low',
    bg: 'bg-emerald-100 text-emerald-800',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onClick,
  onDelete,
}) => {
  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const formatDueDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      const isPast = d.getTime() < now.getTime() && !isToday;

      const dateLabel = isToday
        ? 'Today'
        : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

      return {
        label: dateLabel,
        isPast,
        isToday,
      };
    } catch {
      return { label: dateStr, isPast: false, isToday: false };
    }
  };

  const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;

  return (
    <div
      onClick={() => onClick(task)}
      className={`group relative flex items-center justify-between p-4 bg-white/95 backdrop-blur-xs rounded-2xl cursor-pointer transition-all duration-200 border hover:shadow-md hover:-translate-y-0.5 ${
        task.completed
          ? 'bg-emerald-50/40 border-emerald-200/80 text-slate-400'
          : 'border-amber-200/60 hover:border-indigo-300 hover:shadow-indigo-500/10 text-slate-800'
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        {/* Toggle complete button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleComplete(task);
          }}
          className={`flex-shrink-0 w-6 h-6 rounded-xl border-2 flex items-center justify-center transition-all duration-200 ${
            task.completed
              ? 'bg-gradient-to-tr from-emerald-400 to-teal-500 border-emerald-500 text-white shadow-xs scale-105'
              : 'border-slate-300 hover:border-indigo-500 bg-white hover:scale-105'
          }`}
          aria-label={task.completed ? 'Mark task as incomplete' : 'Mark task as complete'}
        >
          {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
        </button>

        {/* Task Title & Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm md:text-base font-bold leading-snug truncate ${
                task.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-800'
              }`}
            >
              {task.title}
            </span>
          </div>

          {/* Clean cheerful metadata strip */}
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
            {/* Priority Pill */}
            <span
              className={`inline-flex items-center gap-1.5 font-bold text-[11px] px-2.5 py-0.5 rounded-full ${priorityInfo.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${priorityInfo.dot}`}></span>
              <span>{priorityInfo.label}</span>
            </span>

            {/* Due Date */}
            {dueInfo && (
              <span
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                  task.completed
                    ? 'text-slate-400 bg-slate-100'
                    : dueInfo.isPast
                    ? 'text-rose-700 bg-rose-100/80 animate-pulse'
                    : dueInfo.isToday
                    ? 'text-amber-800 bg-amber-100'
                    : 'text-indigo-700 bg-indigo-50'
                }`}
              >
                <Calendar className="w-3 h-3" />
                <span>{dueInfo.label}</span>
              </span>
            )}

            {/* Subtasks Progress */}
            {totalSubtasks > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violet-50 text-violet-700">
                <ListTodo className="w-3 h-3 text-violet-500" />
                <span>
                  {completedSubtasks}/{totalSubtasks}
                </span>
                <div className="w-10 bg-violet-200 h-1.5 rounded-full overflow-hidden inline-block ml-0.5">
                  <div
                    className="bg-violet-600 h-full rounded-full"
                    style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                  />
                </div>
              </span>
            )}

            {/* Comments count */}
            {task.commentsCount > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600">
                <MessageSquare className="w-3 h-3" />
                <span>{task.commentsCount} comments</span>
              </span>
            )}

            {/* Tags */}
            {task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 bg-amber-50 text-amber-800 text-[11px] font-semibold rounded-full border border-amber-200/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Right side: Assignee Avatar + Delete Button */}
      <div className="flex items-center gap-3 ml-3 flex-shrink-0">
        {task.assigneeName && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-2 ring-white"
            style={{ backgroundColor: task.assigneeAvatarColor || '#6366f1' }}
            title={`Assigned to ${task.assigneeName}`}
          >
            {task.assigneeName.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Delete on hover */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

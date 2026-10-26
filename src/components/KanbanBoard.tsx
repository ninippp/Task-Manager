import React from 'react';
import { Plus, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { TaskItemData, TaskStatus, Priority } from '../types';

interface KanbanBoardProps {
  tasks: TaskItemData[];
  onTaskClick: (task: TaskItemData) => void;
  onUpdateStatus: (taskId: string, status: TaskStatus) => void;
  onQuickAdd: (status: TaskStatus) => void;
}

const COLUMNS: Array<{
  id: TaskStatus;
  title: string;
  headerBg: string;
  cardBorder: string;
  columnBg: string;
}> = [
  {
    id: 'todo',
    title: 'To Do',
    headerBg: 'bg-amber-100 text-amber-900 border-amber-200',
    cardBorder: 'hover:border-amber-400',
    columnBg: 'bg-amber-50/40 border-amber-200/60',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    headerBg: 'bg-sky-100 text-sky-900 border-sky-200',
    cardBorder: 'hover:border-sky-400',
    columnBg: 'bg-sky-50/40 border-sky-200/60',
  },
  {
    id: 'review',
    title: 'Review',
    headerBg: 'bg-purple-100 text-purple-900 border-purple-200',
    cardBorder: 'hover:border-purple-400',
    columnBg: 'bg-purple-50/40 border-purple-200/60',
  },
  {
    id: 'done',
    title: 'Done',
    headerBg: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    cardBorder: 'hover:border-emerald-400',
    columnBg: 'bg-emerald-50/40 border-emerald-200/60',
  },
];

const STATUS_FLOW: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tasks,
  onTaskClick,
  onUpdateStatus,
  onQuickAdd,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        const colIdx = STATUS_FLOW.indexOf(col.id);

        return (
          <div
            key={col.id}
            className={`flex flex-col border rounded-2xl p-3.5 min-h-[520px] transition-all shadow-2xs ${col.columnBg}`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/5">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border shadow-2xs ${col.headerBg}`}>
                  {col.title}
                </span>
                <span className="text-xs font-black text-slate-500 bg-white/80 px-2 py-0.5 rounded-full shadow-2xs">
                  {colTasks.length}
                </span>
              </div>

              <button
                onClick={() => onQuickAdd(col.id)}
                className="w-7 h-7 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg flex items-center justify-center transition-all shadow-2xs hover:scale-105"
                title={`Add task to ${col.title}`}
              >
                <Plus className="w-4 h-4 font-bold" />
              </button>
            </div>

            {/* Column Task Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
              {colTasks.length === 0 ? (
                <div className="h-36 flex flex-col items-center justify-center border-2 border-dashed border-slate-200/80 rounded-xl text-xs text-slate-400 p-4 text-center">
                  <span className="font-medium text-slate-400">
                    {col.id === 'done' ? 'Completed tasks will appear here' : 'No tasks in this column'}
                  </span>
                </div>
              ) : (
                colTasks.map((task) => {
                  return (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className={`bg-white/95 p-3.5 rounded-xl border border-slate-200/90 hover:shadow-md transition-all duration-200 cursor-pointer group space-y-2.5 ${col.cardBorder}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-xs md:text-sm font-bold leading-snug line-clamp-2 ${
                            task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      {/* Clean Card Metadata */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              task.priority === 'urgent'
                                ? 'bg-rose-500'
                                : task.priority === 'high'
                                ? 'bg-amber-500'
                                : task.priority === 'medium'
                                ? 'bg-sky-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                          <span className="capitalize">{task.priority}</span>
                        </div>

                        {task.assigneeName && (
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-2xs ring-1 ring-white"
                            style={{ backgroundColor: task.assigneeAvatarColor || '#6366f1' }}
                            title={`Assigned to ${task.assigneeName}`}
                          >
                            {task.assigneeName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Move status buttons */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 opacity-60 group-hover:opacity-100 transition-opacity">
                        {colIdx > 0 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStatus(task.id, STATUS_FLOW[colIdx - 1]);
                            }}
                            className="text-[11px] text-slate-600 hover:text-indigo-600 font-semibold flex items-center gap-1 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                            title={`Move to ${COLUMNS[colIdx - 1].title}`}
                          >
                            <ArrowLeft className="w-3 h-3" />
                            <span>Prev</span>
                          </button>
                        ) : (
                          <div />
                        )}

                        {colIdx < STATUS_FLOW.length - 1 ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateStatus(task.id, STATUS_FLOW[colIdx + 1]);
                            }}
                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 transition-colors"
                            title={`Move to ${COLUMNS[colIdx + 1].title}`}
                          >
                            <span>Move Next</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-bold">
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

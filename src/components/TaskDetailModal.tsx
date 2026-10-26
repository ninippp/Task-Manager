import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  Calendar,
  User,
  Tag,
  CheckSquare,
  MessageSquare,
  Send,
  Plus,
  Clock,
  Check,
} from 'lucide-react';
import {
  TaskItemData,
  TaskList,
  UserProfile,
  TaskComment,
  Priority,
  TaskStatus,
} from '../types';
import { fetchComments, addComment, realtimeSocket } from '../services/api';

interface TaskDetailModalProps {
  task: TaskItemData | null;
  list: TaskList;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateTask: (taskId: string, updates: Partial<TaskItemData>) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  list,
  currentUser,
  isOpen,
  onClose,
  onUpdateTask,
  onDeleteTask,
}) => {
  if (!isOpen || !task) return null;

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [dueDate, setDueDate] = useState(
    task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : ''
  );
  const [assignedTo, setAssignedTo] = useState(task.assignedTo || '');
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [tags, setTags] = useState(task.tags || []);
  const [newTagInput, setNewTagInput] = useState('');

  // Comments state
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Sync internal state when task changes
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '');
    setAssignedTo(task.assignedTo || '');
    setSubtasks(task.subtasks || []);
    setTags(task.tags || []);
  }, [task]);

  // Load comments
  useEffect(() => {
    if (task) {
      fetchComments(list.id, task.id)
        .then(setComments)
        .catch((e) => console.error('Failed to load comments:', e));
    }
  }, [task?.id, list.id]);

  // Subscribe to real-time comments for this task
  useEffect(() => {
    const unsub = realtimeSocket.on('comment:created', (payload) => {
      if (payload.taskId === task.id) {
        setComments((prev) => {
          if (prev.some((c) => c.id === payload.comment.id)) return prev;
          return [...prev, payload.comment];
        });
      }
    });

    return () => unsub();
  }, [task?.id]);

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      onUpdateTask(task.id, { title: title.trim() });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== task.description) {
      onUpdateTask(task.id, { description });
    }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    setStatus(newStatus);
    onUpdateTask(task.id, {
      status: newStatus,
      completed: newStatus === 'done',
    });
  };

  const handlePriorityChange = (newPriority: Priority) => {
    setPriority(newPriority);
    onUpdateTask(task.id, { priority: newPriority });
  };

  const handleDueDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDueDate(val);
    onUpdateTask(task.id, {
      dueDate: val ? new Date(val).toISOString() : null,
    });
  };

  const handleAssigneeChange = (userId: string) => {
    setAssignedTo(userId);
    if (!userId) {
      onUpdateTask(task.id, {
        assignedTo: null,
        assigneeName: null,
        assigneeAvatarColor: null,
      });
      return;
    }
    const member = list.collaborators.find((c) => c.userId === userId);
    if (member) {
      onUpdateTask(task.id, {
        assignedTo: member.userId,
        assigneeName: member.name,
        assigneeAvatarColor: member.avatarColor,
      });
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const newSub = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle('');
    onUpdateTask(task.id, { subtasks: updated });
  };

  const handleToggleSubtask = (subId: string) => {
    const updated = subtasks.map((s) =>
      s.id === subId ? { ...s, completed: !s.completed } : s
    );
    setSubtasks(updated);
    onUpdateTask(task.id, { subtasks: updated });
  };

  const handleDeleteSubtask = (subId: string) => {
    const updated = subtasks.filter((s) => s.id !== subId);
    setSubtasks(updated);
    onUpdateTask(task.id, { subtasks: updated });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const tag = newTagInput.trim().replace(/^#/, '');
      if (!tags.includes(tag)) {
        const updated = [...tags, tag];
        setTags(updated);
        onUpdateTask(task.id, { tags: updated });
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    onUpdateTask(task.id, { tags: updated });
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || isSubmittingComment) return;

    setIsSubmittingComment(true);
    try {
      const newComment = await addComment(list.id, task.id, commentText, currentUser);
      setComments((prev) => {
        if (prev.some((c) => c.id === newComment.id)) return prev;
        return [...prev, newComment];
      });
      setCommentText('');
    } catch (e) {
      console.error('Failed to post comment:', e);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const completedCount = subtasks.filter((s) => s.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-amber-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-50 via-rose-50 to-violet-50 border-b border-amber-200/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="text-indigo-600">{list.title}</span>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <span className="text-slate-500">Task #{task.id.slice(-4)}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onDeleteTask(task.id);
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-100/60 rounded-xl transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition-colors shadow-2xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Title Input */}
          <div className="p-2 -mx-2 rounded-xl hover:bg-slate-50 transition-colors">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              placeholder="Task title..."
              className="w-full text-lg md:text-xl font-extrabold text-slate-900 border-none p-0 focus:outline-hidden focus:ring-0 placeholder:text-slate-300"
            />
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70 text-xs">
            {/* Status */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => handlePriorityChange(e.target.value as Priority)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={handleDueDateChange}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
              />
            </div>

            {/* Assignee */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                Assignee
              </label>
              <select
                value={assignedTo}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-semibold text-slate-800 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
              >
                <option value="">Unassigned</option>
                {list.collaborators.map((c) => (
                  <option key={c.userId} value={c.userId}>
                    {c.name} {c.userId === currentUser.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Notes & Details
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={handleDescriptionBlur}
              placeholder="Add key notes, context, or instructions for collaborators..."
              className="w-full text-xs text-slate-800 bg-white border border-slate-200 rounded-xl p-3 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
            />
          </div>

          {/* Subtasks / Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span>Checklist</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                  {completedCount}/{subtasks.length}
                </span>
              </label>
              {subtasks.length > 0 && (
                <div className="w-32 bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-400 to-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(completedCount / subtasks.length) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2 mb-2">
              {subtasks.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/80 group text-xs transition-colors"
                >
                  <label className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => handleToggleSubtask(sub.id)}
                      className="w-4 h-4 rounded-md border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span
                      className={`truncate font-medium ${
                        sub.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {sub.title}
                    </span>
                  </label>
                  <button
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddSubtask} className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a step..."
                className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500 shadow-2xs"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 text-xs font-bold rounded-xl transition-colors"
              >
                Add Step
              </button>
            </form>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">
              Tags & Labels
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg font-bold"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="+ tag and press Enter"
                className="text-xs px-2.5 py-1.5 border border-dashed border-slate-300 rounded-lg focus:outline-hidden focus:border-indigo-500 w-36 bg-white"
              />
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Collaborative Discussion */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 mb-3">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Discussion ({comments.length})</span>
            </div>

            {/* Comment Stream */}
            <div className="space-y-3 mb-4">
              {comments.length === 0 ? (
                <div className="text-xs text-slate-400 italic p-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No comments yet. Share an update or question for your team.
                </div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="flex gap-2.5 text-xs">
                    <div
                      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-black text-white shadow-2xs"
                      style={{ backgroundColor: c.userAvatarColor }}
                    >
                      {c.userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3 shadow-2xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">
                          {c.userName} {c.userId === currentUser.id ? '(You)' : ''}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                        {c.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post comment input */}
            <form onSubmit={handleSendComment} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a message..."
                className="flex-1 text-xs bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-indigo-500 shadow-2xs font-medium"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span className="font-medium">Created by {task.creatorName}</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl text-xs font-bold hover:shadow-md transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Plus,
  Search,
  CheckCircle2,
  Calendar,
  Sparkles,
  RefreshCw,
  EyeOff,
  Eye,
  Flame,
  PartyPopper,
} from 'lucide-react';
import {
  TaskList,
  TaskItemData,
  ViewMode,
  Priority,
  TaskStatus,
  UserProfile,
  FilterState,
} from './types';
import {
  fetchLists,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  realtimeSocket,
  resetDatabase,
} from './services/api';
import { getStoredUser } from './utils/user';

// Components
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { TaskItem } from './components/TaskItem';
import { TaskDetailModal } from './components/TaskDetailModal';
import { KanbanBoard } from './components/KanbanBoard';
import { EisenhowerMatrix } from './components/EisenhowerMatrix';
import { CalendarView } from './components/CalendarView';
import { ShareModal } from './components/ShareModal';
import { ActivityDrawer } from './components/ActivityDrawer';
import { CreateListModal } from './components/CreateListModal';
import { UserProfileModal } from './components/UserProfileModal';
import { JoinListModal } from './components/JoinListModal';
import { ListSettingsModal } from './components/ListSettingsModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(getStoredUser());
  const [lists, setLists] = useState<TaskList[]>([]);
  const [activeListId, setActiveListId] = useState<string>('');
  const [tasks, setTasks] = useState<TaskItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  // Real-time state
  const [isConnected, setIsConnected] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<
    Array<{ userId: string; name: string; avatarColor: string; avatarInitials: string }>
  >([]);
  const [typingUser, setTypingUser] = useState<{ name: string; isTyping: boolean } | null>(null);

  // Modals state
  const [selectedTask, setSelectedTask] = useState<TaskItemData | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isJoinListOpen, setIsJoinListOpen] = useState(false);
  const [isListSettingsOpen, setIsListSettingsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Quick Task Add state
  const [quickTitle, setQuickTitle] = useState('');
  const [quickPriority, setQuickPriority] = useState<Priority>('medium');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [quickAssignee, setQuickAssignee] = useState('');
  const [quickTag, setQuickTag] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    priority: 'all',
    status: 'all',
    assignee: 'all',
    tag: 'all',
    hideCompleted: false,
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  const triggerConfettiBurst = () => {
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#f59e0b', '#ec4899', '#8b5cf6', '#10b981', '#3b82f6'],
    });
  };

  // Sync user changes across tabs or persona switch
  useEffect(() => {
    const handleUserChange = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
        realtimeSocket.connect(e.detail, activeListId || undefined);
      }
    };
    window.addEventListener('synchrotask:user_changed', handleUserChange);
    return () => window.removeEventListener('synchrotask:user_changed', handleUserChange);
  }, [activeListId]);

  // Initial Load of Lists
  useEffect(() => {
    fetchLists()
      .then((loadedLists) => {
        setLists(loadedLists);
        if (loadedLists.length > 0) {
          const params = new URLSearchParams(window.location.search);
          const inviteCode = params.get('invite');
          if (inviteCode) {
            const matched = loadedLists.find((l) => l.inviteCode.toUpperCase() === inviteCode.toUpperCase());
            if (matched) {
              setActiveListId(matched.id);
              return;
            }
          }
          setActiveListId(loadedLists[0].id);
        }
      })
      .catch((e) => console.error('Failed to load lists:', e))
      .finally(() => setLoading(false));
  }, []);

  // Active list reference
  const activeList = useMemo(() => {
    return lists.find((l) => l.id === activeListId) || null;
  }, [lists, activeListId]);

  // Load Tasks whenever active list changes
  useEffect(() => {
    if (!activeListId) return;

    fetchTasks(activeListId)
      .then(setTasks)
      .catch((e) => console.error('Failed to load tasks:', e));

    realtimeSocket.connect(currentUser, activeListId);
    realtimeSocket.switchList(activeListId, currentUser);
  }, [activeListId, currentUser]);

  // WebSocket Event Listeners
  useEffect(() => {
    const unsubConn = realtimeSocket.on('connection:change', ({ connected }) => {
      setIsConnected(connected);
    });

    const unsubPresence = realtimeSocket.on('presence:update', (payload) => {
      if (payload.listId === activeListId) {
        setOnlineUsers(payload.users || []);
      }
    });

    const unsubTyping = realtimeSocket.on('user:typing', (payload) => {
      if (payload.listId === activeListId && payload.user.id !== currentUser.id) {
        setTypingUser({ name: payload.user.name, isTyping: payload.isTyping });
        if (payload.isTyping) {
          setTimeout(() => {
            setTypingUser((prev) => (prev?.name === payload.user.name ? null : prev));
          }, 3000);
        }
      }
    });

    const unsubTaskCreated = realtimeSocket.on('task:created', (payload) => {
      if (payload.task.listId === activeListId) {
        setTasks((prev) => {
          if (prev.some((t) => t.id === payload.task.id)) return prev;
          return [payload.task, ...prev];
        });
        if (payload.task.createdBy !== currentUser.id) {
          showToast(`${payload.task.creatorName} added "${payload.task.title}"`);
        }
      }
    });

    const unsubTaskUpdated = realtimeSocket.on('task:updated', (payload) => {
      if (payload.task.listId === activeListId) {
        setTasks((prev) =>
          prev.map((t) => (t.id === payload.task.id ? payload.task : t))
        );
        setSelectedTask((prev) =>
          prev && prev.id === payload.task.id ? payload.task : prev
        );
      }
    });

    const unsubTaskDeleted = realtimeSocket.on('task:deleted', (payload) => {
      if (payload.listId === activeListId) {
        setTasks((prev) => prev.filter((t) => t.id !== payload.taskId));
        setSelectedTask((prev) => (prev && prev.id === payload.taskId ? null : prev));
      }
    });

    const unsubListUpdated = realtimeSocket.on('list:updated', (payload) => {
      setLists((prev) =>
        prev.map((l) => (l.id === payload.list.id ? payload.list : l))
      );
    });

    const unsubCollabJoined = realtimeSocket.on('list:collaborator_joined', (payload) => {
      if (payload.listId === activeListId) {
        setLists((prev) =>
          prev.map((l) =>
            l.id === payload.listId
              ? {
                  ...l,
                  collaborators: l.collaborators.some((c) => c.userId === payload.collaborator.userId)
                    ? l.collaborators
                    : [...l.collaborators, payload.collaborator],
                }
              : l
          )
        );
        showToast(`${payload.collaborator.name} joined this list`);
      }
    });

    return () => {
      unsubConn();
      unsubPresence();
      unsubTyping();
      unsubTaskCreated();
      unsubTaskUpdated();
      unsubTaskDeleted();
      unsubListUpdated();
      unsubCollabJoined();
    };
  }, [activeListId, currentUser.id, showToast]);

  // Handlers
  const handleToggleComplete = async (task: TaskItemData) => {
    const nextCompleted = !task.completed;
    const nextStatus: TaskStatus = nextCompleted ? 'done' : 'todo';

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? {
              ...t,
              completed: nextCompleted,
              status: nextStatus,
              completedAt: nextCompleted ? new Date().toISOString() : null,
            }
          : t
      )
    );

    if (nextCompleted) {
      triggerConfettiBurst();
    }

    try {
      await updateTask(
        task.listId,
        task.id,
        { completed: nextCompleted, status: nextStatus },
        currentUser
      );
    } catch (e) {
      console.error('Failed to update task completion:', e);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)));
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim() || !activeList || isAddingTask) return;

    setIsAddingTask(true);
    const titleVal = quickTitle.trim();
    const priorityVal = quickPriority;
    const dueVal = quickDueDate ? new Date(quickDueDate).toISOString() : null;
    const assignedUser = activeList.collaborators.find((c) => c.userId === quickAssignee);

    try {
      const created = await createTask(
        activeList.id,
        {
          title: titleVal,
          priority: priorityVal,
          dueDate: dueVal,
          assignedTo: assignedUser ? assignedUser.userId : null,
          assigneeName: assignedUser ? assignedUser.name : null,
          assigneeAvatarColor: assignedUser ? assignedUser.avatarColor : null,
          tags: quickTag ? [quickTag.replace(/^#/, '')] : [],
          subtasks: [],
        },
        currentUser
      );

      setTasks((prev) => {
        if (prev.some((t) => t.id === created.id)) return prev;
        return [created, ...prev];
      });

      setQuickTitle('');
      setQuickDueDate('');
      setQuickTag('');
      setQuickAssignee('');
    } catch (err) {
      console.error('Failed to create task:', err);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<TaskItemData>) => {
    if (!activeList) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    );
    setSelectedTask((prev) => (prev && prev.id === taskId ? { ...prev, ...updates } : prev));

    try {
      const updated = await updateTask(activeList.id, taskId, updates, currentUser);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setSelectedTask((prev) => (prev && prev.id === taskId ? updated : prev));
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!activeList) return;
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);

    try {
      await deleteTask(activeList.id, taskId, currentUser);
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleStatusChangeFromKanban = (taskId: string, newStatus: TaskStatus) => {
    handleUpdateTask(taskId, {
      status: newStatus,
      completed: newStatus === 'done',
    });
  };

  const handleQuickAddKanban = (colStatus: TaskStatus) => {
    const taskName = prompt(`Enter task title for ${colStatus.toUpperCase()}:`);
    if (taskName && taskName.trim() && activeList) {
      createTask(
        activeList.id,
        {
          title: taskName.trim(),
          status: colStatus,
          completed: colStatus === 'done',
          priority: 'medium',
          tags: [],
          subtasks: [],
        },
        currentUser
      ).then((created) => {
        setTasks((prev) => [created, ...prev]);
      });
    }
  };

  const handleResetData = async () => {
    if (confirm('Reset workspace demo data to initial state?')) {
      await resetDatabase();
      window.location.reload();
    }
  };

  // Filter & Search logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filters.hideCompleted && task.completed) return false;
      if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
      if (filters.status !== 'all' && task.status !== filters.status) return false;
      if (filters.assignee !== 'all') {
        if (filters.assignee === 'me') {
          if (task.assignedTo !== currentUser.id) return false;
        } else if (task.assignedTo !== filters.assignee) {
          return false;
        }
      }
      if (filters.tag !== 'all' && !task.tags.includes(filters.tag)) return false;
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(query);
        const matchDesc = task.description?.toLowerCase().includes(query);
        const matchTag = task.tags.some((t) => t.toLowerCase().includes(query));
        const matchAssignee = task.assigneeName?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchTag && !matchAssignee) return false;
      }
      return true;
    });
  }, [tasks, filters, currentUser.id]);

  const pendingCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-indigo-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-700 text-sm">
          <div className="w-8 h-8 border-3 border-rose-500 border-t-amber-400 rounded-full animate-spin" />
          <span className="font-bold text-slate-800">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/50 via-rose-50/30 to-violet-50/40 flex text-slate-900 font-sans antialiased selection:bg-rose-200 selection:text-rose-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-slate-900 to-indigo-950 text-white text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-indigo-400/30 flex items-center gap-2.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-amber-300 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        lists={lists}
        activeListId={activeListId}
        onSelectList={setActiveListId}
        onCreateList={() => setIsCreateListOpen(true)}
        onJoinList={() => setIsJoinListOpen(true)}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Navbar */}
        <Navbar
          list={activeList}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onlineUsers={onlineUsers}
          typingUser={typingUser}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          onOpenActivityDrawer={() => setIsActivityDrawerOpen(true)}
          onOpenListSettings={() => setIsListSettingsOpen(true)}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isConnected={isConnected}
          currentUser={currentUser}
        />

        {/* Viewport content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header Banner with Clean Motivation & Progress */}
            {activeList && (
              <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-amber-100/90 via-rose-100/80 to-indigo-100/90 border border-amber-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
                <div className="relative z-10 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-700">
                      Active Workspace
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/80 text-amber-900 text-[10px] font-extrabold shadow-2xs flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-600 fill-current" />
                      <span>3-day streak</span>
                    </span>
                  </div>
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                    Welcome back, {currentUser.name.split(' ')[0]}
                  </h1>
                  <p className="text-xs md:text-sm text-slate-700 font-medium">
                    {activeList.description || 'Manage tasks and collaborate with your team in real time.'}
                  </p>
                </div>

                {/* Progress Card */}
                <div className="relative z-10 flex items-center gap-3">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-amber-200 shadow-2xs flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-600">Completion Score</div>
                      <div className="text-sm font-black text-slate-900">
                        {completedCount} of {tasks.length} Done ({progressPercent}%)
                      </div>
                    </div>

                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center font-black text-xs text-amber-800 shadow-2xs">
                      {progressPercent}%
                    </div>
                  </div>

                  <button
                    onClick={triggerConfettiBurst}
                    className="p-2.5 bg-white/90 hover:bg-white text-rose-600 hover:text-rose-700 rounded-2xl border border-rose-200 shadow-2xs hover:scale-105 active:scale-95 transition-all"
                    title="Celebrate completion"
                  >
                    <PartyPopper className="w-5 h-5" />
                  </button>

                  <button
                    onClick={handleResetData}
                    className="p-2.5 bg-white/80 hover:bg-white text-slate-400 hover:text-slate-700 rounded-2xl border border-slate-200/80 shadow-2xs hover:scale-105 transition-all"
                    title="Reset demo data"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Quick Task Creation Box */}
            <div className="bg-white/95 backdrop-blur-xs border-2 border-amber-200/80 hover:border-indigo-300 rounded-3xl p-4 md:p-5 shadow-sm transition-all space-y-3.5">
              <form onSubmit={handleCreateTask} className="flex items-center gap-3">
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => {
                    setQuickTitle(e.target.value);
                    if (activeList) {
                      realtimeSocket.sendTyping(activeList.id, undefined, currentUser, true);
                    }
                  }}
                  onBlur={() => {
                    if (activeList) {
                      realtimeSocket.sendTyping(activeList.id, undefined, currentUser, false);
                    }
                  }}
                  placeholder="Add a new task... (press Enter to save)"
                  className="flex-1 text-sm md:text-base bg-transparent border-none p-0 focus:outline-hidden placeholder:text-slate-400 font-bold text-slate-900"
                />

                <button
                  type="submit"
                  disabled={!quickTitle.trim() || isAddingTask}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-600 hover:via-rose-600 hover:to-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-rose-500/20 hover:scale-103 active:scale-98 flex-shrink-0"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Task</span>
                </button>
              </form>

              {/* Task Options Bar */}
              <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100 text-xs">
                {/* Priority Selection */}
                <div className="flex items-center gap-1 bg-amber-50/80 px-2.5 py-1 rounded-xl border border-amber-200/60">
                  <span className="text-[11px] text-amber-800 font-bold">Priority:</span>
                  <select
                    value={quickPriority}
                    onChange={(e) => setQuickPriority(e.target.value as Priority)}
                    className="bg-transparent border-none p-0 text-xs text-amber-950 font-bold focus:outline-hidden cursor-pointer"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Due Date */}
                <div className="flex items-center gap-1 bg-sky-50/80 px-2.5 py-1 rounded-xl border border-sky-200/60">
                  <span className="text-[11px] text-sky-800 font-bold">Due:</span>
                  <input
                    type="date"
                    value={quickDueDate}
                    onChange={(e) => setQuickDueDate(e.target.value)}
                    className="bg-transparent border-none p-0 text-xs text-sky-950 font-bold focus:outline-hidden cursor-pointer"
                  />
                </div>

                {/* Assignee if shared */}
                {activeList && activeList.isShared && (
                  <div className="flex items-center gap-1 bg-violet-50/80 px-2.5 py-1 rounded-xl border border-violet-200/60">
                    <span className="text-[11px] text-violet-800 font-bold">Assignee:</span>
                    <select
                      value={quickAssignee}
                      onChange={(e) => setQuickAssignee(e.target.value)}
                      className="bg-transparent border-none p-0 text-xs text-violet-950 font-bold focus:outline-hidden cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {activeList.collaborators.map((c) => (
                        <option key={c.userId} value={c.userId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tag */}
                <div className="flex items-center gap-1 bg-rose-50/80 px-2.5 py-1 rounded-xl border border-rose-200/60">
                  <span className="text-[11px] text-rose-800 font-bold">Tag:</span>
                  <input
                    type="text"
                    value={quickTag}
                    onChange={(e) => setQuickTag(e.target.value)}
                    placeholder="#optional"
                    className="w-20 bg-transparent border-none p-0 text-xs text-rose-950 font-bold focus:outline-hidden placeholder:text-rose-300"
                  />
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search tasks, tags, or assignees..."
                  className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:border-indigo-400 shadow-2xs"
                />
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Priority Filter */}
                <select
                  value={filters.priority}
                  onChange={(e) => setFilters({ ...filters, priority: e.target.value as any })}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-hidden shadow-2xs"
                >
                  <option value="all">All Priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                {/* Assignee Filter */}
                {activeList && activeList.isShared && (
                  <select
                    value={filters.assignee}
                    onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-hidden shadow-2xs"
                  >
                    <option value="all">All Members</option>
                    <option value="me">Assigned to Me</option>
                    {activeList.collaborators.map((c) => (
                      <option key={c.userId} value={c.userId}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Hide Completed Toggle */}
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, hideCompleted: !filters.hideCompleted })}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
                    filters.hideCompleted
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {filters.hideCompleted ? (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Hide Completed</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Show All</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Active View Renderer */}
            {viewMode === 'list' && (
              <div className="space-y-2.5">
                {filteredTasks.length === 0 ? (
                  <div className="p-12 text-center bg-white/90 border-2 border-dashed border-amber-200 rounded-3xl shadow-xs">
                    <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <h3 className="font-extrabold text-slate-800 text-base">No tasks found</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto font-medium">
                      {tasks.length === 0
                        ? 'This list has no tasks. Add your first task above to get started.'
                        : 'No tasks match your current search and filter settings.'}
                    </p>
                  </div>
                ) : (
                  filteredTasks.map((task) => (
                    <TaskItem
                      key={task.id}
                      task={task}
                      onToggleComplete={handleToggleComplete}
                      onClick={setSelectedTask}
                      onDelete={handleDeleteTask}
                    />
                  ))
                )}
              </div>
            )}

            {viewMode === 'board' && (
              <KanbanBoard
                tasks={filteredTasks}
                onTaskClick={setSelectedTask}
                onUpdateStatus={handleStatusChangeFromKanban}
                onQuickAdd={handleQuickAddKanban}
              />
            )}

            {viewMode === 'matrix' && (
              <EisenhowerMatrix
                tasks={filteredTasks}
                onTaskClick={setSelectedTask}
                onToggleComplete={handleToggleComplete}
              />
            )}

            {viewMode === 'calendar' && (
              <CalendarView
                tasks={filteredTasks}
                onTaskClick={setSelectedTask}
                onToggleComplete={handleToggleComplete}
              />
            )}
          </div>
        </main>
      </div>

      {/* Task Details Modal */}
      {selectedTask && activeList && (
        <TaskDetailModal
          task={selectedTask}
          list={activeList}
          currentUser={currentUser}
          isOpen={Boolean(selectedTask)}
          onClose={() => setSelectedTask(null)}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
        />
      )}

      {/* Collaborative Share Modal */}
      {activeList && (
        <ShareModal
          list={activeList}
          currentUser={currentUser}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onListUpdated={(updated) => {
            setLists((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          }}
        />
      )}

      {/* Real-time Activity Feed Drawer */}
      {activeList && (
        <ActivityDrawer
          list={activeList}
          isOpen={isActivityDrawerOpen}
          onClose={() => setIsActivityDrawerOpen(false)}
        />
      )}

      {/* Create List Modal */}
      <CreateListModal
        currentUser={currentUser}
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onListCreated={(newList) => {
          setLists((prev) => [newList, ...prev]);
          setActiveListId(newList.id);
        }}
      />

      {/* Persona / User Profile Switcher */}
      <UserProfileModal
        currentUser={currentUser}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUserChanged={(newUser) => {
          setCurrentUser(newUser);
        }}
      />

      {/* Join List Modal */}
      <JoinListModal
        currentUser={currentUser}
        isOpen={isJoinListOpen}
        onClose={() => setIsJoinListOpen(false)}
        onListJoined={(joinedList) => {
          setLists((prev) => {
            if (prev.some((l) => l.id === joinedList.id)) return prev;
            return [...prev, joinedList];
          });
          setActiveListId(joinedList.id);
        }}
      />

      {/* List Settings Modal */}
      {activeList && (
        <ListSettingsModal
          list={activeList}
          isOpen={isListSettingsOpen}
          onClose={() => setIsListSettingsOpen(false)}
          onListUpdated={(updated) => {
            setLists((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
          }}
          onListDeleted={(deletedId) => {
            setLists((prev) => prev.filter((l) => l.id !== deletedId));
            const remaining = lists.filter((l) => l.id !== deletedId);
            if (remaining.length > 0) setActiveListId(remaining[0].id);
          }}
        />
      )}
    </div>
  );
}

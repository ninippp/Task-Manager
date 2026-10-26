export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  avatarInitials: string;
}

export interface Collaborator {
  userId: string;
  name: string;
  email: string;
  avatarColor: string;
  avatarInitials: string;
  role: CollaboratorRole;
  joinedAt: string;
  isOnline?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatarColor: string;
  content: string;
  createdAt: string;
}

export interface TaskItemData {
  id: string;
  listId: string;
  title: string;
  description?: string;
  completed: boolean;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string | null;
  assignedTo?: string | null; // userId
  assigneeName?: string | null;
  assigneeAvatarColor?: string | null;
  tags: string[];
  subtasks: Subtask[];
  commentsCount: number;
  order: number;
  createdBy: string;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

export interface TaskList {
  id: string;
  title: string;
  description?: string;
  color: string;
  icon: string;
  isShared: boolean;
  ownerId: string;
  ownerName: string;
  collaborators: Collaborator[];
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
  completedCount?: number;
}

export interface ActivityLogItem {
  id: string;
  listId: string;
  taskId?: string;
  taskTitle?: string;
  userId: string;
  userName: string;
  userAvatarColor: string;
  action: 'create' | 'update' | 'complete' | 'reopen' | 'delete' | 'comment' | 'assign' | 'join';
  details: string;
  timestamp: string;
}

export type ViewMode = 'list' | 'board' | 'matrix' | 'calendar';

export interface FilterState {
  search: string;
  priority: Priority | 'all';
  status: TaskStatus | 'all';
  assignee: string | 'all';
  tag: string | 'all';
  hideCompleted: boolean;
}

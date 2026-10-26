import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  TaskList,
  TaskItemData,
  TaskComment,
  ActivityLogItem,
} from './src/types/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface UserPresence {
  userId: string;
  name: string;
  avatarColor: string;
  avatarInitials: string;
  joinedAt: number;
  lastActive: number;
}

interface ClientMeta {
  ws: WebSocket;
  userId?: string;
  userName?: string;
  avatarColor?: string;
  avatarInitials?: string;
  currentListId?: string;
}

interface ServerData {
  lists: TaskList[];
  tasks: TaskItemData[];
  comments: TaskComment[];
  activities: ActivityLogItem[];
}

// Initial Seed Data
const initialSeed: ServerData = {
  lists: [
    {
      id: 'list-personal-1',
      title: 'Daily Focus & Habits',
      description: 'Key personal objectives, focus tasks, and daily routine.',
      color: '#3b82f6', // blue
      icon: 'sparkles',
      isShared: false,
      ownerId: 'user-default',
      ownerName: 'You',
      collaborators: [
        {
          userId: 'user-default',
          name: 'You',
          email: 'you@example.com',
          avatarColor: '#2563eb',
          avatarInitials: 'ME',
          role: 'owner',
          joinedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        },
      ],
      inviteCode: 'FOCUS-789',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'list-collab-1',
      title: 'Q4 Product Launch',
      description: 'Shared sprint board for marketing release, design QA, and client onboarding.',
      color: '#8b5cf6', // purple
      icon: 'rocket',
      isShared: true,
      ownerId: 'user-default',
      ownerName: 'You',
      collaborators: [
        {
          userId: 'user-default',
          name: 'You',
          email: 'you@example.com',
          avatarColor: '#2563eb',
          avatarInitials: 'ME',
          role: 'owner',
          joinedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        },
        {
          userId: 'user-jordan',
          name: 'Jordan Lee',
          email: 'jordan.lee@example.com',
          avatarColor: '#10b981',
          avatarInitials: 'JL',
          role: 'editor',
          joinedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        },
        {
          userId: 'user-taylor',
          name: 'Taylor Rivera',
          email: 'taylor.r@example.com',
          avatarColor: '#f59e0b',
          avatarInitials: 'TR',
          role: 'editor',
          joinedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        },
        {
          userId: 'user-sam',
          name: 'Sam Patel',
          email: 'sam.patel@example.com',
          avatarColor: '#ec4899',
          avatarInitials: 'SP',
          role: 'viewer',
          joinedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        },
      ],
      inviteCode: 'LAUNCH-404',
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'list-collab-2',
      title: 'Family & Home Projects',
      description: 'Shared list for weekend home improvements, budgeting, and travel itinerary.',
      color: '#10b981', // emerald
      icon: 'home',
      isShared: true,
      ownerId: 'user-default',
      ownerName: 'You',
      collaborators: [
        {
          userId: 'user-default',
          name: 'You',
          email: 'you@example.com',
          avatarColor: '#2563eb',
          avatarInitials: 'ME',
          role: 'owner',
          joinedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        },
        {
          userId: 'user-alex',
          name: 'Alex Chen',
          email: 'alex.chen@example.com',
          avatarColor: '#06b6d4',
          avatarInitials: 'AC',
          role: 'editor',
          joinedAt: new Date(Date.now() - 86400000 * 9).toISOString(),
        },
      ],
      inviteCode: 'HOME-102',
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  tasks: [
    {
      id: 'task-101',
      listId: 'list-personal-1',
      title: 'Deep work: Review architecture specifications',
      description: 'Spend 90 minutes uninterrupted on system flow and security audit requirements.',
      completed: true,
      status: 'done',
      priority: 'high',
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      assignedTo: 'user-default',
      assigneeName: 'You',
      assigneeAvatarColor: '#2563eb',
      tags: ['Focus', 'Architecture'],
      subtasks: [
        { id: 'sub-1', title: 'Check API latency targets', completed: true },
        { id: 'sub-2', title: 'Verify rate limiting policy', completed: true },
      ],
      commentsCount: 1,
      order: 1,
      createdBy: 'user-default',
      creatorName: 'You',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'task-102',
      listId: 'list-personal-1',
      title: 'Prepare weekly priorities & reflection',
      description: 'Summarize key deliverables achieved and plan next week targets.',
      completed: false,
      status: 'in_progress',
      priority: 'medium',
      dueDate: new Date(Date.now() + 86400000 * 1).toISOString(),
      assignedTo: 'user-default',
      assigneeName: 'You',
      assigneeAvatarColor: '#2563eb',
      tags: ['Planning', 'Review'],
      subtasks: [
        { id: 'sub-3', title: 'Review open pull requests', completed: true },
        { id: 'sub-4', title: 'Outline top 3 goals', completed: false },
      ],
      commentsCount: 0,
      order: 2,
      createdBy: 'user-default',
      creatorName: 'You',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    },
    {
      id: 'task-103',
      listId: 'list-personal-1',
      title: 'Read 2 chapters of Systems Performance',
      description: 'Focus on storage I/O and caching strategies.',
      completed: false,
      status: 'todo',
      priority: 'low',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      assignedTo: 'user-default',
      assigneeName: 'You',
      assigneeAvatarColor: '#2563eb',
      tags: ['Learning'],
      subtasks: [],
      commentsCount: 0,
      order: 3,
      createdBy: 'user-default',
      creatorName: 'You',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    },
    // Launch sprint tasks
    {
      id: 'task-201',
      listId: 'list-collab-1',
      title: 'Finalize mobile responsive QA for onboarding flow',
      description: 'Test step 1 to 4 on iOS Safari and Chrome Android. Ensure zero horizontal scroll and 44px tap targets.',
      completed: false,
      status: 'in_progress',
      priority: 'urgent',
      dueDate: new Date(Date.now() + 86400000 * 1).toISOString(),
      assignedTo: 'user-taylor',
      assigneeName: 'Taylor Rivera',
      assigneeAvatarColor: '#f59e0b',
      tags: ['QA', 'Frontend', 'Mobile'],
      subtasks: [
        { id: 'sub-201-1', title: 'Test iPhone 15 Safari', completed: true },
        { id: 'sub-201-2', title: 'Test Pixel 8 Chrome', completed: true },
        { id: 'sub-201-3', title: 'Verify modal viewport escape', completed: false },
      ],
      commentsCount: 2,
      order: 1,
      createdBy: 'user-default',
      creatorName: 'You',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    },
    {
      id: 'task-202',
      listId: 'list-collab-1',
      title: 'Publish Product Hunt and Press Kit assets',
      description: 'Prepare high-res gallery screenshots, product badges, and 120-word pitch copy.',
      completed: false,
      status: 'todo',
      priority: 'high',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      assignedTo: 'user-jordan',
      assigneeName: 'Jordan Lee',
      assigneeAvatarColor: '#10b981',
      tags: ['Marketing', 'Launch'],
      subtasks: [
        { id: 'sub-202-1', title: 'Export clean 1200x630 OG banner', completed: true },
        { id: 'sub-202-2', title: 'Draft maker comment', completed: false },
      ],
      commentsCount: 3,
      order: 2,
      createdBy: 'user-jordan',
      creatorName: 'Jordan Lee',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    },
    {
      id: 'task-203',
      listId: 'list-collab-1',
      title: 'Set up real-time websocket health monitor',
      description: 'Add reconnect heartbeat ping and metrics logging for active client connections.',
      completed: true,
      status: 'done',
      priority: 'high',
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      assignedTo: 'user-default',
      assigneeName: 'You',
      assigneeAvatarColor: '#2563eb',
      tags: ['Backend', 'Infrastructure'],
      subtasks: [
        { id: 'sub-203-1', title: 'Implement ping/pong interval', completed: true },
        { id: 'sub-203-2', title: 'Add room broadcast telemetry', completed: true },
      ],
      commentsCount: 1,
      order: 3,
      createdBy: 'user-default',
      creatorName: 'You',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      completedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'task-204',
      listId: 'list-collab-1',
      title: 'Design empty state illustrations and micro-animations',
      description: 'Subtle SVGs with clear calls to action when lists or filters return zero items.',
      completed: false,
      status: 'review',
      priority: 'medium',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
      assignedTo: 'user-sam',
      assigneeName: 'Sam Patel',
      assigneeAvatarColor: '#ec4899',
      tags: ['Design', 'UI'],
      subtasks: [],
      commentsCount: 1,
      order: 4,
      createdBy: 'user-sam',
      creatorName: 'Sam Patel',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    },
    // Home projects
    {
      id: 'task-301',
      listId: 'list-collab-2',
      title: 'Confirm balcony planters and drip irrigation kit',
      description: 'Check dimensions and order automated timer valve with 1/4 inch tubing.',
      completed: false,
      status: 'todo',
      priority: 'medium',
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      assignedTo: 'user-alex',
      assigneeName: 'Alex Chen',
      assigneeAvatarColor: '#06b6d4',
      tags: ['Garden', 'DIY'],
      subtasks: [],
      commentsCount: 0,
      order: 1,
      createdBy: 'user-default',
      creatorName: 'You',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
    },
  ],
  comments: [
    {
      id: 'comm-1',
      taskId: 'task-201',
      userId: 'user-taylor',
      userName: 'Taylor Rivera',
      userAvatarColor: '#f59e0b',
      content: 'Tested iPhone 15 Safari, animations are silky smooth! Checking Android Chrome gestures now.',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'comm-2',
      taskId: 'task-201',
      userId: 'user-default',
      userName: 'You',
      userAvatarColor: '#2563eb',
      content: 'Awesome progress. Let me know if you need any adjustments to the viewport layout.',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'comm-3',
      taskId: 'task-202',
      userId: 'user-jordan',
      userName: 'Jordan Lee',
      userAvatarColor: '#10b981',
      content: 'Shared the preview link with early testers. Got very positive feedback on the real-time presence indicators!',
      createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
  ],
  activities: [
    {
      id: 'act-1',
      listId: 'list-collab-1',
      taskId: 'task-203',
      taskTitle: 'Set up real-time websocket health monitor',
      userId: 'user-default',
      userName: 'You',
      userAvatarColor: '#2563eb',
      action: 'complete',
      details: 'marked task as completed',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'act-2',
      listId: 'list-collab-1',
      taskId: 'task-201',
      taskTitle: 'Finalize mobile responsive QA for onboarding flow',
      userId: 'user-taylor',
      userName: 'Taylor Rivera',
      userAvatarColor: '#f59e0b',
      action: 'comment',
      details: 'commented on task',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'act-3',
      listId: 'list-collab-1',
      taskId: 'task-204',
      taskTitle: 'Design empty state illustrations and micro-animations',
      userId: 'user-sam',
      userName: 'Sam Patel',
      userAvatarColor: '#ec4899',
      action: 'update',
      details: 'moved task to Review',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    },
  ],
};

// Data Store in memory with file backup
class Database {
  data: ServerData;

  constructor() {
    this.data = this.load();
  }

  load(): ServerData {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load DB file, using initial seed:', e);
    }
    this.save(initialSeed);
    return JSON.parse(JSON.stringify(initialSeed));
  }

  save(dataToSave?: ServerData) {
    try {
      const payload = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write DB file:', e);
    }
  }

  reset() {
    this.data = JSON.parse(JSON.stringify(initialSeed));
    this.save();
    return this.data;
  }
}

const db = new Database();

// Helper to compute list task counts
function enrichLists(lists: typeof db.data.lists, tasks: typeof db.data.tasks) {
  return lists.map((list) => {
    const listTasks = tasks.filter((t) => t.listId === list.id);
    return {
      ...list,
      taskCount: listTasks.length,
      completedCount: listTasks.filter((t) => t.completed).length,
    };
  });
}

// Presence Map: listId -> Map<userId, UserPresence>
const listPresence = new Map<string, Map<string, UserPresence>>();
// Connected clients tracking
const clients = new Set<ClientMeta>();

function broadcastToList(listId: string, message: any, excludeWs?: WebSocket) {
  const payload = JSON.stringify(message);
  for (const client of clients) {
    if (client.currentListId === listId && client.ws.readyState === WebSocket.OPEN) {
      if (excludeWs && client.ws === excludeWs) continue;
      client.ws.send(payload);
    }
  }
}

function broadcastPresence(listId: string) {
  const map = listPresence.get(listId);
  const users = map ? Array.from(map.values()) : [];
  broadcastToList(listId, {
    type: 'presence:update',
    listId,
    users,
  });
}

function addActivity(item: {
  listId: string;
  taskId?: string;
  taskTitle?: string;
  userId: string;
  userName: string;
  userAvatarColor: string;
  action: 'create' | 'update' | 'complete' | 'reopen' | 'delete' | 'comment' | 'assign' | 'join';
  details: string;
}) {
  const newActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ...item,
    timestamp: new Date().toISOString(),
  };
  db.data.activities.unshift(newActivity);
  // Keep max 200 activities
  if (db.data.activities.length > 200) {
    db.data.activities = db.data.activities.slice(0, 200);
  }
  db.save();

  broadcastToList(item.listId, {
    type: 'activity:new',
    activity: newActivity,
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    const clientMeta: ClientMeta = { ws };
    clients.add(clientMeta);

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'join_list') {
          // Leave previous room if any
          if (clientMeta.currentListId && clientMeta.userId) {
            const oldMap = listPresence.get(clientMeta.currentListId);
            if (oldMap) {
              oldMap.delete(clientMeta.userId);
              broadcastPresence(clientMeta.currentListId);
            }
          }

          clientMeta.currentListId = msg.listId;
          clientMeta.userId = msg.user.id;
          clientMeta.userName = msg.user.name;
          clientMeta.avatarColor = msg.user.avatarColor;
          clientMeta.avatarInitials = msg.user.avatarInitials;

          if (!listPresence.has(msg.listId)) {
            listPresence.set(msg.listId, new Map());
          }
          const presenceMap = listPresence.get(msg.listId)!;
          presenceMap.set(msg.user.id, {
            userId: msg.user.id,
            name: msg.user.name,
            avatarColor: msg.user.avatarColor,
            avatarInitials: msg.user.avatarInitials,
            joinedAt: Date.now(),
            lastActive: Date.now(),
          });

          broadcastPresence(msg.listId);
        } else if (msg.type === 'leave_list') {
          if (clientMeta.currentListId && clientMeta.userId) {
            const oldMap = listPresence.get(clientMeta.currentListId);
            if (oldMap) {
              oldMap.delete(clientMeta.userId);
              broadcastPresence(clientMeta.currentListId);
            }
          }
          clientMeta.currentListId = undefined;
        } else if (msg.type === 'ping') {
          if (clientMeta.currentListId && clientMeta.userId) {
            const map = listPresence.get(clientMeta.currentListId);
            const userP = map?.get(clientMeta.userId);
            if (userP) userP.lastActive = Date.now();
          }
          ws.send(JSON.stringify({ type: 'pong' }));
        } else if (msg.type === 'typing') {
          broadcastToList(msg.listId, {
            type: 'user:typing',
            listId: msg.listId,
            taskId: msg.taskId,
            user: msg.user,
            isTyping: msg.isTyping,
          }, ws);
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      if (clientMeta.currentListId && clientMeta.userId) {
        const map = listPresence.get(clientMeta.currentListId);
        if (map) {
          map.delete(clientMeta.userId);
          broadcastPresence(clientMeta.currentListId);
        }
      }
      clients.delete(clientMeta);
    });
  });

  // REST API Routes

  // GET /api/lists
  app.get('/api/lists', (_req: Request, res: Response) => {
    const enriched = enrichLists(db.data.lists, db.data.tasks);
    res.json(enriched);
  });

  // POST /api/lists
  app.post('/api/lists', (req: Request, res: Response) => {
    const { title, description, color, icon, isShared, ownerId, ownerName, ownerEmail, avatarColor, avatarInitials } = req.body;
    if (!title?.trim()) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newList = {
      id: `list-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      description: description?.trim() || '',
      color: color || '#3b82f6',
      icon: icon || 'check-square',
      isShared: Boolean(isShared),
      ownerId: ownerId || 'user-default',
      ownerName: ownerName || 'You',
      collaborators: [
        {
          userId: ownerId || 'user-default',
          name: ownerName || 'You',
          email: ownerEmail || 'you@example.com',
          avatarColor: avatarColor || '#2563eb',
          avatarInitials: avatarInitials || 'ME',
          role: 'owner' as const,
          joinedAt: new Date().toISOString(),
        },
      ],
      inviteCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.data.lists.unshift(newList);
    db.save();

    // Broadcast list creation
    const enriched = enrichLists([newList], db.data.tasks)[0];
    res.status(201).json(enriched);
  });

  // PATCH /api/lists/:id
  app.patch('/api/lists/:id', (req: Request, res: Response) => {
    const listIndex = db.data.lists.findIndex((l) => l.id === req.params.id);
    if (listIndex === -1) {
      res.status(404).json({ error: 'List not found' });
      return;
    }

    const { title, description, color, icon, isShared } = req.body;
    const current = db.data.lists[listIndex];
    const updated = {
      ...current,
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(icon !== undefined ? { icon } : {}),
      ...(isShared !== undefined ? { isShared: Boolean(isShared) } : {}),
      updatedAt: new Date().toISOString(),
    };

    db.data.lists[listIndex] = updated;
    db.save();

    const enriched = enrichLists([updated], db.data.tasks)[0];
    broadcastToList(updated.id, {
      type: 'list:updated',
      list: enriched,
    });

    res.json(enriched);
  });

  // DELETE /api/lists/:id
  app.delete('/api/lists/:id', (req: Request, res: Response) => {
    const id = req.params.id;
    db.data.lists = db.data.lists.filter((l) => l.id !== id);
    db.data.tasks = db.data.tasks.filter((t) => t.listId !== id);
    db.data.activities = db.data.activities.filter((a) => a.listId !== id);
    db.save();

    broadcastToList(id, {
      type: 'list:deleted',
      listId: id,
    });

    res.json({ success: true, id });
  });

  // GET /api/lists/:id/tasks
  app.get('/api/lists/:id/tasks', (req: Request, res: Response) => {
    const listTasks = db.data.tasks
      .filter((t) => t.listId === req.params.id)
      .sort((a, b) => a.order - b.order);
    res.json(listTasks);
  });

  // POST /api/lists/:id/tasks
  app.post('/api/lists/:id/tasks', (req: Request, res: Response) => {
    const listId = req.params.id;
    const list = db.data.lists.find((l) => l.id === listId);
    if (!list) {
      res.status(404).json({ error: 'List not found' });
      return;
    }

    const {
      title,
      description,
      priority,
      status,
      dueDate,
      assignedTo,
      assigneeName,
      assigneeAvatarColor,
      tags,
      subtasks,
      createdBy,
      creatorName,
      userAvatarColor,
    } = req.body;

    if (!title?.trim()) {
      res.status(400).json({ error: 'Task title is required' });
      return;
    }

    const listTasks = db.data.tasks.filter((t) => t.listId === listId);
    const maxOrder = listTasks.reduce((max, t) => Math.max(max, t.order || 0), 0);

    const newTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      listId,
      title: title.trim(),
      description: description?.trim() || '',
      completed: status === 'done',
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      assignedTo: assignedTo || null,
      assigneeName: assigneeName || null,
      assigneeAvatarColor: assigneeAvatarColor || null,
      tags: Array.isArray(tags) ? tags : [],
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      commentsCount: 0,
      order: maxOrder + 1,
      createdBy: createdBy || 'user-default',
      creatorName: creatorName || 'You',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: status === 'done' ? new Date().toISOString() : null,
    };

    db.data.tasks.push(newTask);
    list.updatedAt = new Date().toISOString();
    db.save();

    addActivity({
      listId,
      taskId: newTask.id,
      taskTitle: newTask.title,
      userId: createdBy || 'user-default',
      userName: creatorName || 'You',
      userAvatarColor: userAvatarColor || '#2563eb',
      action: 'create',
      details: `created task "${newTask.title}"`,
    });

    broadcastToList(listId, {
      type: 'task:created',
      task: newTask,
    });

    res.status(201).json(newTask);
  });

  // PATCH /api/lists/:id/tasks/:taskId
  app.patch('/api/lists/:id/tasks/:taskId', (req: Request, res: Response) => {
    const { id: listId, taskId } = req.params;
    const taskIndex = db.data.tasks.findIndex((t) => t.id === taskId && t.listId === listId);
    if (taskIndex === -1) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const currentTask = db.data.tasks[taskIndex];
    const {
      title,
      description,
      completed,
      status,
      priority,
      dueDate,
      assignedTo,
      assigneeName,
      assigneeAvatarColor,
      tags,
      subtasks,
      order,
      userId,
      userName,
      userAvatarColor,
    } = req.body;

    let newStatus = status !== undefined ? status : currentTask.status;
    let isCompleted = completed !== undefined ? completed : currentTask.completed;

    if (completed !== undefined && status === undefined) {
      newStatus = completed ? 'done' : (currentTask.status === 'done' ? 'todo' : currentTask.status);
    } else if (status !== undefined && completed === undefined) {
      isCompleted = status === 'done';
    }

    const updatedTask = {
      ...currentTask,
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      completed: isCompleted,
      status: newStatus,
      ...(priority !== undefined ? { priority } : {}),
      ...(dueDate !== undefined ? { dueDate } : {}),
      ...(assignedTo !== undefined ? { assignedTo } : {}),
      ...(assigneeName !== undefined ? { assigneeName } : {}),
      ...(assigneeAvatarColor !== undefined ? { assigneeAvatarColor } : {}),
      ...(tags !== undefined ? { tags } : {}),
      ...(subtasks !== undefined ? { subtasks } : {}),
      ...(order !== undefined ? { order } : {}),
      updatedAt: new Date().toISOString(),
      completedAt: isCompleted ? (currentTask.completedAt || new Date().toISOString()) : null,
    };

    db.data.tasks[taskIndex] = updatedTask;
    db.save();

    // Log activity if key status changed
    if (completed !== undefined && completed !== currentTask.completed) {
      addActivity({
        listId,
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        userId: userId || 'user-default',
        userName: userName || 'You',
        userAvatarColor: userAvatarColor || '#2563eb',
        action: completed ? 'complete' : 'reopen',
        details: completed ? `completed "${updatedTask.title}"` : `reopened "${updatedTask.title}"`,
      });
    } else if (status !== undefined && status !== currentTask.status) {
      addActivity({
        listId,
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        userId: userId || 'user-default',
        userName: userName || 'You',
        userAvatarColor: userAvatarColor || '#2563eb',
        action: 'update',
        details: `moved "${updatedTask.title}" to ${newStatus.replace('_', ' ').toUpperCase()}`,
      });
    } else if (assignedTo !== undefined && assignedTo !== currentTask.assignedTo) {
      addActivity({
        listId,
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        userId: userId || 'user-default',
        userName: userName || 'You',
        userAvatarColor: userAvatarColor || '#2563eb',
        action: 'assign',
        details: assigneeName ? `assigned "${updatedTask.title}" to ${assigneeName}` : `unassigned "${updatedTask.title}"`,
      });
    }

    broadcastToList(listId, {
      type: 'task:updated',
      task: updatedTask,
    });

    res.json(updatedTask);
  });

  // DELETE /api/lists/:id/tasks/:taskId
  app.delete('/api/lists/:id/tasks/:taskId', (req: Request, res: Response) => {
    const { id: listId, taskId } = req.params;
    const task = db.data.tasks.find((t) => t.id === taskId && t.listId === listId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    db.data.tasks = db.data.tasks.filter((t) => t.id !== taskId);
    db.data.comments = db.data.comments.filter((c) => c.taskId !== taskId);
    db.save();

    addActivity({
      listId,
      taskId,
      taskTitle: task.title,
      userId: (req.query.userId as string) || 'user-default',
      userName: (req.query.userName as string) || 'You',
      userAvatarColor: (req.query.userAvatarColor as string) || '#2563eb',
      action: 'delete',
      details: `deleted task "${task.title}"`,
    });

    broadcastToList(listId, {
      type: 'task:deleted',
      taskId,
      listId,
    });

    res.json({ success: true, taskId });
  });

  // GET /api/lists/:id/tasks/:taskId/comments
  app.get('/api/lists/:id/tasks/:taskId/comments', (req: Request, res: Response) => {
    const { taskId } = req.params;
    const comments = db.data.comments
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json(comments);
  });

  // POST /api/lists/:id/tasks/:taskId/comments
  app.post('/api/lists/:id/tasks/:taskId/comments', (req: Request, res: Response) => {
    const { id: listId, taskId } = req.params;
    const task = db.data.tasks.find((t) => t.id === taskId && t.listId === listId);
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const { content, userId, userName, userAvatarColor } = req.body;
    if (!content?.trim()) {
      res.status(400).json({ error: 'Comment content cannot be empty' });
      return;
    }

    const newComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      taskId,
      userId: userId || 'user-default',
      userName: userName || 'You',
      userAvatarColor: userAvatarColor || '#2563eb',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    db.data.comments.push(newComment);
    task.commentsCount = (task.commentsCount || 0) + 1;
    task.updatedAt = new Date().toISOString();
    db.save();

    addActivity({
      listId,
      taskId,
      taskTitle: task.title,
      userId: newComment.userId,
      userName: newComment.userName,
      userAvatarColor: newComment.userAvatarColor,
      action: 'comment',
      details: `commented: "${newComment.content.length > 50 ? newComment.content.slice(0, 50) + '...' : newComment.content}"`,
    });

    broadcastToList(listId, {
      type: 'comment:created',
      comment: newComment,
      taskId,
      commentsCount: task.commentsCount,
    });

    res.status(201).json(newComment);
  });

  // GET /api/lists/:id/activities
  app.get('/api/lists/:id/activities', (req: Request, res: Response) => {
    const activities = db.data.activities
      .filter((a) => a.listId === req.params.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 50);
    res.json(activities);
  });

  // POST /api/lists/join/:inviteCode
  app.post('/api/lists/join/:inviteCode', (req: Request, res: Response) => {
    const code = req.params.inviteCode.toUpperCase();
    const list = db.data.lists.find((l) => l.inviteCode.toUpperCase() === code);
    if (!list) {
      res.status(404).json({ error: 'Invalid invite code or list does not exist' });
      return;
    }

    const { userId, name, email, avatarColor, avatarInitials } = req.body;
    if (!userId || !name) {
      res.status(400).json({ error: 'User details required to join' });
      return;
    }

    const existingCollab = list.collaborators.find((c) => c.userId === userId);
    if (!existingCollab) {
      list.collaborators.push({
        userId,
        name,
        email: email || `${userId}@example.com`,
        avatarColor: avatarColor || '#6366f1',
        avatarInitials: avatarInitials || name.slice(0, 2).toUpperCase(),
        role: 'editor',
        joinedAt: new Date().toISOString(),
      });
      list.isShared = true;
      list.updatedAt = new Date().toISOString();
      db.save();

      addActivity({
        listId: list.id,
        userId,
        userName: name,
        userAvatarColor: avatarColor || '#6366f1',
        action: 'join',
        details: `joined the list as an editor`,
      });

      broadcastToList(list.id, {
        type: 'list:collaborator_joined',
        listId: list.id,
        collaborator: list.collaborators[list.collaborators.length - 1],
      });
    }

    const enriched = enrichLists([list], db.data.tasks)[0];
    res.json(enriched);
  });

  // POST /api/lists/:id/collaborators
  app.post('/api/lists/:id/collaborators', (req: Request, res: Response) => {
    const list = db.data.lists.find((l) => l.id === req.params.id);
    if (!list) {
      res.status(404).json({ error: 'List not found' });
      return;
    }

    const { name, email, role, avatarColor } = req.body;
    if (!name?.trim() || !email?.trim()) {
      res.status(400).json({ error: 'Name and email are required' });
      return;
    }

    const initials = name.trim().split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase();
    const newCollab = {
      userId: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      avatarColor: avatarColor || '#6366f1',
      avatarInitials: initials || 'CO',
      role: (role === 'viewer' ? 'viewer' : 'editor') as 'editor' | 'viewer',
      joinedAt: new Date().toISOString(),
    };

    list.collaborators.push(newCollab);
    list.isShared = true;
    list.updatedAt = new Date().toISOString();
    db.save();

    broadcastToList(list.id, {
      type: 'list:collaborator_joined',
      listId: list.id,
      collaborator: newCollab,
    });

    res.status(201).json(newCollab);
  });

  // DELETE /api/lists/:id/collaborators/:userId
  app.delete('/api/lists/:id/collaborators/:userId', (req: Request, res: Response) => {
    const list = db.data.lists.find((l) => l.id === req.params.id);
    if (!list) {
      res.status(404).json({ error: 'List not found' });
      return;
    }

    const targetUser = list.collaborators.find((c) => c.userId === req.params.userId);
    if (!targetUser) {
      res.status(404).json({ error: 'Collaborator not found' });
      return;
    }

    if (targetUser.role === 'owner') {
      res.status(400).json({ error: 'Cannot remove owner from list' });
      return;
    }

    list.collaborators = list.collaborators.filter((c) => c.userId !== req.params.userId);
    list.updatedAt = new Date().toISOString();
    db.save();

    broadcastToList(list.id, {
      type: 'list:collaborator_removed',
      listId: list.id,
      userId: req.params.userId,
    });

    res.json({ success: true, userId: req.params.userId });
  });

  // POST /api/reset-seed
  app.post('/api/reset-seed', (_req: Request, res: Response) => {
    const fresh = db.reset();
    res.json({ success: true, message: 'Database reset to initial demo state', data: fresh });
  });

  // Mount Vite or Static Files
  const isDev = process.env.NODE_ENV !== 'production';
  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[SynchroTask] Server running on http://0.0.0.0:${PORT} (dev: ${isDev})`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});

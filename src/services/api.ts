import {
  TaskList,
  TaskItemData,
  TaskComment,
  ActivityLogItem,
  UserProfile,
  Collaborator,
} from '../types';

export const API_BASE = '/api';

// REST API calls
export async function fetchLists(): Promise<TaskList[]> {
  const res = await fetch(`${API_BASE}/lists`);
  if (!res.ok) throw new Error('Failed to fetch lists');
  return res.json();
}

export async function createList(data: {
  title: string;
  description?: string;
  color?: string;
  icon?: string;
  isShared: boolean;
  user: UserProfile;
}): Promise<TaskList> {
  const res = await fetch(`${API_BASE}/lists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: data.title,
      description: data.description,
      color: data.color,
      icon: data.icon,
      isShared: data.isShared,
      ownerId: data.user.id,
      ownerName: data.user.name,
      ownerEmail: data.user.email,
      avatarColor: data.user.avatarColor,
      avatarInitials: data.user.avatarInitials,
    }),
  });
  if (!res.ok) throw new Error('Failed to create list');
  return res.json();
}

export async function updateList(
  listId: string,
  data: Partial<Pick<TaskList, 'title' | 'description' | 'color' | 'icon' | 'isShared'>>
): Promise<TaskList> {
  const res = await fetch(`${API_BASE}/lists/${listId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update list');
  return res.json();
}

export async function deleteList(listId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/lists/${listId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete list');
}

export async function fetchTasks(listId: string): Promise<TaskItemData[]> {
  const res = await fetch(`${API_BASE}/lists/${listId}/tasks`);
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(
  listId: string,
  data: Partial<TaskItemData> & { title: string },
  user: UserProfile
): Promise<TaskItemData> {
  const res = await fetch(`${API_BASE}/lists/${listId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      createdBy: user.id,
      creatorName: user.name,
      userAvatarColor: user.avatarColor,
    }),
  });
  if (!res.ok) throw new Error('Failed to create task');
  return res.json();
}

export async function updateTask(
  listId: string,
  taskId: string,
  data: Partial<TaskItemData>,
  user: UserProfile
): Promise<TaskItemData> {
  const res = await fetch(`${API_BASE}/lists/${listId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      userId: user.id,
      userName: user.name,
      userAvatarColor: user.avatarColor,
    }),
  });
  if (!res.ok) throw new Error('Failed to update task');
  return res.json();
}

export async function deleteTask(
  listId: string,
  taskId: string,
  user: UserProfile
): Promise<void> {
  const params = new URLSearchParams({
    userId: user.id,
    userName: user.name,
    userAvatarColor: user.avatarColor,
  });
  const res = await fetch(`${API_BASE}/lists/${listId}/tasks/${taskId}?${params.toString()}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete task');
}

export async function fetchComments(listId: string, taskId: string): Promise<TaskComment[]> {
  const res = await fetch(`${API_BASE}/lists/${listId}/tasks/${taskId}/comments`);
  if (!res.ok) throw new Error('Failed to fetch comments');
  return res.json();
}

export async function addComment(
  listId: string,
  taskId: string,
  content: string,
  user: UserProfile
): Promise<TaskComment> {
  const res = await fetch(`${API_BASE}/lists/${listId}/tasks/${taskId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      userId: user.id,
      userName: user.name,
      userAvatarColor: user.avatarColor,
    }),
  });
  if (!res.ok) throw new Error('Failed to post comment');
  return res.json();
}

export async function fetchActivities(listId: string): Promise<ActivityLogItem[]> {
  const res = await fetch(`${API_BASE}/lists/${listId}/activities`);
  if (!res.ok) throw new Error('Failed to fetch activities');
  return res.json();
}

export async function joinListByCode(code: string, user: UserProfile): Promise<TaskList> {
  const res = await fetch(`${API_BASE}/lists/join/${encodeURIComponent(code)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user.id,
      name: user.name,
      email: user.email,
      avatarColor: user.avatarColor,
      avatarInitials: user.avatarInitials,
    }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || 'Failed to join list');
  }
  return res.json();
}

export async function addCollaborator(
  listId: string,
  data: { name: string; email: string; role: 'editor' | 'viewer' }
): Promise<Collaborator> {
  const res = await fetch(`${API_BASE}/lists/${listId}/collaborators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to invite collaborator');
  return res.json();
}

export async function removeCollaborator(listId: string, userId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/lists/${listId}/collaborators/${userId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove collaborator');
}

export async function resetDatabase(): Promise<void> {
  const res = await fetch(`${API_BASE}/reset-seed`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset database');
}

// Real-Time WebSocket Manager
type EventCallback = (payload: any) => void;

class RealtimeSocket {
  private ws: WebSocket | null = null;
  private currentListId: string | null = null;
  private currentUser: UserProfile | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private isConnected: boolean = false;
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('synchrotask_cross_tab');
        this.broadcastChannel.onmessage = (event) => {
          this.emitLocal(event.data.type, event.data.payload);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported:', e);
      }
    }
  }

  public connect(user: UserProfile, listId?: string) {
    this.currentUser = user;
    if (listId) this.currentListId = listId;

    if (typeof window === 'undefined') return;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      if (listId && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'join_list', listId, user });
      }
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emitLocal('connection:change', { connected: true });

        // Join room if listId specified
        if (this.currentListId && this.currentUser) {
          this.send({
            type: 'join_list',
            listId: this.currentListId,
            user: this.currentUser,
          });
        }

        // Heartbeat ping
        clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.send({ type: 'ping' });
          }
        }, 15000);
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'pong') return;

          this.emitLocal(msg.type, msg);

          // Mirror to BroadcastChannel for any tabs without active WS
          if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({ type: msg.type, payload: msg });
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emitLocal('connection:change', { connected: false });
        clearInterval(this.pingInterval);
        this.scheduleReconnect();
      };

      this.ws.onerror = (e) => {
        console.warn('WebSocket error:', e);
        this.ws?.close();
      };
    } catch (e) {
      console.warn('WebSocket initialization failed:', e);
      this.scheduleReconnect();
    }
  }

  public switchList(listId: string, user: UserProfile) {
    this.currentListId = listId;
    this.currentUser = user;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'join_list',
        listId,
        user,
      });
    }
  }

  public sendTyping(listId: string, taskId: string | undefined, user: UserProfile, isTyping: boolean) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'typing',
        listId,
        taskId,
        user,
        isTyping,
      });
    }
  }

  public on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emitLocal(event: string, payload: any) {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (err) {
          console.error('Error in event listener:', err);
        }
      });
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      if (this.currentUser) {
        this.connect(this.currentUser, this.currentListId || undefined);
      }
    }, 3000);
  }

  public getStatus() {
    return this.isConnected;
  }
}

export const realtimeSocket = new RealtimeSocket();

export type Status = 'draft' | 'in-progress' | 'under-review' | 'completed' | 'canceled';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  taskId?: string;
  projectId?: string;
  entityId?: string;
  entityType?: 'task' | 'project' | 'client';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'team-lead' | 'employee';
  avatar?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
  notifications?: Notification[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  user?: User;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  dueDate: string; // ISO string
  assignees: User[];
  assigneeIds?: string[]; // IDs of assigned users
  createdBy: string; // user ID
  client?: Client;
  clientId?: string;
  project?: Project;
  projectId?: string;
  subTasks: SubTask[];
  comments: Comment[];
  attachments: string[]; // URLs to attachments
  createdAt: string;
  updatedAt: string;
  editHistory: {
    userId: string;
    timestamp: string;
    changes: string;
  }[];
}

export interface Client {
  id: string;
  name: string;
  description: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  tags?: string[];
  createdBy: string; // user ID who created the client
  status: 'active' | 'inactive';
  links: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  client?: Client;
  status: 'active' | 'completed' | 'on-hold';
  startDate: string;
  endDate?: string;
  createdBy: string; // user ID who created the project
  assignedUserIds?: string[];
}

export interface TasksByStatus {
  draft: Task[];
  'in-progress': Task[];
  'under-review': Task[];
  completed: Task[];
  canceled: Task[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  entityId?: string;
  entityType?: 'client' | 'project' | 'task';
}

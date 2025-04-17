
export type Status = 'draft' | 'in-progress' | 'under-review' | 'completed' | 'canceled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'team-lead' | 'employee';
  avatar?: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  dueDate: string; // ISO string
  assignees: User[];
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
  contactInfo: string;
  description: string;
  links: string[];
  status: 'active' | 'inactive';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  clientId: string;
  status: 'active' | 'completed' | 'on-hold';
  startDate: string;
  endDate?: string;
}

export interface TasksByStatus {
  draft: Task[];
  'in-progress': Task[];
  'under-review': Task[];
  completed: Task[];
  canceled: Task[];
}

import { v4 as uuidv4 } from 'uuid';
import { Client, Project, Task, Status, SubTask } from './types';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = 'http://localhost:5000/api';

// Local storage keys
const NOTES_KEY = 'task_pulse_notes';
const CLIENTS_KEY = 'task_pulse_clients';
const PROJECTS_KEY = 'task_pulse_projects';
const TASKS_KEY = 'task_pulse_tasks';

// Type for notes
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  entityId?: string;
  entityType?: 'client' | 'project' | 'task';
}

// Helper function to get auth headers
const getAuthHeaders = (token: string) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`
});

// Get clients
export const getClients = async (token: string): Promise<Client[]> => {
  const response = await fetch(`${API_BASE_URL}/clients`, {
    headers: getAuthHeaders(token)
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch clients');
  }
  
  return response.json();
};

// Add client
export const addClient = async (clientData: Omit<Client, 'id'>, token: string): Promise<Client> => {
  const response = await fetch(`${API_BASE_URL}/clients`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(clientData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to add client');
  }
  
  return response.json();
};

// Get projects
export const getProjects = async (token: string): Promise<Project[]> => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    headers: getAuthHeaders(token)
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  
  return response.json();
};

// Add project
export const addProject = async (projectData: Omit<Project, 'id'>, token: string): Promise<Project> => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(projectData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to add project');
  }
  
  return response.json();
};

// Get users from the server
export const getUsers = async (token?: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: token ? getAuthHeaders(token) : {}
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    
    const users = await response.json();
    return users.map((user: any) => ({
      id: user.id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email,
      role: user.role === 'admin' ? 'team-lead' : 'employee', // Map admin to team-lead for compatibility
      avatar: user.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.firstName || '')}+${encodeURIComponent(user.lastName || '')}`
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    // Fallback to mock data if server request fails
    return [
      { 
        id: '1', 
        name: 'Admin User', 
        email: 'admin@gmail.com', 
        role: 'team-lead' as const,
        avatar: 'https://ui-avatars.com/api/?name=Admin+User'
      },
      { 
        id: '2', 
        name: 'Hus S', 
        email: 'tester@gmail.com', 
        role: 'employee' as const,
        avatar: 'https://ui-avatars.com/api/?name=Hus+S'
      }
    ];
  }
};

// Get tasks
export const getTasks = async (token: string): Promise<Task[]> => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    headers: getAuthHeaders(token)
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }
  
  return response.json();
};

// Add task
export interface TaskInput {
  title: string;
  description: string;
  status: Status;
  dueDate: string;
  clientId?: string;
  projectId?: string;
  assigneeIds: string[];
  subtasks: { title: string; completed: boolean }[];
}

export const addTask = async (taskData: TaskInput, token: string): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(taskData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to add task');
  }
  
  return response.json();
};

// Get notes
export const getNotes = async (entityType?: string, entityId?: string): Promise<Note[]> => {
  // Get notes from localStorage
  const notes: Note[] = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
  
  // If entityType and entityId provided, filter notes for that entity
  if (entityType && entityId) {
    return notes.filter(note => 
      note.entityType === entityType && note.entityId === entityId
    );
  }
  
  // Otherwise return all notes
  return notes;
};

// Add note
export const addNote = async (noteData: Omit<Note, 'id'>): Promise<Note> => {
  const newNote: Note = {
    id: uuidv4(),
    ...noteData
  };
  
  // Get existing notes
  const notes: Note[] = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
  
  // Add new note to the list
  const updatedNotes = [...notes, newNote];
  
  // Save to localStorage
  localStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
  
  return newNote;
};

// Delete note
export const deleteNote = async (noteId: string): Promise<void> => {
  // Get existing notes
  const notes: Note[] = JSON.parse(localStorage.getItem(NOTES_KEY) || '[]');
  
  // Filter out the note to delete
  const updatedNotes = notes.filter(note => note.id !== noteId);
  
  // Save to localStorage
  localStorage.setItem(NOTES_KEY, JSON.stringify(updatedNotes));
};

// Get enhanced tasks with related data
export const getEnhancedTasks = async (token: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/enhanced-tasks`, {
      headers: getAuthHeaders(token)
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch enhanced tasks');
    }
    
    return response.json();
  } catch (error) {
    console.error("Error fetching enhanced tasks:", error);
    // Fallback to regular tasks if enhanced endpoint fails
    const tasks = await getTasks(token);
    return tasks;
  }
};

// Get calendar events
export const getCalendarEvents = async (token: string) => {
  try {
    // Get all tasks directly from the tasks endpoint
    const tasks = await getTasks(token);
    
    return tasks.map(task => ({
      id: task.id,
      title: task.title,
      start: task.dueDate,
      end: task.dueDate,
      status: task.status
    }));
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return [];
  }
};

// Get analytics data
export const getAnalyticsData = async (token: string) => {
  const response = await fetch(`${API_BASE_URL}/analytics`, {
    headers: getAuthHeaders(token)
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch analytics data');
  }
  
  return response.json();
};

// Get projects with client data
export const getProjectsWithClients = async (token: string): Promise<Project[]> => {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    headers: getAuthHeaders(token)
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  
  const projects = await response.json();
  const clients = await getClients(token);
  
  // Enhance projects with client data
  return projects.map((project: Project) => ({
    ...project,
    client: project.clientId ? clients.find((c: Client) => c.id === project.clientId) : undefined
  }));
};

// Link task to client and project
export const linkTaskToClientAndProject = async (
  taskId: string,
  clientId: string,
  token: string,
  projectId?: string
): Promise<Task> => {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ clientId, projectId })
  });
  
  if (!response.ok) {
    throw new Error('Failed to link task');
  }
  
  return response.json();
};

// Get tasks by client
export const getTasksByClient = async (clientId: string, token: string): Promise<Task[]> => {
  const allTasks = await getEnhancedTasks(token);
  return allTasks.filter((task: Task) => task.clientId === clientId);
};

// Get tasks by project
export const getTasksByProject = async (projectId: string, token: string): Promise<Task[]> => {
  const allTasks = await getEnhancedTasks(token);
  return allTasks.filter((task: Task) => task.projectId === projectId);
};

// Get client details with related data
export const getClientDetails = async (clientId: string, token: string): Promise<any> => {
  const [client, allTasks, allProjects] = await Promise.all([
    getClientById(clientId, token),
    getEnhancedTasks(token),
    getProjects(token)
  ]);
  
  const clientTasks = allTasks.filter((task: Task) => task.clientId === clientId);
  const clientProjects = allProjects.filter((project: Project) => project.clientId === clientId);
  
  // Group tasks by project
  const tasksByProject = clientTasks.reduce((acc: Record<string, Task[]>, task: Task) => {
    const projectId = task.projectId || 'no-project';
    if (!acc[projectId]) {
      acc[projectId] = [];
    }
    acc[projectId].push(task);
    return acc;
  }, {});
  
  return {
    client,
    tasks: clientTasks,
    projects: clientProjects,
    tasksByProject
  };
};

// Get client by ID
export const getClientById = async (clientId: string, token: string): Promise<Client> => {
  const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
    headers: getAuthHeaders(token)
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch client');
  }
  
  return response.json();
};

// Get tasks by status
export const getTasksByStatus = async (token: string) => {
  try {
    const tasks = await getTasks(token);
    
    // Group tasks by status
    const result = {
      draft: tasks.filter(task => task.status === 'draft'),
      'in-progress': tasks.filter(task => task.status === 'in-progress'),
      'under-review': tasks.filter(task => task.status === 'under-review'),
      completed: tasks.filter(task => task.status === 'completed'),
      canceled: tasks.filter(task => task.status === 'canceled')
    };
    
    return result;
  } catch (error) {
    console.error("Error fetching tasks by status:", error);
    return {
      draft: [],
      'in-progress': [],
      'under-review': [],
      completed: [],
      canceled: []
    };
  }
};

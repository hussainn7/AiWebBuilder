import { v4 as uuidv4 } from 'uuid';
import { clients, projects, users, addClientToMockData, addProjectToMockData, addTaskToMockData, tasks, getClientById, getProjectById } from './mock-data';
import { Client, Project, Task, Status, SubTask } from './types';

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

// Get clients
export const getClients = async (): Promise<Client[]> => {
  // Check if we have saved clients in localStorage
  const savedClients = localStorage.getItem(CLIENTS_KEY);
  if (savedClients) {
    return JSON.parse(savedClients);
  }
  
  // If not, return mock data
  return clients;
};

// Add client
export const addClient = async (clientData: Omit<Client, 'id'>): Promise<Client> => {
  const newClient: Client = {
    id: uuidv4(),
    ...clientData
  };
  
  // Get existing clients
  const existingClients = await getClients();
  
  // Add new client to the list
  const updatedClients = [...existingClients, newClient];
  
  // Save to localStorage
  localStorage.setItem(CLIENTS_KEY, JSON.stringify(updatedClients));
  
  // Also update mock data for this session
  addClientToMockData(newClient);
  
  return newClient;
};

// Get projects
export const getProjects = async (): Promise<Project[]> => {
  // Check if we have saved projects in localStorage
  const savedProjects = localStorage.getItem(PROJECTS_KEY);
  if (savedProjects) {
    return JSON.parse(savedProjects);
  }
  
  // If not, return mock data
  return projects;
};

// Add project
export const addProject = async (projectData: Omit<Project, 'id'>): Promise<Project> => {
  const newProject: Project = {
    id: uuidv4(),
    ...projectData
  };
  
  // Get existing projects
  const existingProjects = await getProjects();
  
  // Add new project to the list
  const updatedProjects = [...existingProjects, newProject];
  
  // Save to localStorage
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedProjects));
  
  // Also update mock data for this session
  addProjectToMockData(newProject);
  
  return newProject;
};

// Get users (for now we just return mock data since users are not editable in this MVP)
export const getUsers = async () => {
  return users;
};

// Get tasks
export const getTasks = async (): Promise<Task[]> => {
  // Check if we have saved tasks in localStorage
  const savedTasks = localStorage.getItem(TASKS_KEY);
  if (savedTasks) {
    return JSON.parse(savedTasks);
  }
  
  // If not, use the mock-data function
  return tasks;
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

export const addTask = async (taskData: TaskInput): Promise<Task> => {
  const now = new Date().toISOString();
  const creatorId = users[0].id; // Using first user as creator for now
  
  // Convert assigneeIds to actual user objects
  const assignees = users.filter(user => taskData.assigneeIds.includes(user.id));
  
  // Create new task
  const newTask: Task = {
    id: uuidv4(),
    title: taskData.title,
    description: taskData.description,
    status: taskData.status,
    dueDate: taskData.dueDate,
    assignees: assignees,
    createdBy: creatorId,
    clientId: taskData.clientId,
    projectId: taskData.projectId,
    subTasks: taskData.subtasks.map(st => ({ 
      id: uuidv4(), 
      title: st.title, 
      completed: st.completed 
    })),
    comments: [],
    attachments: [],
    createdAt: now,
    updatedAt: now,
    editHistory: [
      {
        userId: creatorId,
        timestamp: now,
        changes: 'Создание задачи'
      }
    ]
  };
  
  // Get existing tasks
  const existingTasks = await getTasks();
  
  // Add new task to the list
  const updatedTasks = [...existingTasks, newTask];
  
  // Save to localStorage
  localStorage.setItem(TASKS_KEY, JSON.stringify(updatedTasks));
  
  // Also update mock data for this session
  addTaskToMockData(newTask);
  
  return newTask;
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

// Helper to get task with related data
export const getEnhancedTasks = async () => {
  const allTasks = await getTasks();
  
  return allTasks.map(task => {
    // Add client and project objects
    if (task.clientId) {
      task.client = getClientById(task.clientId);
    }
    
    if (task.projectId) {
      task.project = getProjectById(task.projectId);
    }
    
    return task;
  });
};

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with original extension
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});

const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// Data file paths
const usersFilePath = path.join(__dirname, 'data', 'users.json');
const tasksFilePath = path.join(__dirname, 'data', 'tasks.json');
const projectsFilePath = path.join(__dirname, 'data', 'projects.json');
const clientsFilePath = path.join(__dirname, 'data', 'clients.json');
const notificationsFilePath = path.join(__dirname, 'data', 'notifications.json');

// Helper functions for data operations
const readDataFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return [];
  }
};

const writeDataFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    return false;
  }
};

// Create data directory and files if they don't exist
const ensureDataFilesExist = () => {
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
  }
  
  // Initialize users file with admin user if it doesn't exist
  if (!fs.existsSync(usersFilePath)) {
    const initialUsers = [
      {
        id: '1',
        email: 'admin@gmail.com',
        firstName: 'Admin',
        lastName: 'User',
        password: 'admin123',
        role: 'admin',
        profilePicture: 'https://ui-avatars.com/api/?name=Admin+User',
        notifications: []
      }
    ];
    writeDataFile(usersFilePath, initialUsers);
  }
  
  // Initialize other data files if they don't exist
  if (!fs.existsSync(tasksFilePath)) {
    writeDataFile(tasksFilePath, []);
  }
  
  if (!fs.existsSync(projectsFilePath)) {
    writeDataFile(projectsFilePath, []);
  }
  
  if (!fs.existsSync(clientsFilePath)) {
    writeDataFile(clientsFilePath, []);
  }
  
  if (!fs.existsSync(notificationsFilePath)) {
    writeDataFile(notificationsFilePath, []);
  }
};

// Ensure data files exist
ensureDataFilesExist();

// Add user to all requests
app.use((req, res, next) => {
  // Check for Authorization header
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // In a real app, you would verify the JWT token
    // For this mock app, we'll extract the user based on the email in the request
    const users = readDataFile(usersFilePath);
    
    // If there's a user email in the request body, use that to find the user
    if (req.body && req.body.email) {
      const user = users.find(u => u.email.toLowerCase() === req.body.email.toLowerCase());
      if (user) {
        req.user = user;
        return next();
      }
    }
    
    // If there's a userId in the request, use that
    if (req.body && req.body.userId) {
      const user = users.find(u => u.id === req.body.userId);
      if (user) {
        req.user = user;
        return next();
      }
    }
    
    // Check if we have a user in the session (stored by login)
    if (req.headers['x-user-email']) {
      const user = users.find(u => u.email.toLowerCase() === req.headers['x-user-email'].toLowerCase());
      if (user) {
        req.user = user;
        return next();
      }
    }
  }
  
  // Default to the first user if no auth info is found
  const users = readDataFile(usersFilePath);
  req.user = users[0];
  next();
});

// Auto-login endpoint - will be used for both register and login
app.get('/api/auto-login', (req, res) => {
  res.json({
    user: req.user,
    token: 'mock-jwt-token'
  });
});

// User endpoints
app.get('/api/user', (req, res) => {
  res.json({ user: req.user });
});

// Add endpoint to get all users
app.get('/api/users', (req, res) => {
  const users = readDataFile(usersFilePath);
  res.json(users);
});

// Profile endpoints
app.get('/api/profile', (req, res) => {
  res.json(req.user);
});

app.put('/api/profile', (req, res) => {
  // Update the user with the request body
  const users = readDataFile(usersFilePath);
  users[0] = { ...users[0], ...req.body };
  writeDataFile(usersFilePath, users);
  res.json(users[0]);
});

// Tasks endpoints
app.get('/api/tasks', (req, res) => {
  const tasks = readDataFile(tasksFilePath);
  res.json(tasks);
});

app.post('/api/tasks', (req, res) => {
  const tasks = readDataFile(tasksFilePath);
  
  // Ensure the creator is included in assigneeIds if not already present
  let assigneeIds = req.body.assigneeIds || [];
  if (!assigneeIds.includes(req.user.id)) {
    assigneeIds.push(req.user.id);
  }
  
  const newTask = {
    id: (tasks.length + 1).toString(),
    ...req.body,
    assigneeIds: assigneeIds, // Use the updated assigneeIds
    createdBy: req.user.id,
    subTasks: [],
    comments: [],
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    editHistory: []
  };
  tasks.push(newTask);
  writeDataFile(tasksFilePath, tasks);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const { clientId, projectId, assigneeIds, title, description, status, dueDate, ...otherUpdates } = req.body;
  
  const tasks = readDataFile(tasksFilePath);
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  const originalTask = { ...tasks[taskIndex] };
  
  // Update the task
  tasks[taskIndex] = { 
    ...tasks[taskIndex], 
    ...otherUpdates,
    clientId: clientId !== undefined ? clientId : tasks[taskIndex].clientId,
    projectId: projectId !== undefined ? projectId : tasks[taskIndex].projectId,
    assigneeIds: assigneeIds !== undefined ? assigneeIds : tasks[taskIndex].assigneeIds,
    title: title !== undefined ? title : tasks[taskIndex].title,
    description: description !== undefined ? description : tasks[taskIndex].description,
    status: status !== undefined ? status : tasks[taskIndex].status,
    dueDate: dueDate !== undefined ? dueDate : tasks[taskIndex].dueDate,
    updatedAt: new Date().toISOString() 
  };
  
  // Initialize edit history if it doesn't exist
  if (!tasks[taskIndex].editHistory) {
    tasks[taskIndex].editHistory = [];
  }
  
  // Track all changes
  const changes = [];
  if (clientId !== undefined && clientId !== originalTask.clientId) changes.push('Client assignment');
  if (projectId !== undefined && projectId !== originalTask.projectId) changes.push('Project assignment');
  if (title !== undefined && title !== originalTask.title) changes.push('Title');
  if (description !== undefined && description !== originalTask.description) changes.push('Description');
  if (status !== undefined && status !== originalTask.status) changes.push('Status');
  if (dueDate !== undefined && dueDate !== originalTask.dueDate) changes.push('Due date');
  
  // Check for assignee changes
  if (assigneeIds !== undefined) {
    const originalAssigneeIds = originalTask.assigneeIds || [];
    const newAssigneeIds = assigneeIds || [];
    
    if (JSON.stringify(originalAssigneeIds.sort()) !== JSON.stringify(newAssigneeIds.sort())) {
      changes.push('Assignees');
      
      // Create notifications for newly assigned users
      const users = readDataFile(usersFilePath);
      const notifications = readDataFile(notificationsFilePath);
      
      // Find newly added assignees
      const newlyAssignedUserIds = newAssigneeIds.filter(id => !originalAssigneeIds.includes(id));
      
      // Create notifications for newly assigned users
      if (newlyAssignedUserIds.length > 0) {
        newlyAssignedUserIds.forEach(userId => {
          if (userId !== req.user.id) { // Don't notify the user who made the change
            notifications.push({
              id: (notifications.length + 1).toString(),
              userId: userId,
              message: `You have been assigned to task: ${tasks[taskIndex].title}`,
              type: 'task_assignment',
              relatedId: taskId,
              read: false,
              createdAt: new Date().toISOString()
            });
          }
        });
        
        writeDataFile(notificationsFilePath, notifications);
      }
    }
  }
  
  // Only add to history if there were changes
  if (changes.length > 0) {
    tasks[taskIndex].editHistory.push({
      userId: req.user.id,
      timestamp: new Date().toISOString(),
      changes: changes.join(', ')
    });
  }
  
  writeDataFile(tasksFilePath, tasks);
  res.json(tasks[taskIndex]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const taskId = req.params.id;
  const tasks = readDataFile(tasksFilePath);
  const taskIndex = tasks.findIndex(task => task.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  // Check if user is admin or the creator of the task
  const isAdmin = req.user.role === 'admin';
  const isCreator = tasks[taskIndex].createdBy === req.user.id;
  
  if (!isAdmin && !isCreator) {
    return res.status(403).json({ message: 'You do not have permission to delete this task' });
  }
  
  // Remove the task
  const removedTask = tasks.splice(taskIndex, 1)[0];
  writeDataFile(tasksFilePath, tasks);
  
  // Return success
  res.json({ message: 'Task deleted successfully', task: removedTask });
});

// Enhanced tasks endpoint (tasks with related data)
app.get('/api/enhanced-tasks', (req, res) => {
  const tasks = readDataFile(tasksFilePath);
  const projects = readDataFile(projectsFilePath);
  const clients = readDataFile(clientsFilePath);
  const users = readDataFile(usersFilePath);
  
  const enhancedTasks = tasks.map(task => ({
    ...task,
    project: task.projectId ? projects.find(p => p.id === task.projectId) : undefined,
    client: task.clientId ? clients.find(c => c.id === task.clientId) : undefined,
    assignees: task.assigneeIds ? task.assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean) : []
  }));
  res.json(enhancedTasks);
});

// My tasks endpoint (only tasks assigned to the current user or created by them)
app.get('/api/my-tasks', (req, res) => {
  const tasks = readDataFile(tasksFilePath);
  const projects = readDataFile(projectsFilePath);
  const clients = readDataFile(clientsFilePath);
  const users = readDataFile(usersFilePath);
  
  // Get the current user from the request
  const currentUser = req.user;
  
  if (!currentUser) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Filter tasks to only include those assigned to the current user or created by them
  const myTasks = tasks.filter(task => 
    (task.assigneeIds && task.assigneeIds.includes(currentUser.id)) || 
    task.createdBy === currentUser.id
  );
  
  const enhancedTasks = myTasks.map(task => ({
    ...task,
    project: task.projectId ? projects.find(p => p.id === task.projectId) : undefined,
    client: task.clientId ? clients.find(c => c.id === task.clientId) : undefined,
    assignees: task.assigneeIds ? task.assigneeIds.map(id => users.find(u => u.id === id)).filter(Boolean) : []
  }));
  
  res.json(enhancedTasks);
});

// Analytics data endpoint
app.get('/api/analytics', (req, res) => {
  // Calculate task statistics by status
  const tasks = readDataFile(tasksFilePath);
  const tasksByStatus = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});
  
  // Calculate task statistics by project
  const projects = readDataFile(projectsFilePath);
  const tasksByProject = tasks.reduce((acc, task) => {
    if (task.projectId) {
      acc[task.projectId] = (acc[task.projectId] || 0) + 1;
    }
    return acc;
  }, {});
  
  res.json({
    tasksByStatus,
    tasksByProject,
    totalTasks: tasks.length,
    totalProjects: projects.length,
    completedTasks: tasks.filter(t => t.status === 'completed').length,
    activeProjects: projects.filter(p => p.status === 'active').length
  });
});

// Projects endpoints
app.get('/api/projects', (req, res) => {
  const projects = readDataFile(projectsFilePath);
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const projects = readDataFile(projectsFilePath);
  const newProject = {
    id: (projects.length + 1).toString(),
    ...req.body
  };
  projects.push(newProject);
  writeDataFile(projectsFilePath, projects);
  res.status(201).json(newProject);
});

app.delete('/api/projects/:id', (req, res) => {
  const projectId = req.params.id;
  const projects = readDataFile(projectsFilePath);
  const projectIndex = projects.findIndex(project => project.id === projectId);
  
  if (projectIndex === -1) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  // Check if user is admin or the creator of the project
  const isAdmin = req.user.role === 'admin';
  const isCreator = projects[projectIndex].createdBy === req.user.id;
  
  if (!isAdmin && !isCreator) {
    return res.status(403).json({ message: 'You do not have permission to delete this project' });
  }
  
  // Remove the project
  const removedProject = projects.splice(projectIndex, 1)[0];
  writeDataFile(projectsFilePath, projects);
  
  // Update any tasks associated with this project (remove project reference)
  const tasks = readDataFile(tasksFilePath);
  const updatedTasks = tasks.map(task => {
    if (task.projectId === projectId) {
      return { ...task, projectId: null };
    }
    return task;
  });
  writeDataFile(tasksFilePath, updatedTasks);
  
  // Return success
  res.json({ message: 'Project deleted successfully', project: removedProject });
});

// Clients endpoints
app.get('/api/clients', (req, res) => {
  const clients = readDataFile(clientsFilePath);
  res.json(clients);
});

app.post('/api/clients', (req, res) => {
  const clients = readDataFile(clientsFilePath);
  const newClient = {
    id: (clients.length + 1).toString(),
    ...req.body
  };
  clients.push(newClient);
  writeDataFile(clientsFilePath, clients);
  res.status(201).json(newClient);
});

app.get('/api/clients/:id', (req, res) => {
  const clientId = req.params.id;
  const clients = readDataFile(clientsFilePath);
  const client = clients.find(c => c.id === clientId);
  
  if (!client) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  res.json(client);
});

app.delete('/api/clients/:id', (req, res) => {
  const clientId = req.params.id;
  const clients = readDataFile(clientsFilePath);
  const clientIndex = clients.findIndex(client => client.id === clientId);
  
  if (clientIndex === -1) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  // Check if user is admin or the creator of the client
  const isAdmin = req.user.role === 'admin';
  const isCreator = clients[clientIndex].createdBy === req.user.id;
  
  if (!isAdmin && !isCreator) {
    return res.status(403).json({ message: 'You do not have permission to delete this client' });
  }
  
  // Remove the client
  const removedClient = clients.splice(clientIndex, 1)[0];
  writeDataFile(clientsFilePath, clients);
  
  // Also remove all tasks associated with this client
  const tasks = readDataFile(tasksFilePath);
  const updatedTasks = tasks.filter(task => task.clientId !== clientId);
  writeDataFile(tasksFilePath, updatedTasks);
  
  // Return success
  res.json({ message: 'Client deleted successfully', client: removedClient });
});

// Admin endpoints
app.get('/api/admin/users', (req, res) => {
  // Return a list of all users
  const users = readDataFile(usersFilePath);
  res.json(users);
});

app.post('/api/admin/users', (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  
  // Validate required fields
  if (!firstName || !lastName || !email || !password || !role) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  // Create a new user with a unique ID
  const users = readDataFile(usersFilePath);
  const newUser = {
    id: (users.length + 1).toString(), // Generate a random ID
    firstName,
    lastName,
    email,
    role,
    // In a real app, you would hash the password
  };
  
  // Add the new user to the list of users
  users.push(newUser);
  writeDataFile(usersFilePath, users);
  
  // Return the new user (without password)
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json(userWithoutPassword);
});

app.delete('/api/admin/users/:id', (req, res) => {
  // Find the user to delete
  const users = readDataFile(usersFilePath);
  const userIndex = users.findIndex(user => user.id === req.params.id);
  
  // If the user is not found, return an error
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Remove the user from the list of users
  users.splice(userIndex, 1);
  writeDataFile(usersFilePath, users);
  
  res.json({ message: 'User deleted successfully' });
});

app.get('/api/admin/projects', (req, res) => {
  // Return a list of projects
  const projects = readDataFile(projectsFilePath);
  res.json(projects);
});

app.post('/api/admin/projects', (req, res) => {
  const { name, description, startDate, endDate } = req.body;
  
  // Validate required fields
  if (!name || !description || !startDate || !endDate) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  // Create a new project with a unique ID
  const projects = readDataFile(projectsFilePath);
  const newProject = {
    id: (projects.length + 1).toString(),
    name,
    description,
    startDate,
    endDate,
    status: 'active'
  };
  
  // Add the new project to the list of projects
  projects.push(newProject);
  writeDataFile(projectsFilePath, projects);
  
  res.status(201).json(newProject);
});

app.delete('/api/admin/projects/:id', (req, res) => {
  // Find the project to delete
  const projects = readDataFile(projectsFilePath);
  const projectIndex = projects.findIndex(project => project.id === req.params.id);
  
  // If the project is not found, return an error
  if (projectIndex === -1) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  // Remove the project from the list of projects
  projects.splice(projectIndex, 1);
  writeDataFile(projectsFilePath, projects);
  
  res.json({ message: 'Project deleted successfully' });
});

app.get('/api/admin/clients', (req, res) => {
  // Return a list of clients
  const clients = readDataFile(clientsFilePath);
  res.json(clients);
});

app.post('/api/admin/clients', (req, res) => {
  const { name, contactInfo, description, links } = req.body;
  
  // Validate required fields
  if (!name || !contactInfo || !description || !links) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  // Create a new client with a unique ID
  const clients = readDataFile(clientsFilePath);
  const newClient = {
    id: (clients.length + 1).toString(),
    name,
    contactInfo,
    description,
    links,
    status: 'active'
  };
  
  // Add the new client to the list of clients
  clients.push(newClient);
  writeDataFile(clientsFilePath, clients);
  
  res.status(201).json(newClient);
});

app.delete('/api/admin/clients/:id', (req, res) => {
  // Find the client to delete
  const clients = readDataFile(clientsFilePath);
  const clientIndex = clients.findIndex(client => client.id === req.params.id);
  
  // If the client is not found, return an error
  if (clientIndex === -1) {
    return res.status(404).json({ message: 'Client not found' });
  }
  
  // Remove the client from the list of clients
  clients.splice(clientIndex, 1);
  writeDataFile(clientsFilePath, clients);
  
  res.json({ message: 'Client deleted successfully' });
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  
  // Find the user with the provided email
  const users = readDataFile(usersFilePath);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  // If the user is not found or the password is incorrect, return an error
  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  
  // Return the user (without password) and a token
  const { password: _, ...userWithoutPassword } = user;
  
  // In a real app, you would generate a JWT token with the user's ID
  // For this mock app, we'll just include the user's email in the response
  res.json({
    user: userWithoutPassword,
    token: `mock-jwt-token-${user.id}`, // Include user ID in token for identification
    userEmail: user.email // Include email for client-side storage
  });
});

// Registration endpoint
app.post('/api/auth/register', (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  
  // Validate required fields
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  // Check if the email is already in use
  const users = readDataFile(usersFilePath);
  if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ message: 'Email already in use' });
  }
  
  // Create a new user
  const newUser = {
    id: (users.length + 1).toString(),
    firstName,
    lastName,
    email,
    password, // In a real app, you would hash the password
    role: 'employee', // Default role for new users
    profilePicture: `https://ui-avatars.com/api/?name=${firstName}+${lastName}`,
    notifications: []
  };
  
  // Add the new user to the list of users
  users.push(newUser);
  writeDataFile(usersFilePath, users);
  
  // Return the user (without password) and a token
  const { password: _, ...userWithoutPassword } = newUser;
  res.status(201).json({
    user: userWithoutPassword,
    token: `mock-jwt-token-${newUser.id}`, // Include user ID in token for identification
    userEmail: newUser.email // Include email for client-side storage
  });
});

// Notifications endpoints
app.get('/api/notifications', (req, res) => {
  const users = readDataFile(usersFilePath);
  const user = users.find(u => u.id === req.user.id);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json(user.notifications || []);
});

app.post('/api/notifications/read/:id', (req, res) => {
  const notificationId = req.params.id;
  const users = readDataFile(usersFilePath);
  const userIndex = users.findIndex(u => u.id === req.user.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Mark the notification as read
  const notificationIndex = users[userIndex].notifications.findIndex(n => n.id === notificationId);
  
  if (notificationIndex === -1) {
    return res.status(404).json({ message: 'Notification not found' });
  }
  
  users[userIndex].notifications[notificationIndex].read = true;
  writeDataFile(usersFilePath, users);
  
  res.json(users[userIndex].notifications);
});

// Helper function to add a notification to a user
const addNotificationToUser = (userId, notification) => {
  const users = readDataFile(usersFilePath);
  const userIndex = users.findIndex(u => u.id === userId);
  
  if (userIndex === -1) {
    return false;
  }
  
  // Initialize notifications array if it doesn't exist
  if (!users[userIndex].notifications) {
    users[userIndex].notifications = [];
  }
  
  // Add the notification
  users[userIndex].notifications.push({
    id: Date.now().toString(),
    ...notification,
    timestamp: new Date().toISOString(),
    read: false
  });
  
  writeDataFile(usersFilePath, users);
  return true;
};

// Modify the project assignment endpoint to add notifications
app.post('/api/projects/:id/assign', (req, res) => {
  const { userIds } = req.body;
  const projectId = req.params.id;
  
  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ message: 'User IDs are required' });
  }
  
  const projects = readDataFile(projectsFilePath);
  const project = projects.find(p => p.id === projectId);
  
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }
  
  // Initialize assignees array if it doesn't exist
  if (!project.assignees) {
    project.assignees = [];
  }
  
  // Add new assignees
  const users = readDataFile(usersFilePath);
  const newAssignees = [];
  
  userIds.forEach(userId => {
    const user = users.find(u => u.id === userId);
    
    if (user && !project.assignees.some(a => a.id === userId)) {
      project.assignees.push({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role
      });
      
      newAssignees.push(user);
      
      // Add notification to the user
      addNotificationToUser(userId, {
        type: 'project_assignment',
        title: 'New Project Assignment',
        message: `You have been assigned to the project: ${project.name}`,
        projectId: project.id
      });
    }
  });
  
  writeDataFile(projectsFilePath, projects);
  
  res.json(project);
});

// Modify the task assignment endpoint to add notifications
app.post('/api/tasks/:id/assign', (req, res) => {
  const { userIds } = req.body;
  const taskId = req.params.id;
  
  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ message: 'User IDs are required' });
  }
  
  const tasks = readDataFile(tasksFilePath);
  const taskIndex = tasks.findIndex(t => t.id === taskId);
  
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  
  // Initialize assignees array if it doesn't exist
  if (!tasks[taskIndex].assignees) {
    tasks[taskIndex].assignees = [];
  }
  
  // Add new assignees
  const users = readDataFile(usersFilePath);
  const newAssignees = [];
  
  userIds.forEach(userId => {
    const user = users.find(u => u.id === userId);
    
    if (user && !tasks[taskIndex].assignees.some(a => a.id === userId)) {
      tasks[taskIndex].assignees.push({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role
      });
      
      newAssignees.push(user);
      
      // Add notification to the user
      addNotificationToUser(userId, {
        type: 'task_assignment',
        title: 'New Task Assignment',
        message: `You have been assigned to the task: ${tasks[taskIndex].title}`,
        taskId: tasks[taskIndex].id
      });
    }
  });
  
  writeDataFile(tasksFilePath, tasks);
  
  res.json(tasks[taskIndex]);
});

// File upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }
    
    // Return file information
    res.json({
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: `/uploads/${req.file.filename}`,
      size: req.file.size
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ message: 'Error uploading file' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Start server
const startServer = (port) => {
  const server = app.listen(port)
    .on('listening', () => {
      console.log(`Server is running on port ${port}`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, trying port ${port + 1}`);
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
      }
    });
  return server;
};

startServer(PORT);

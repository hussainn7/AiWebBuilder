import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import profileRoutes from './routes/profile.js';
import './models/index.js'; // Import models to set up associations

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Local mock data
const mockUser = {
  id: 1,
  email: 'local@example.com',
  firstName: 'Local',
  lastName: 'User'
};

const mockTasks = [
  {
    id: '1',
    title: 'Design Homepage',
    description: 'Create wireframes for the new homepage',
    status: 'in-progress',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 1
  },
  {
    id: '2',
    title: 'Implement Login',
    description: 'Add login functionality to the app',
    status: 'completed',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 1
  },
  {
    id: '3',
    title: 'Fix Navigation Bug',
    description: 'Navigation menu disappears on mobile view',
    status: 'draft',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdBy: 1
  }
];

const mockProjects = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Redesign company website',
    status: 'active',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    name: 'Mobile App',
    description: 'Develop mobile app for clients',
    status: 'active',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const mockClients = [
  {
    id: '1',
    name: 'Acme Inc',
    email: 'contact@acme.com',
    phone: '555-1234'
  },
  {
    id: '2',
    name: 'XYZ Corp',
    email: 'info@xyz.com',
    phone: '555-5678'
  }
];

// Add mock user to all requests
app.use((req, res, next) => {
  req.user = mockUser;
  next();
});

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/profile', profileRoutes);

// Auth endpoints
app.post('/api/auth/register', (req, res) => {
  res.status(201).json({
    user: mockUser,
    token: 'mock-jwt-token'
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    user: mockUser,
    token: 'mock-jwt-token'
  });
});

// User endpoint
app.get('/api/user', (req, res) => {
  res.json({ user: mockUser });
});

// Profile endpoints
app.get('/api/profile', (req, res) => {
  res.json(mockUser);
});

app.put('/api/profile', (req, res) => {
  // Update the mock user with the request body
  Object.assign(mockUser, req.body);
  res.json(mockUser);
});

// Tasks endpoints
app.get('/api/tasks', (req, res) => {
  res.json(mockTasks);
});

app.post('/api/tasks', (req, res) => {
  const newTask = {
    id: (mockTasks.length + 1).toString(),
    ...req.body,
    createdBy: mockUser.id
  };
  mockTasks.push(newTask);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req, res) => {
  const taskIndex = mockTasks.findIndex(task => task.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...req.body };
  res.json(mockTasks[taskIndex]);
});

app.delete('/api/tasks/:id', (req, res) => {
  const taskIndex = mockTasks.findIndex(task => task.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }
  mockTasks.splice(taskIndex, 1);
  res.json({ message: 'Task deleted successfully' });
});

// Projects endpoints
app.get('/api/projects', (req, res) => {
  res.json(mockProjects);
});

app.post('/api/projects', (req, res) => {
  const newProject = {
    id: (mockProjects.length + 1).toString(),
    ...req.body
  };
  mockProjects.push(newProject);
  res.status(201).json(newProject);
});

// Clients endpoints
app.get('/api/clients', (req, res) => {
  res.json(mockClients);
});

app.post('/api/clients', (req, res) => {
  const newClient = {
    id: (mockClients.length + 1).toString(),
    ...req.body
  };
  mockClients.push(newClient);
  res.status(201).json(newClient);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
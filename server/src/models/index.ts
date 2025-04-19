import Task from './Task.js';
import Project from './Project.js';
import Client from './Client.js';
import User from './User.js';

// Define associations
Task.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Task.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Task.belongsToMany(User, { through: 'TaskAssignees', as: 'assignees' });
User.belongsToMany(Task, { through: 'TaskAssignees', as: 'tasks' });

Project.hasMany(Task, { foreignKey: 'projectId', as: 'tasks' });
Client.hasMany(Task, { foreignKey: 'clientId', as: 'tasks' });

export { Task, Project, Client, User }; 
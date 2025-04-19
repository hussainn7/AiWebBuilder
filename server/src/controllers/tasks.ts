import { Request, Response } from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import User from '../models/User.js';

// Get all tasks
export const getTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks = await Task.findAll({
      include: [
        { model: Project, as: 'project' },
        { model: Client, as: 'client' },
        { model: User, as: 'assignees', through: { attributes: [] } }
      ]
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'An error occurred' });
  }
};

// Create a new task
export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await Task.create({
      ...req.body,
      createdBy: req.user.id
    });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'An error occurred' });
  }
};

// Update a task
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    await task.update(req.body);
    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : 'An error occurred' });
  }
};

// Delete a task
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }
    await task.destroy();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'An error occurred' });
  }
}; 
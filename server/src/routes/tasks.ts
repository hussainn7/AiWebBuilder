import express from 'express';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/tasks.js';

const router = express.Router();

// Task routes without auth middleware for local development
router.get('/', getTasks);
router.post('/', createTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

export default router;

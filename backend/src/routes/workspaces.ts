import { Router, Request } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { Workspace } from '../models/Workspace';
import { Project } from '../models/Project';
import { Task } from '../models/Task';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
}

// Validation schemas
const createWorkspaceSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  description: z.string().optional(),
});

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done']).default('todo'),
  assignedTo: z.string().optional(),
});

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all workspaces for current user
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    console.log('[WORKSPACES] Get workspaces request');
    const userId = req.userId;
    const userWorkspaces = await Workspace.find({ userId });
    res.json({ workspaces: userWorkspaces });
  } catch (error) {
    next(error);
  }
});

// Create workspace
router.post('/', async (req: AuthRequest, res, next) => {
  try {
    console.log('[WORKSPACES] Create workspace request:', req.body);
    const validatedData = createWorkspaceSchema.parse(req.body);
    const userId = req.userId;
    
    const workspace = await Workspace.create({
      name: validatedData.name,
      description: validatedData.description,
      userId,
    });
    
    console.log('[WORKSPACES] Workspace created:', workspace._id);
    
    res.status(201).json({ workspace });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    next(error);
  }
});

// Get projects for a workspace
router.get('/:workspaceId/projects', async (req: AuthRequest, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.userId;
    console.log('[PROJECTS] Get projects request for workspace:', workspaceId);
    
    // Verify workspace belongs to user
    const workspace = await Workspace.findOne({ _id: workspaceId, userId });
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const workspaceProjects = await Project.find({ workspaceId });
    
    res.json({ projects: workspaceProjects });
  } catch (error) {
    next(error);
  }
});

// Create project
router.post('/:workspaceId/projects', async (req: AuthRequest, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.userId;
    console.log('[PROJECTS] Create project request:', req.body);
    
    // Verify workspace belongs to user
    const workspace = await Workspace.findOne({ _id: workspaceId, userId });
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const validatedData = createProjectSchema.parse(req.body);
    
    const project = await Project.create({
      name: validatedData.name,
      description: validatedData.description,
      workspaceId,
    });
    
    console.log('[PROJECTS] Project created:', project._id);
    
    res.status(201).json({ project });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    next(error);
  }
});

// Get tasks for a project
router.get('/:workspaceId/projects/:projectId/tasks', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, workspaceId } = req.params;
    const userId = req.userId;
    console.log('[TASKS] Get tasks request for project:', projectId);
    
    // Verify project exists and workspace belongs to user
    const workspace = await Workspace.findOne({ _id: workspaceId, userId });
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const project = await Project.findOne({ _id: projectId, workspaceId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const projectTasks = await Task.find({ projectId });
    
    res.json({ tasks: projectTasks });
  } catch (error) {
    next(error);
  }
});

// Create task
router.post('/:workspaceId/projects/:projectId/tasks', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, workspaceId } = req.params;
    const userId = req.userId;
    console.log('[TASKS] Create task request:', req.body);
    
    // Verify project exists and workspace belongs to user
    const workspace = await Workspace.findOne({ _id: workspaceId, userId });
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const project = await Project.findOne({ _id: projectId, workspaceId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const validatedData = createTaskSchema.parse(req.body);
    
    const task = await Task.create({
      title: validatedData.title,
      description: validatedData.description,
      status: validatedData.status,
      projectId,
      assignedTo: validatedData.assignedTo || undefined,
    });
    
    console.log('[TASKS] Task created:', task._id);
    
    res.status(201).json({ task });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    next(error);
  }
});

// Update task status
router.patch('/:workspaceId/projects/:projectId/tasks/:taskId', async (req: AuthRequest, res, next) => {
  try {
    const { taskId, projectId, workspaceId } = req.params;
    const userId = req.userId;
    const { status, assignedTo } = req.body;
    
    // Verify workspace belongs to user
    const workspace = await Workspace.findOne({ _id: workspaceId, userId });
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Verify project exists
    const project = await Project.findOne({ _id: projectId, workspaceId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Update task
    const updateData: any = {};
    if (status) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    
    const task = await Task.findOneAndUpdate(
      { _id: taskId, projectId },
      updateData,
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ task });
  } catch (error) {
    next(error);
  }
});

// Delete task
router.delete('/:workspaceId/projects/:projectId/tasks/:taskId', async (req: AuthRequest, res, next) => {
  try {
    const { taskId, projectId, workspaceId } = req.params;
    const userId = req.userId;
    
    // Verify workspace belongs to user
    const workspace = await Workspace.findOne({ _id: workspaceId, userId });
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Verify project exists
    const project = await Project.findOne({ _id: projectId, workspaceId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const task = await Task.findOneAndDelete({ _id: taskId, projectId });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete project
router.delete('/:workspaceId/projects/:projectId', async (req: AuthRequest, res, next) => {
  try {
    const { projectId, workspaceId } = req.params;
    const userId = req.userId;
    
    // Verify workspace belongs to user
    const workspace = await Workspace.findOne({ _id: workspaceId, userId });
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    const project = await Project.findOneAndDelete({ _id: projectId, workspaceId });
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Delete all tasks in the project
    await Task.deleteMany({ projectId });
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;

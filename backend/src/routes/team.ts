import { Router, Request } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { Workspace } from '../models/Workspace';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { User } from '../models/User';

const router = Router();

interface AuthRequest extends Request {
  userId?: string;
}

// Apply authentication middleware to all routes
router.use(authenticate);

// Get all team members in a workspace
router.get('/:workspaceId/members', async (req: AuthRequest, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.userId;
    
    // Verify workspace belongs to user or user is a member
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [{ userId }, { members: userId }],
    }).populate('members', 'name email').populate('userId', 'name email');
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Get all members including the owner
    const ownerId = workspace.userId._id || workspace.userId;
    const ownerName = workspace.userId.name || 'Unknown';
    const ownerEmail = workspace.userId.email || 'Unknown';
    
    const allMembers = [
      { id: ownerId, name: ownerName, email: ownerEmail },
      ...workspace.members.map((member: any) => ({
        id: member._id || member,
        name: member.name || 'Unknown',
        email: member.email || 'Unknown',
      })),
    ];
    
    // Remove duplicates
    const uniqueMembers = allMembers.filter((member, index, self) =>
      index === self.findIndex((m) => m.id.toString() === member.id.toString())
    );
    
    res.json({ members: uniqueMembers });
  } catch (error) {
    next(error);
  }
});

// Add member to workspace
router.post('/:workspaceId/members', async (req: AuthRequest, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.userId;
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Verify workspace belongs to user
    const workspace = await Workspace.findOne({ _id: workspaceId, userId });
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Find user by email
    const userToAdd = await User.findOne({ email: email.toLowerCase() });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if user is already a member
    if (workspace.members.includes(userToAdd._id) || workspace.userId.toString() === userToAdd._id.toString()) {
      return res.status(400).json({ message: 'User is already a member' });
    }
    
    workspace.members.push(userToAdd._id);
    await workspace.save();
    
    res.json({ message: 'Member added successfully', member: { id: userToAdd._id, name: userToAdd.name, email: userToAdd.email } });
  } catch (error) {
    next(error);
  }
});

// Get team member's tasks and projects summary
router.get('/:workspaceId/members/:memberId/summary', async (req: AuthRequest, res, next) => {
  try {
    const { workspaceId, memberId } = req.params;
    const userId = req.userId;
    
    // Verify workspace belongs to user or user is a member
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [{ userId }, { members: userId }],
    });
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Get member info
    const member = await User.findById(memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }
    
    // Get all projects in workspace
    const projects = await Project.find({ workspaceId });
    const projectIds = projects.map(p => p._id);
    
    // Get all tasks assigned to this member
    const tasks = await Task.find({
      projectId: { $in: projectIds },
      assignedTo: memberId,
    }).populate('projectId', 'name');
    
    // Get projects where member has tasks
    const memberProjects = projects.filter(p => 
      tasks.some(t => t.projectId.toString() === p._id.toString())
    );
    
    res.json({
      member: {
        id: member._id,
        name: member.name,
        email: member.email,
      },
      projects: memberProjects,
      tasks: tasks,
      stats: {
        totalTasks: tasks.length,
        todoTasks: tasks.filter(t => t.status === 'todo').length,
        inProgressTasks: tasks.filter(t => t.status === 'in-progress').length,
        doneTasks: tasks.filter(t => t.status === 'done').length,
        totalProjects: memberProjects.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// AI Summarization endpoint
router.post('/:workspaceId/ai-summary', async (req: AuthRequest, res, next) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.userId;
    
    // Verify workspace belongs to user or user is a member
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      $or: [{ userId }, { members: userId }],
    });
    
    if (!workspace) {
      return res.status(404).json({ message: 'Workspace not found' });
    }
    
    // Get all members
    const allMembers = [
      workspace.userId,
      ...workspace.members,
    ];
    
    // Get all projects and tasks
    const projects = await Project.find({ workspaceId });
    const projectIds = projects.map(p => p._id);
    const tasks = await Task.find({ projectId: { $in: projectIds } }).populate('assignedTo', 'name email');
    
    // Prepare data for AI summarization
    const memberSummaries = await Promise.all(
      allMembers.map(async (memberId) => {
        const member = await User.findById(memberId);
        if (!member) return null;
        
        const memberTasks = tasks.filter(t => 
          t.assignedTo && t.assignedTo._id.toString() === memberId.toString()
        );
        
        const memberProjects = projects.filter(p =>
          memberTasks.some(t => t.projectId.toString() === p._id.toString())
        );
        
        return {
          member: {
            id: member._id,
            name: member.name,
            email: member.email,
          },
          projects: memberProjects.map(p => ({
            id: p._id,
            name: p.name,
            description: p.description,
          })),
          tasks: memberTasks.map(t => ({
            id: t._id,
            title: t.title,
            description: t.description,
            status: t.status,
            projectName: projects.find(p => p._id.toString() === t.projectId.toString())?.name,
          })),
          stats: {
            totalTasks: memberTasks.length,
            todoTasks: memberTasks.filter(t => t.status === 'todo').length,
            inProgressTasks: memberTasks.filter(t => t.status === 'in-progress').length,
            doneTasks: memberTasks.filter(t => t.status === 'done').length,
            totalProjects: memberProjects.length,
          },
        };
      })
    );
    
    // Generate AI summary using OpenAI API
    const summaries = await generateAISummaries(memberSummaries.filter(Boolean));
    
    res.json({ summaries });
  } catch (error) {
    next(error);
  }
});

// AI Summarization function
async function generateAISummaries(memberData: any[]) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  
  if (!OPENAI_API_KEY) {
    // Fallback to basic summary if no API key
    return memberData.map((data) => ({
      memberId: data.member.id,
      memberName: data.member.name,
      summary: generateBasicSummary(data),
    }));
  }
  
  try {
    const summaries = await Promise.all(
      memberData.map(async (data) => {
        const prompt = `Provide a concise, professional summary of this team member's workload and progress:

Team Member: ${data.member.name}
Email: ${data.member.email}

Projects (${data.stats.totalProjects}):
${data.projects.map((p: any) => `- ${p.name}${p.description ? ': ' + p.description : ''}`).join('\n')}

Tasks (${data.stats.totalTasks} total):
- To Do: ${data.stats.todoTasks}
- In Progress: ${data.stats.inProgressTasks}
- Done: ${data.stats.doneTasks}

Task Details:
${data.tasks.map((t: any) => `- ${t.title} (${t.status}) - Project: ${t.projectName}`).join('\n')}

Provide a 2-3 sentence summary highlighting:
1. Overall workload and capacity
2. Current focus areas
3. Progress and completion status

Summary:`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that provides concise, professional summaries of team member workloads.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_tokens: 200,
            temperature: 0.7,
          }),
        });
        
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.statusText}`);
        }
        
        const result = await response.json();
        const summary = result.choices[0]?.message?.content || generateBasicSummary(data);
        
        return {
          memberId: data.member.id,
          memberName: data.member.name,
          summary: summary.trim(),
        };
      })
    );
    
    return summaries;
  } catch (error) {
    console.error('[AI] Error generating summaries:', error);
    // Fallback to basic summaries
    return memberData.map((data) => ({
      memberId: data.member.id,
      memberName: data.member.name,
      summary: generateBasicSummary(data),
    }));
  }
}

function generateBasicSummary(data: any): string {
  const { member, stats, projects, tasks } = data;
  
  const workload = stats.totalTasks === 0 
    ? 'Currently has no assigned tasks'
    : stats.totalTasks <= 3 
    ? 'Has a light workload'
    : stats.totalTasks <= 7
    ? 'Has a moderate workload'
    : 'Has a heavy workload';
  
  const progress = stats.doneTasks > 0
    ? `Completed ${stats.doneTasks} task${stats.doneTasks > 1 ? 's' : ''}`
    : 'No completed tasks yet';
  
  const focus = stats.inProgressTasks > 0
    ? `Currently working on ${stats.inProgressTasks} task${stats.inProgressTasks > 1 ? 's' : ''}`
    : 'No active tasks in progress';
  
  return `${member.name} ${workload} across ${stats.totalProjects} project${stats.totalProjects !== 1 ? 's' : ''}. ${focus}. ${progress}.`;
}

export default router;


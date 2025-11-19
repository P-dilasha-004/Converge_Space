# Complete AI Summarization Implementation Guide

This guide contains all the code needed to add AI summarization to your Converge Space application.

## 📋 Table of Contents
1. [Backend Implementation](#backend-implementation)
2. [Frontend Implementation](#frontend-implementation)
3. [Environment Setup](#environment-setup)
4. [How to Use](#how-to-use)

---

## 🔧 Backend Implementation

### File: `backend/src/routes/team.ts`

This file contains the complete backend API for AI summarization:

```typescript
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

// Fallback function for basic summaries (when no OpenAI API key)
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
```

### Register the route in `backend/src/server.ts`:

```typescript
import teamRoutes from './routes/team';

// ... other code ...

app.use('/api/team', teamRoutes);
```

---

## 🎨 Frontend Implementation

### File: `frontend/vite-project/app/routes/team.tsx`

Complete frontend component for AI summarization:

```typescript
import type { Route } from "./+types/team";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Team Members - Converge Space" },
    { name: "description", content: "View team member summaries and AI insights" },
  ];
}

export async function loader() {
  return null;
}

export default function TeamView() {
  const { workspaceId } = useParams();
  const [members, setMembers] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");

  useEffect(() => {
    if (workspaceId) {
      fetchMembers();
    }
  }, [workspaceId]);

  const fetchMembers = async () => {
    if (!workspaceId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/api/team/${workspaceId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setMembers(data.members || []);
    } catch (error) {
      console.error("[TEAM] Error fetching members:", error);
    }
  };

  // AI Summarization function
  const fetchAISummaries = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/api/team/${workspaceId}/ai-summary`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "Failed to generate summaries"}`);
        return;
      }
      
      const data = await response.json();
      setSummaries(data.summaries || []);
    } catch (error) {
      console.error("[TEAM] Error fetching AI summaries:", error);
      alert("Failed to generate AI summaries. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberDetails = async (memberId: string) => {
    if (!workspaceId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/api/team/${workspaceId}/members/${memberId}/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setMemberDetails(data);
      setSelectedMember(members.find(m => m.id === memberId));
    } catch (error) {
      console.error("[TEAM] Error fetching member details:", error);
    }
  };

  const getSummaryForMember = (memberId: string) => {
    return summaries.find(s => s.memberId === memberId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-8 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Team Members
            </h1>
            <p className="text-sm text-gray-600 mt-1">AI-powered insights and summaries</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={fetchAISummaries}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Generate AI Summaries
                </>
              )}
            </Button>
            <Link to="/dashboard">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Team Members List */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <CardTitle className="text-lg font-semibold text-gray-900">Team Members</CardTitle>
                <CardDescription>View and manage team members</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No team members yet</p>
                  </div>
                ) : (
                  members.map((member) => {
                    const summary = getSummaryForMember(member.id);
                    return (
                      <div
                        key={member.id}
                        onClick={() => fetchMemberDetails(member.id)}
                        className={`p-4 rounded-lg cursor-pointer transition-all border ${
                          selectedMember?.id === member.id
                            ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md"
                            : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{member.name}</p>
                                <p className="text-xs text-gray-500">{member.email}</p>
                              </div>
                            </div>
                            {summary && (
                              <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100">
                                <p className="text-xs text-blue-800 font-medium">AI Summary</p>
                                <p className="text-xs text-gray-700 mt-1 line-clamp-2">{summary.summary}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Member Details */}
          <div className="lg:col-span-2">
            {memberDetails ? (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
                      {memberDetails.member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{memberDetails.member.name}</CardTitle>
                      <CardDescription>{memberDetails.member.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-2xl font-bold text-blue-600">{memberDetails.stats.totalTasks}</p>
                      <p className="text-xs text-gray-600 mt-1">Total Tasks</p>
                    </div>
                    <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-2xl font-bold text-amber-600">{memberDetails.stats.todoTasks}</p>
                      <p className="text-xs text-gray-600 mt-1">To Do</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
                      <p className="text-2xl font-bold text-purple-600">{memberDetails.stats.inProgressTasks}</p>
                      <p className="text-xs text-gray-600 mt-1">In Progress</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
                      <p className="text-2xl font-bold text-green-600">{memberDetails.stats.doneTasks}</p>
                      <p className="text-xs text-gray-600 mt-1">Done</p>
                    </div>
                  </div>

                  {/* AI Summary */}
                  {getSummaryForMember(memberDetails.member.id) && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <h3 className="font-semibold text-gray-900">AI Summary</h3>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {getSummaryForMember(memberDetails.member.id)?.summary}
                      </p>
                    </div>
                  )}

                  {/* Projects and Tasks sections... */}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <p className="text-gray-500">Select a team member to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Add route in `frontend/vite-project/app/routes.ts`:

```typescript
route("team/:workspaceId", "routes/team.tsx"),
```

---

## ⚙️ Environment Setup

### 1. Backend `.env` file

Add to `backend/.env`:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
OPENAI_API_KEY=your-openai-api-key-here
```

### 2. Get OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Create a new API key
4. Copy the key and add it to your `.env` file

**Note:** The system works without an API key but will use basic summaries instead of AI-generated ones.

---

## 🚀 How to Use

1. **Navigate to Team View:**
   - Go to Dashboard
   - Select a workspace
   - Click "View Team & AI Summaries" button

2. **Generate AI Summaries:**
   - Click the "Generate AI Summaries" button
   - Wait for the AI to process (shows loading spinner)
   - Summaries will appear next to each team member

3. **View Member Details:**
   - Click on any team member
   - See their detailed stats and AI summary
   - View their projects and tasks

---

## 📝 API Endpoint

**POST** `/api/team/:workspaceId/ai-summary`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Response:**
```json
{
  "summaries": [
    {
      "memberId": "member_id_here",
      "memberName": "John Doe",
      "summary": "AI-generated summary text here..."
    }
  ]
}
```

---

## 🔍 Key Features

- ✅ **OpenAI Integration** - Uses GPT-3.5-turbo for intelligent summaries
- ✅ **Fallback Support** - Works without API key using basic summaries
- ✅ **Error Handling** - Gracefully handles API errors
- ✅ **Loading States** - Shows loading spinner during generation
- ✅ **Real-time Updates** - Summaries appear immediately after generation

---

## 🛠️ Customization

### Change AI Model

In `backend/src/routes/team.ts`, line 279:
```typescript
model: 'gpt-3.5-turbo',  // Change to 'gpt-4' for better quality
```

### Adjust Summary Length

In `backend/src/routes/team.ts`, line 290:
```typescript
max_tokens: 200,  // Increase for longer summaries
```

### Modify Prompt

Edit the `prompt` variable in `generateAISummaries()` function (lines 249-270) to customize what the AI focuses on.

---

## 📚 Dependencies

No additional npm packages needed! The code uses:
- Built-in `fetch` API (Node.js 18+)
- Express.js (already installed)
- OpenAI API (external service)

---

## ✅ Testing

Test the endpoint:
```bash
curl -X POST http://localhost:5001/api/team/YOUR_WORKSPACE_ID/ai-summary \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

That's it! You now have complete AI summarization functionality. 🎉



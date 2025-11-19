import type { Route } from "./+types/dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Dashboard - Converge Space" },
    { name: "description", content: "Your Converge Space dashboard" },
  ];
}

export async function loader() {
  return null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newTaskAssignedTo, setNewTaskAssignedTo] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/signin");
      return;
    }
    fetchWorkspaces();
  }, []);

  useEffect(() => {
    if (selectedWorkspace) {
      fetchProjects(selectedWorkspace.id);
      fetchTeamMembers(selectedWorkspace.id);
    } else {
      setProjects([]);
      setSelectedProject(null);
      setTasks([]);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    if (selectedProject && selectedWorkspace) {
      fetchTasks(selectedProject.id || selectedProject._id, selectedWorkspace.id);
    } else {
      setTasks([]);
    }
  }, [selectedProject, selectedWorkspace]);

  const fetchWorkspaces = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }
      
      const response = await fetch("http://localhost:5001/api/workspaces", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/signin");
          return;
        }
        const errorData = await response.json();
        console.error("[DASHBOARD] Error fetching workspaces:", errorData);
        return;
      }
      
      const data = await response.json();
      const workspaces = (data.workspaces || []).map((ws: any) => ({
        ...ws,
        id: ws._id || ws.id,
      }));
      setWorkspaces(workspaces);
    } catch (error) {
      console.error("[DASHBOARD] Error fetching workspaces:", error);
    }
  };

  const fetchTeamMembers = async (workspaceId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:5001/api/team/${workspaceId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setTeamMembers(data.members || []);
      }
    } catch (error) {
      console.error("[DASHBOARD] Error fetching team members:", error);
    }
  };

  const fetchProjects = async (workspaceId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }
      const response = await fetch(`http://localhost:5001/api/workspaces/${workspaceId}/projects`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/signin");
          return;
        }
        return;
      }
      const data = await response.json();
      const projects = (data.projects || []).map((p: any) => ({
        ...p,
        id: p._id || p.id,
      }));
      setProjects(projects);
    } catch (error) {
      console.error("[DASHBOARD] Error fetching projects:", error);
    }
  };

  const fetchTasks = async (projectId: string, workspaceId: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }
      const response = await fetch(
        `http://localhost:5001/api/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/signin");
          return;
        }
        return;
      }
      const data = await response.json();
      const tasks = (data.tasks || []).map((t: any) => ({
        ...t,
        id: t._id || t.id,
      }));
      setTasks(tasks);
    } catch (error) {
      console.error("[DASHBOARD] Error fetching tasks:", error);
    }
  };

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) {
      alert("Please enter a workspace name");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }
      
      const response = await fetch("http://localhost:5001/api/workspaces", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/signin");
          return;
        }
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "Failed to create workspace"}`);
        return;
      }
      
      const data = await response.json();
      const newWorkspace = {
        ...data.workspace,
        id: data.workspace._id || data.workspace.id,
      };
      setWorkspaces([...workspaces, newWorkspace]);
      setNewWorkspaceName("");
      setShowCreateWorkspace(false);
    } catch (error) {
      console.error("[DASHBOARD] Error creating workspace:", error);
      alert("Failed to connect to server. Please check your connection.");
    }
  };

  const createProject = async () => {
    if (!selectedWorkspace || !newProjectName.trim()) {
      if (!newProjectName.trim()) alert("Please enter a project name");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }
      const response = await fetch(`http://localhost:5001/api/workspaces/${selectedWorkspace.id}/projects`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          workspaceId: selectedWorkspace.id,
          name: newProjectName.trim() 
        }),
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/signin");
          return;
        }
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "Failed to create project"}`);
        return;
      }
      const data = await response.json();
      const newProject = {
        ...data.project,
        id: data.project._id || data.project.id,
      };
      setProjects([...projects, newProject]);
      setNewProjectName("");
      setShowCreateProject(false);
    } catch (error) {
      console.error("[DASHBOARD] Error creating project:", error);
      alert("Failed to create project. Please try again.");
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!selectedWorkspace || !confirm("Are you sure you want to delete this project? All tasks will be deleted.")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }
      const response = await fetch(`http://localhost:5001/api/workspaces/${selectedWorkspace.id}/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setProjects(projects.filter(p => (p.id || p._id) !== projectId));
        if (selectedProject && (selectedProject.id || selectedProject._id) === projectId) {
          setSelectedProject(null);
          setTasks([]);
        }
      } else {
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/signin");
          return;
        }
        alert("Failed to delete project. Please try again.");
      }
    } catch (error) {
      console.error("[DASHBOARD] Error deleting project:", error);
      alert("Failed to delete project. Please try again.");
    }
  };

  const createTask = async () => {
    if (!selectedProject || !selectedWorkspace || !newTaskTitle.trim()) {
      if (!newTaskTitle.trim()) alert("Please enter a task title");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }
      const projectId = selectedProject.id || selectedProject._id;
      const response = await fetch(
        `http://localhost:5001/api/workspaces/${selectedWorkspace.id}/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId: projectId,
            title: newTaskTitle.trim(),
            description: newTaskDescription.trim() || undefined,
            status: "todo",
            assignedTo: newTaskAssignedTo || undefined,
          }),
        }
      );
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/signin");
          return;
        }
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "Failed to create task"}`);
        return;
      }
      const data = await response.json();
      const newTask = {
        ...data.task,
        id: data.task._id || data.task.id,
      };
      setTasks([...tasks, newTask]);
      setNewTaskTitle("");
      setNewTaskDescription("");
      setNewTaskAssignedTo("");
      setShowCreateTask(false);
    } catch (error) {
      console.error("[DASHBOARD] Error creating task:", error);
      alert("Failed to create task. Please try again.");
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: 'todo' | 'in-progress' | 'done') => {
    if (!selectedProject || !selectedWorkspace) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }
      const projectId = selectedProject.id || selectedProject._id;
      const response = await fetch(
        `http://localhost:5001/api/workspaces/${selectedWorkspace.id}/projects/${projectId}/tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const updatedTask = {
          ...data.task,
          id: data.task._id || data.task.id,
        };
        setTasks(tasks.map(t => (t.id || t._id) === taskId ? updatedTask : t));
      } else {
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/signin");
          return;
        }
        alert("Failed to update task. Please try again.");
      }
    } catch (error) {
      console.error("[DASHBOARD] Error updating task:", error);
      alert("Failed to update task. Please try again.");
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!selectedProject || !selectedWorkspace || !confirm("Are you sure you want to delete this task?")) {
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/signin");
        return;
      }
      const projectId = selectedProject.id || selectedProject._id;
      const response = await fetch(
        `http://localhost:5001/api/workspaces/${selectedWorkspace.id}/projects/${projectId}/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        setTasks(tasks.filter(t => (t.id || t._id) !== taskId));
      } else {
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/signin");
          return;
        }
        alert("Failed to delete task. Please try again.");
      }
    } catch (error) {
      console.error("[DASHBOARD] Error deleting task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'todo': return 'bg-gray-100 text-gray-700 hover:bg-gray-200';
      case 'in-progress': return 'bg-amber-100 text-amber-800 hover:bg-amber-200';
      case 'done': return 'bg-green-100 text-green-800 hover:bg-green-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getNextStatus = (currentStatus: string): 'todo' | 'in-progress' | 'done' => {
    switch (currentStatus) {
      case 'todo': return 'in-progress';
      case 'in-progress': return 'done';
      case 'done': return 'todo';
      default: return 'todo';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 sm:px-8 py-4 sm:py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Converge Space</h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">Dashboard</p>
          </div>
          <div className="flex items-center gap-3 relative w-full sm:w-auto justify-end">
            <div className="relative" ref={menuRef}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-600 hover:text-gray-900" 
                title="Menu"
                onClick={() => setShowMenu(!showMenu)}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
              
              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      <span>Dashboard</span>
                    </div>
                  </Link>
                  {selectedWorkspace && (
                    <Link to={`/team/${selectedWorkspace.id}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>Team Members</span>
                      </div>
                    </Link>
                  )}
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Profile</span>
                    </div>
                  </Link>
                  <button onClick={handleSignOut} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span>Sign Out</span>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        {selectedWorkspace && (
          <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Workspace: {selectedWorkspace.name}</h2>
            <Link to={`/team/${selectedWorkspace.id}`}>
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg w-full sm:w-auto">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                View Team & AI Summaries
              </Button>
            </Link>
          </div>
        )}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Workspaces */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-gray-900">Workspaces</CardTitle>
              <CardDescription className="text-sm text-gray-600">Create and manage workspaces</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              {workspaces.length === 0 && !showCreateWorkspace && (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-sm">No workspaces yet</p>
                </div>
              )}
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className={`p-4 rounded-lg cursor-pointer transition-all border ${
                    selectedWorkspace?.id === ws.id 
                      ? "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 shadow-md" 
                      : "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md"
                  }`}
                  onClick={() => setSelectedWorkspace(ws)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{ws.name}</p>
                      {ws.description && (
                        <p className="text-sm text-gray-500 mt-1">{ws.description}</p>
                      )}
                    </div>
                    {selectedWorkspace?.id === ws.id && (
                      <div className="ml-3">
                        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {showCreateWorkspace ? (
                <div className="space-y-3 pt-3 border-t border-gray-200">
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Workspace name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createWorkspace()}
                  />
                  <div className="flex gap-2">
                    <Button onClick={createWorkspace} size="sm" className="flex-1">
                      Create
                    </Button>
                    <Button onClick={() => { setShowCreateWorkspace(false); setNewWorkspaceName(""); }} size="sm" variant="outline">Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={() => setShowCreateWorkspace(true)} 
                  variant="outline"
                  className="w-full"
                >
                  + New Workspace
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-gray-900">Projects</CardTitle>
              <CardDescription className="text-sm text-gray-600">Organize your work</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              {!selectedWorkspace ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">Select a workspace first</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No projects yet</p>
                    </div>
                  ) : (
                    projects.map((proj) => (
                      <div
                        key={proj.id || proj._id}
                        className={`p-4 rounded-lg transition-all border ${
                          selectedProject && (selectedProject.id || selectedProject._id) === (proj.id || proj._id)
                            ? "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-300 shadow-md" 
                            : "bg-white border-gray-200 hover:border-purple-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p 
                            className="font-medium text-gray-900 cursor-pointer flex-1"
                            onClick={() => setSelectedProject(proj)}
                          >
                            {proj.name}
                          </p>
                          <div className="flex items-center gap-2">
                            {selectedProject && (selectedProject.id || selectedProject._id) === (proj.id || proj._id) && (
                              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteProject(proj.id || proj._id);
                              }}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete project"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  {showCreateProject ? (
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                        placeholder="Project name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && createProject()}
                      />
                      <div className="flex gap-2">
                        <Button onClick={createProject} size="sm" className="flex-1">
                          Create
                        </Button>
                        <Button onClick={() => { setShowCreateProject(false); setNewProjectName(""); }} size="sm" variant="outline">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => setShowCreateProject(true)} 
                      variant="outline"
                      className="w-full"
                    >
                      + New Project
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tasks */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-shadow">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-200">
              <CardTitle className="text-lg font-semibold text-gray-900">Tasks</CardTitle>
              <CardDescription className="text-sm text-gray-600">Track your progress</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              {!selectedProject ? (
                <div className="text-center py-12 text-gray-400">
                  <p className="text-sm">Select a project first</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p className="text-sm">No tasks yet</p>
                    </div>
                  ) : (
                    tasks.map((task) => (
                      <div key={task.id || task._id} className="p-4 rounded-lg border border-gray-200 bg-white hover:border-green-300 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{task.title}</p>
                            {task.description && <p className="text-sm text-gray-600 mt-1">{task.description}</p>}
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <button
                                onClick={() => updateTaskStatus(task.id || task._id, getNextStatus(task.status))}
                                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${getStatusColor(task.status)}`}
                                title="Click to change status"
                              >
                                {task.status === 'todo' ? 'To Do' :
                                 task.status === 'in-progress' ? 'In Progress' :
                                 'Done'}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => deleteTask(task.id || task._id)}
                            className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                            title="Delete task"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  {showCreateTask ? (
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        placeholder="Task title *"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && createTask()}
                      />
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm resize-none"
                        placeholder="Task description (optional)"
                        rows={2}
                        value={newTaskDescription}
                        onChange={(e) => setNewTaskDescription(e.target.value)}
                      />
                      {teamMembers.length > 0 && (
                        <select
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                          value={newTaskAssignedTo}
                          onChange={(e) => setNewTaskAssignedTo(e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      )}
                      <div className="flex gap-2">
                        <Button onClick={createTask} size="sm" className="flex-1" disabled={!newTaskTitle.trim()}>
                          Create
                        </Button>
                        <Button onClick={() => { setShowCreateTask(false); setNewTaskTitle(""); setNewTaskDescription(""); setNewTaskAssignedTo(""); }} size="sm" variant="outline">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button 
                      onClick={() => setShowCreateTask(true)} 
                      variant="outline"
                      className="w-full"
                    >
                      + New Task
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

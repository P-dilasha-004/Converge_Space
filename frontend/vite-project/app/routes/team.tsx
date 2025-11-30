import type { Route } from "./+types/team";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router";
import { API_BASE_URL } from "@/lib/api";

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
      if (!token) {
        window.location.href = "/signin";
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/team/${workspaceId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/signin";
          return;
        }
        return;
      }
      const data = await response.json();
      const members = (data.members || []).map((m: any) => ({
        ...m,
        id: m.id || m._id,
      }));
      setMembers(members);
    } catch (error) {
      console.error("[TEAM] Error fetching members:", error);
    }
  };

  const fetchAISummaries = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/signin";
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/team/${workspaceId}/ai-summary`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/signin";
          return;
        }
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
      if (!token) {
        window.location.href = "/signin";
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/team/${workspaceId}/members/${memberId}/summary`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/signin";
          return;
        }
        return;
      }
      const data = await response.json();
      setMemberDetails(data);
      setSelectedMember(members.find(m => (m.id || m._id) === memberId));
    } catch (error) {
      console.error("[TEAM] Error fetching member details:", error);
    }
  };

  const addMember = async () => {
    if (!workspaceId || !newMemberEmail.trim()) {
      if (!newMemberEmail.trim()) alert("Please enter an email address");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/signin";
        return;
      }
      const response = await fetch(`${API_BASE_URL}/api/team/${workspaceId}/members`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: newMemberEmail.trim().toLowerCase() }),
      });
      if (response.ok) {
        setNewMemberEmail("");
        setShowAddMember(false);
        fetchMembers();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.message || "Failed to add member"}`);
      }
    } catch (error) {
      console.error("[TEAM] Error adding member:", error);
      alert("Failed to add member. Please try again.");
    }
  };

  const getSummaryForMember = (memberId: string) => {
    return summaries.find(s => s.memberId === memberId || s.memberId?.toString() === memberId?.toString());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-4 sm:px-8 py-4 sm:py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Team Members
            </h1>
            <p className="text-sm text-gray-600 mt-1">AI-powered insights and summaries</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Button
              onClick={fetchAISummaries}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg w-full sm:w-auto"
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
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto">Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Team Members List */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900">Team Members</CardTitle>
                  <Button
                    onClick={() => setShowAddMember(!showAddMember)}
                    size="sm"
                    variant="outline"
                    className="h-8"
                  >
                    + Add
                  </Button>
                </div>
                <CardDescription>View and manage team members</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {showAddMember && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-3">
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-2"
                      placeholder="Enter email address"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button onClick={addMember} size="sm" className="flex-1">Add</Button>
                      <Button onClick={() => setShowAddMember(false)} size="sm" variant="outline">Cancel</Button>
                    </div>
                  </div>
                )}
                {members.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No team members yet</p>
                  </div>
                ) : (
                  members.map((member) => {
                    const memberId = member.id || member._id;
                    const summary = getSummaryForMember(memberId);
                    return (
                      <div
                        key={memberId}
                        onClick={() => fetchMemberDetails(memberId)}
                        className={`p-4 rounded-lg cursor-pointer transition-all border ${
                          selectedMember && (selectedMember.id || selectedMember._id) === memberId
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
              <div className="space-y-6">
                {/* Member Header */}
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
                    {memberDetails.member && getSummaryForMember(memberDetails.member.id || memberDetails.member._id) && (
                      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                          <h3 className="font-semibold text-gray-900">AI Summary</h3>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {getSummaryForMember(memberDetails.member.id || memberDetails.member._id)?.summary}
                        </p>
                      </div>
                    )}

                    {/* Projects */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3">Projects ({memberDetails.stats.totalProjects})</h3>
                      <div className="space-y-2">
                        {memberDetails.projects.length === 0 ? (
                          <p className="text-sm text-gray-500">No projects assigned</p>
                        ) : (
                          memberDetails.projects.map((project: any) => (
                            <div key={project._id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                              <p className="font-medium text-gray-900">{project.name}</p>
                              {project.description && (
                                <p className="text-xs text-gray-600 mt-1">{project.description}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Tasks */}
                    <div className="mt-6">
                      <h3 className="font-semibold text-gray-900 mb-3">Tasks</h3>
                      <div className="space-y-2">
                        {memberDetails.tasks.length === 0 ? (
                          <p className="text-sm text-gray-500">No tasks assigned</p>
                        ) : (
                          memberDetails.tasks.map((task: any) => (
                            <div key={task._id} className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{task.title}</p>
                                  {task.description && (
                                    <p className="text-xs text-gray-600 mt-1">{task.description}</p>
                                  )}
                                  {task.projectId && (
                                    <p className="text-xs text-blue-600 mt-1">Project: {task.projectId.name}</p>
                                  )}
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded font-medium ${
                                  task.status === 'todo' ? 'bg-gray-100 text-gray-700' :
                                  task.status === 'in-progress' ? 'bg-amber-100 text-amber-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {task.status === 'todo' ? 'To Do' :
                                   task.status === 'in-progress' ? 'In Progress' :
                                   'Done'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
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


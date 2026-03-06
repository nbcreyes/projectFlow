"use client";

import { useState, useEffect } from "react";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  CheckSquare,
  TrendingUp,
  AlertTriangle,
  Users,
  Loader2,
} from "lucide-react";

const STATUS_COLORS = {
  TODO: "#94a3b8",
  IN_PROGRESS: "#3b82f6",
  IN_REVIEW: "#a855f7",
  DONE: "#22c55e",
  CANCELLED: "#ef4444",
};

const PRIORITY_COLORS = {
  URGENT: "#ef4444",
  HIGH: "#f97316",
  MEDIUM: "#eab308",
  LOW: "#3b82f6",
  NONE: "#94a3b8",
};

const STATUS_LABELS = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  IN_REVIEW: "In Review",
  DONE: "Done",
  CANCELLED: "Cancelled",
};

const PRIORITY_LABELS = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  NONE: "None",
};

function StatCard({ title, value, icon: Icon, description, color }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Workspace analytics dashboard.
 * Fetches data client-side so it is always fresh on load.
 */
export default function AnalyticsDashboard({ workspaceId, workspaceName, userRole }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/analytics`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [workspaceId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-destructive text-sm">Failed to load analytics: {error}</p>
      </div>
    );
  }

  const { stats, tasksByStatus, tasksByPriority, projectStats, activityByDay, topContributors } = data;

  const statusChartData = tasksByStatus.map((s) => ({
    name: STATUS_LABELS[s.status] || s.status,
    count: s.count,
    color: STATUS_COLORS[s.status] || "#94a3b8",
  }));

  const priorityChartData = tasksByPriority.map((p) => ({
    name: PRIORITY_LABELS[p.priority] || p.priority,
    count: p.count,
    color: PRIORITY_COLORS[p.priority] || "#94a3b8",
  }));

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Overview of activity and progress in {workspaceName}.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total tasks"
          value={stats.totalTasks}
          icon={CheckSquare}
          color="bg-blue-50 text-blue-500"
        />
        <StatCard
          title="Completed this week"
          value={stats.completedThisWeek}
          icon={TrendingUp}
          description="Since Sunday"
          color="bg-green-50 text-green-500"
        />
        <StatCard
          title="Overdue tasks"
          value={stats.overdueTasks}
          icon={AlertTriangle}
          description="Past due date"
          color={stats.overdueTasks > 0 ? "bg-red-50 text-red-500" : "bg-muted text-muted-foreground"}
        />
        <StatCard
          title="Active members"
          value={stats.activeMembers}
          icon={Users}
          description="Last 14 days"
          color="bg-purple-50 text-purple-500"
        />
      </div>

      {/* Activity over time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Activity — last 14 days</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={activityByDay}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 6,
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                name="Events"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks by status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tasks yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={statusChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Tasks">
                    {statusChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tasks by priority */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks by priority</CardTitle>
          </CardHeader>
          <CardContent>
            {priorityChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No tasks yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={priorityChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={60} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid hsl(var(--border))" }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Tasks">
                    {priorityChartData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks per project */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tasks per project</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {projectStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet.</p>
            ) : (
              projectStats.map((project) => {
                const max = Math.max(...projectStats.map((p) => p.taskCount), 1);
                const pct = Math.round((project.taskCount / max) * 100);
                return (
                  <div key={project.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
                        <span className="text-sm truncate">{project.name}</span>
                      </div>
                      <span className="text-sm font-medium tabular-nums">{project.taskCount}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: project.color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Top contributors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top contributors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topContributors.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed tasks yet.</p>
            ) : (
              topContributors.map((contributor, index) => (
                <div key={contributor.userId} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muted-foreground w-4 tabular-nums">
                    {index + 1}
                  </span>
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={contributor.image} />
                    <AvatarFallback className="text-xs">
                      {getInitials(contributor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="flex-1 text-sm truncate">{contributor.name}</span>
                  <span className="text-sm font-semibold tabular-nums">
                    {contributor.completedTasks}
                    <span className="text-muted-foreground font-normal text-xs ml-1">done</span>
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
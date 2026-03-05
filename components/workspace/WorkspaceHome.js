"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { formatDate, getInitials } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  Users,
  CheckSquare,
  Plus,
  ArrowRight,
} from "lucide-react";

/**
 * Workspace home page component.
 * Displays a welcome message, quick stats, and recent projects.
 */
export default function WorkspaceHome({ workspace, user, stats, recentProjects }) {
  const params = useParams();
  const workspaceId = params?.workspaceId;

  const firstName = user?.name?.split(" ")[0] || "there";

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Good to see you, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here is what is happening in {workspace.name}.
          </p>
        </div>
        <Button asChild>
          <Link href={`/workspace/${workspaceId}/projects/new`}>
            <Plus className="h-4 w-4 mr-2" />
            New project
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.projectCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Team members
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.memberCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open tasks
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.taskCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent projects */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Recent projects</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/workspace/${workspaceId}/projects`} className="flex items-center gap-1">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {recentProjects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium mb-1">No projects yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first project to get started.
              </p>
              <Button asChild>
                <Link href={`/workspace/${workspaceId}/projects/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  New project
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <Link
                key={project.id}
                href={`/workspace/${workspaceId}/project/${project.id}`}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-md flex items-center justify-center text-white text-sm font-bold shrink-0"
                        style={{ backgroundColor: project.color }}
                      >
                        {getInitials(project.name)}
                      </div>
                      <div className="overflow-hidden">
                        <CardTitle className="text-base truncate">{project.name}</CardTitle>
                        {project.description && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{project._count.tasks} tasks</span>
                      <span>{project._count.members} members</span>
                      <span className="ml-auto">{formatDate(project.updatedAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

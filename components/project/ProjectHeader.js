"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Kanban, List, Calendar } from "lucide-react";

/**
 * Project header with view tabs (Board, List, Calendar).
 * Shows project name, color, member avatars, and task count.
 */
export default function ProjectHeader({ project, workspaceId, currentUserRole }) {
  const pathname = usePathname();
  const base = `/workspace/${workspaceId}/project/${project.id}`;

  const tabs = [
    { label: "Board", href: `${base}/board`, icon: Kanban },
    { label: "List", href: `${base}/list`, icon: List },
    { label: "Calendar", href: `${base}/calendar`, icon: Calendar },
  ];

  return (
    <div className="border-b bg-background px-8 pt-6 pb-0 shrink-0">
      {/* Project title row */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
          style={{ backgroundColor: project.color }}
        >
          {getInitials(project.name)}
        </div>
        <h1 className="text-xl font-bold truncate">{project.name}</h1>
        {project.isArchived && (
          <Badge variant="secondary">Archived</Badge>
        )}
        <div className="ml-auto flex items-center gap-3">
          {/* Member avatars */}
          <div className="flex -space-x-2">
            {project.members.slice(0, 4).map((member) => (
              <Avatar key={member.id} className="h-7 w-7 border-2 border-background">
                <AvatarImage src={member.user.image} alt={member.user.name} />
                <AvatarFallback className="text-xs">
                  {getInitials(member.user.name)}
                </AvatarFallback>
              </Avatar>
            ))}
            {project.members.length > 4 && (
              <div className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                +{project.members.length - 4}
              </div>
            )}
          </div>
          <span className="text-sm text-muted-foreground">
            {project._count.tasks} tasks
          </span>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

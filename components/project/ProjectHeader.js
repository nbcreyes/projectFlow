"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * Project header with color badge, member avatars, and view tabs.
 */
export default function ProjectHeader({
  project,
  members,
  workspaceId,
}) {
  const pathname = usePathname();
  const basePath = `/workspace/${workspaceId}/project/${project.id}`;

  const tabs = [
    { label: "Board", href: `${basePath}/board` },
    { label: "List", href: `${basePath}/list` },
    { label: "Calendar", href: `${basePath}/calendar` },
    { label: "Activity", href: `${basePath}/activity` },
  ];

  return (
    <div className="border-b bg-background">
      <div className="px-6 pt-6 pb-0">
        {/* Project title row */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="h-8 w-8 rounded-lg shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <h1 className="text-xl font-bold truncate">{project.name}</h1>
          {project.description && (
            <p className="text-sm text-muted-foreground truncate hidden md:block">
              {project.description}
            </p>
          )}
          {/* Member avatars */}
          {members && members.length > 0 && (
            <div className="ml-auto flex -space-x-2">
              {members.slice(0, 5).map((member) => (
                <Avatar key={member.userId} className="h-7 w-7 border-2 border-background">
                  <AvatarFallback className="text-xs">
                    {getInitials(member.user?.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {members.length > 5 && (
                <div className="h-7 w-7 rounded-full border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                  +{members.length - 5}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
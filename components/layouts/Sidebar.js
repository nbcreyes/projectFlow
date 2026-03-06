"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";
import useSidebarStore from "@/lib/store/useSidebarStore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  FolderKanban,
  Users,
  Bell,
  BarChart2,
  Search,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  LogOut,
  User,
} from "lucide-react";

/**
 * Collapsible sidebar with workspace switcher, nav links,
 * notification badge, and user profile dropdown.
 */
export default function Sidebar({ workspaces, currentWorkspaceId, user }) {
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebarStore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, []);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  const navLinks = [
    {
      label: "Home",
      href: `/workspace/${currentWorkspaceId}`,
      icon: Home,
    },
    {
      label: "Projects",
      href: `/workspace/${currentWorkspaceId}/projects`,
      icon: FolderKanban,
    },
    {
      label: "Members",
      href: `/workspace/${currentWorkspaceId}/members`,
      icon: Users,
    },
    {
      label: "Notifications",
      href: `/notifications`,
      icon: Bell,
  BarChart2,
    },
    {
      label: "Search",
      href: `/search?workspaceId=${currentWorkspaceId}`,
      icon: Search,
    },
    {
      label: "Analytics",
      href: `/workspace/${currentWorkspaceId}/analytics`,
      icon: BarChart2,
    },
    {
      label: "Settings",
      href: `/workspace/${currentWorkspaceId}/settings`,
      icon: Settings,
    },
  ];

  function isActive(href) {
    if (href === `/workspace/${currentWorkspaceId}`) {
      return pathname === href;
    }
    return pathname.startsWith(href.split("?")[0]);
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col h-full border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-60"
      )}
    >
      {/* Workspace switcher */}
      <div className="p-3 border-b">
        {isCollapsed ? (
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {getInitials(currentWorkspace?.name || "W")}
            </div>
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors text-left">
                <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                  {getInitials(currentWorkspace?.name || "W")}
                </div>
                <span className="flex-1 text-sm font-semibold truncate">
                  {currentWorkspace?.name || "Workspace"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {workspaces.map((ws) => (
                <DropdownMenuItem key={ws.id} asChild>
                  <Link
                    href={`/workspace/${ws.id}`}
                    className="flex items-center gap-2"
                  >
                    <div className="h-5 w-5 rounded bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">
                      {getInitials(ws.name)}
                    </div>
                    <span className="truncate">{ws.name}</span>
                    {ws.id === currentWorkspaceId && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        Active
                      </span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link
                  href="/onboarding/workspace"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New workspace
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href);
          const badge =
            link.label === "Notifications" && unreadCount > 0
              ? unreadCount
              : null;

          return (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 truncate">{link.label}</span>
                  {badge && (
                    <span className="h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-medium">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </>
              )}
              {isCollapsed && badge && (
                <span className="absolute left-8 top-1 h-3.5 w-3.5 rounded-full bg-destructive border-2 border-background" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="p-2 border-t">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-accent transition-colors",
                isCollapsed && "justify-center"
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarImage src={user?.image} />
                <AvatarFallback className="text-xs">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-medium truncate leading-tight">
                      {user?.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate leading-tight">
                      {user?.email}
                    </p>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-52">
            <DropdownMenuItem asChild>
              <Link href="/settings/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive focus:text-destructive flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-background shadow-sm flex items-center justify-center hover:bg-accent transition-colors z-10"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>
    </aside>
  );
}

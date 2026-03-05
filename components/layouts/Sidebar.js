"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn, getInitials } from "@/lib/utils";
import useSidebarStore from "@/lib/store/useSidebarStore";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  LogOut,
  ChevronsUpDown,
  Bell,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * Main application sidebar.
 * Collapsible - stores state in Zustand (persisted to localStorage).
 * Shows workspace switcher, navigation, and user profile.
 */
export default function Sidebar({ workspaces, user }) {
  const params = useParams();
  const pathname = usePathname();
  const { isCollapsed, toggle } = useSidebarStore();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const workspaceId = params?.workspaceId;
  const currentWorkspace = workspaces.find((w) => w.id === workspaceId) || workspaces[0];

  const navLinks = [
    {
      label: "Home",
      href: `/workspace/${workspaceId}`,
      icon: LayoutDashboard,
    },
    {
      label: "Projects",
      href: `/workspace/${workspaceId}/projects`,
      icon: FolderKanban,
    },
    {
      label: "Members",
      href: `/workspace/${workspaceId}/members`,
      icon: Users,
    },
    {
      label: "Notifications",
      href: `/notifications`,
      icon: Bell,
    },
    {
      label: "Search",
      href: `/search`,
      icon: Search,
    },
    {
      label: "Settings",
      href: `/workspace/${workspaceId}/settings`,
      icon: Settings,
    },
  ];

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "relative flex flex-col h-screen border-r bg-card transition-all duration-300 ease-in-out shrink-0",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Collapse toggle button */}
        <button
          onClick={toggle}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-accent transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>

        {/* Workspace switcher */}
        <div className="p-3 border-b">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-md p-2 hover:bg-accent transition-colors text-left",
                  isCollapsed && "justify-center"
                )}
              >
                {/* Workspace avatar */}
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold">
                  {currentWorkspace
                    ? getInitials(currentWorkspace.name)
                    : "?"}
                </div>

                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate text-sm font-medium">
                      {currentWorkspace?.name || "Select workspace"}
                    </span>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {workspaces.map((workspace) => (
                <DropdownMenuItem key={workspace.id} asChild>
                  <Link href={`/workspace/${workspace.id}`} className="flex items-center gap-2">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                      {getInitials(workspace.name)}
                    </div>
                    <span className="truncate">{workspace.name}</span>
                    {workspace.id === workspaceId && (
                      <span className="ml-auto text-xs text-muted-foreground">Current</span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/onboarding" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  New workspace
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            const linkEl = (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isCollapsed && "justify-center px-2",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span>{link.label}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={link.href}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right">{link.label}</TooltipContent>
                </Tooltip>
              );
            }

            return linkEl;
          })}
        </nav>

        {/* User profile and sign out */}
        <div className="border-t p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex w-full items-center gap-2 rounded-md p-2 hover:bg-accent transition-colors",
                  isCollapsed && "justify-center"
                )}
              >
                <Avatar className="h-7 w-7 shrink-0">
                  <AvatarImage src={user?.image} alt={user?.name} />
                  <AvatarFallback className="text-xs">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 overflow-hidden text-left">
                      <p className="truncate text-sm font-medium">{user?.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">Profile settings</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isSigningOut ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </TooltipProvider>
  );
}

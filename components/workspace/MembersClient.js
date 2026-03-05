"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getInitials, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus, MoreHorizontal, Shield, LogOut } from "lucide-react";

/**
 * Role badge color map.
 */
const roleBadgeVariant = {
  OWNER: "default",
  ADMIN: "secondary",
  MEMBER: "outline",
  VIEWER: "outline",
};

/**
 * Roles that can be assigned when inviting or changing a member.
 */
const assignableRoles = ["ADMIN", "MEMBER", "VIEWER"];

/**
 * Members management client component.
 * Handles invite, role change, and removal interactions.
 */
export default function MembersClient({
  members,
  currentUserId,
  currentUserRole,
  workspaceId,
  workspace,
}) {
  const router = useRouter();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const canManageMembers = ["OWNER", "ADMIN"].includes(currentUserRole);

  async function handleInvite(e) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess("");

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        setInviteError(data.error || "Failed to invite member");
        return;
      }

      setInviteSuccess(`${inviteEmail} has been added to the workspace.`);
      setInviteEmail("");
      setInviteRole("MEMBER");
      router.refresh();
    } catch (err) {
      setInviteError("Something went wrong. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  }

  async function handleRoleChange(memberId, newRole) {
    setActionLoading(memberId);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: newRole }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update role");
        return;
      }

      router.refresh();
    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRemove(memberId, memberName) {
    if (!confirm(`Remove ${memberName} from this workspace?`)) return;

    setActionLoading(memberId);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to remove member");
        return;
      }

      router.refresh();
    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground mt-1">
            {members.length} {members.length === 1 ? "member" : "members"} in{" "}
            {workspace.name}
          </p>
        </div>

        {canManageMembers && (
          <Dialog
            open={isInviteOpen}
            onOpenChange={(open) => {
              setIsInviteOpen(open);
              if (!open) {
                setInviteError("");
                setInviteSuccess("");
                setInviteEmail("");
                setInviteRole("MEMBER");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Invite member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite a member</DialogTitle>
                <DialogDescription>
                  Add someone to {workspace.name} by their email address. They
                  must already have a ProjectFlow account.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleInvite} className="space-y-4 mt-2">
                {inviteError && (
                  <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
                    {inviteError}
                  </div>
                )}
                {inviteSuccess && (
                  <div className="bg-green-500/10 text-green-600 text-sm px-3 py-2 rounded-md">
                    {inviteSuccess}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email address</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    placeholder="colleague@example.com"
                    value={inviteEmail}
                    onChange={(e) => {
                      setInviteError("");
                      setInviteSuccess("");
                      setInviteEmail(e.target.value);
                    }}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inviteRole">Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={setInviteRole}
                  >
                    <SelectTrigger id="inviteRole">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableRoles.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role.charAt(0) + role.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteLoading}>
                    {inviteLoading ? "Adding..." : "Add member"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Separator />

      {/* Members list */}
      <Card>
        <CardHeader>
          <CardTitle>Workspace members</CardTitle>
          <CardDescription>
            Manage who has access to this workspace and their roles.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            {members.map((member) => {
              const isCurrentUser = member.userId === currentUserId;
              const isOwner = member.role === "OWNER";
              const canEdit =
                canManageMembers && !isOwner && !isCurrentUser;
              const isLoading = actionLoading === member.id;

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  {/* Avatar */}
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage
                      src={member.user.image}
                      alt={member.user.name}
                    />
                    <AvatarFallback className="text-sm">
                      {getInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {member.user.name}
                      </p>
                      {isCurrentUser && (
                        <span className="text-xs text-muted-foreground">
                          (you)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {member.user.email}
                    </p>
                  </div>

                  {/* Joined date */}
                  <p className="text-xs text-muted-foreground hidden md:block shrink-0">
                    Joined {formatDate(member.joinedAt)}
                  </p>

                  {/* Role badge */}
                  <Badge
                    variant={roleBadgeVariant[member.role]}
                    className="shrink-0"
                  >
                    {member.role.charAt(0) +
                      member.role.slice(1).toLowerCase()}
                  </Badge>

                  {/* Actions */}
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          disabled={isLoading}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Change role</DropdownMenuLabel>
                        {assignableRoles.map((role) => (
                          <DropdownMenuItem
                            key={role}
                            onClick={() =>
                              handleRoleChange(member.id, role)
                            }
                            disabled={member.role === role}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            {role.charAt(0) + role.slice(1).toLowerCase()}
                            {member.role === role && (
                              <span className="ml-auto text-xs text-muted-foreground">
                                Current
                              </span>
                            )}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            handleRemove(member.id, member.user.name)
                          }
                          className="text-destructive focus:text-destructive"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Remove from workspace
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

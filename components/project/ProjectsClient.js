"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDate, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  FolderKanban,
  Archive,
  Pencil,
  Trash2,
} from "lucide-react";

const PROJECT_COLORS = [
  "#3b82f6", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#06b6d4",
];

/**
 * Projects list client component.
 * Handles create, edit, archive, and delete interactions.
 */
export default function ProjectsClient({
  projects,
  archivedCount,
  workspaceId,
  workspace,
  currentUserRole,
}) {
  const router = useRouter();
  const canManage = ["OWNER", "ADMIN"].includes(currentUserRole);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });

  const [editProject, setEditProject] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    color: "#3b82f6",
  });

  const [actionLoading, setActionLoading] = useState(null);

  function handleCreateChange(e) {
    setCreateError("");
    setCreateForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleEditChange(e) {
    setEditError("");
    setEditForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function openEditDialog(project) {
    setEditProject(project);
    setEditForm({
      name: project.name,
      description: project.description || "",
      color: project.color,
    });
    setEditError("");
  }

  async function handleCreate(e) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Failed to create project");
        return;
      }

      setIsCreateOpen(false);
      setCreateForm({ name: "", description: "", color: "#3b82f6" });
      router.push(`/workspace/${workspaceId}/project/${data.project.id}`);
      router.refresh();
    } catch (err) {
      setCreateError("Something went wrong. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleEdit(e) {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${editProject.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "Failed to update project");
        return;
      }

      setEditProject(null);
      router.refresh();
    } catch (err) {
      setEditError("Something went wrong. Please try again.");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleArchive(project) {
    setActionLoading(project.id);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${project.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isArchived: true }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to archive project");
        return;
      }

      router.refresh();
    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(project) {
    if (
      !confirm(
        `Permanently delete "${project.name}"? This cannot be undone and will delete all tasks, documents, and comments.`
      )
    ) {
      return;
    }

    setActionLoading(project.id);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${project.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete project");
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
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground mt-1">
            {projects.length} active project{projects.length !== 1 ? "s" : ""}
            {archivedCount > 0 && ` · ${archivedCount} archived`}
          </p>
        </div>

        {canManage && (
          <Dialog
            open={isCreateOpen}
            onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) {
                setCreateError("");
                setCreateForm({ name: "", description: "", color: "#3b82f6" });
              }
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create project</DialogTitle>
                <DialogDescription>
                  Add a new project to {workspace.name}.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                {createError && (
                  <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
                    {createError}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="createName">Project name</Label>
                  <Input
                    id="createName"
                    name="name"
                    placeholder="e.g. Website Redesign"
                    value={createForm.name}
                    onChange={handleCreateChange}
                    required
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="createDescription">
                    Description
                  </Label>
                  <Textarea
                    id="createDescription"
                    name="description"
                    placeholder="What is this project about?"
                    value={createForm.description}
                    onChange={handleCreateChange}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {PROJECT_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() =>
                          setCreateForm((prev) => ({ ...prev, color }))
                        }
                        className="h-7 w-7 rounded-full border-2 transition-all"
                        style={{
                          backgroundColor: color,
                          borderColor:
                            createForm.color === color
                              ? "hsl(var(--foreground))"
                              : "transparent",
                          transform:
                            createForm.color === color
                              ? "scale(1.2)"
                              : "scale(1)",
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? "Creating..." : "Create project"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="font-medium mb-1">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first project to start managing tasks.
            </p>
            {canManage && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New project
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group hover:shadow-md transition-shadow relative"
            >
              {canManage && (
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={actionLoading === project.id}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => openEditDialog(project)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleArchive(project)}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(project)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}

              <Link
                href={`/workspace/${workspaceId}/project/${project.id}`}
                className="block"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: project.color }}
                    >
                      {getInitials(project.name)}
                    </div>
                    <div className="overflow-hidden">
                      <CardTitle className="text-base truncate">
                        {project.name}
                      </CardTitle>
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
                    <span className="ml-auto">
                      {formatDate(project.updatedAt)}
                    </span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {archivedCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Archive className="h-4 w-4" />
          <span>
            {archivedCount} archived project{archivedCount !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      <Dialog
        open={!!editProject}
        onOpenChange={(open) => {
          if (!open) setEditProject(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            {editError && (
              <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
                {editError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="editName">Project name</Label>
              <Input
                id="editName"
                name="name"
                value={editForm.name}
                onChange={handleEditChange}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                name="description"
                value={editForm.description}
                onChange={handleEditChange}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() =>
                      setEditForm((prev) => ({ ...prev, color }))
                    }
                    className="h-7 w-7 rounded-full border-2 transition-all"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        editForm.color === color
                          ? "hsl(var(--foreground))"
                          : "transparent",
                      transform:
                        editForm.color === color ? "scale(1.2)" : "scale(1)",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditProject(null)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editLoading}>
                {editLoading ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
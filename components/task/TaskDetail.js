"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn, formatDate, formatDateTime, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronRight, Calendar, User, Tag, Layers, Trash2, Check, Plus, X, Flag, Clock } from "lucide-react";
import TaskEditor from "@/components/editor/TaskEditor";
import TaskAttachments from "@/components/task/TaskAttachments";
import TaskComments from "@/components/task/TaskComments";
import ActivityFeed from "@/components/activity/ActivityFeed";

const STATUS_OPTIONS = [
  { value: "TODO", label: "To Do" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "IN_REVIEW", label: "In Review" },
  { value: "DONE", label: "Done" },
  { value: "CANCELLED", label: "Cancelled" },
];

const PRIORITY_OPTIONS = [
  { value: "URGENT", label: "Urgent", className: "text-red-500" },
  { value: "HIGH", label: "High", className: "text-orange-500" },
  { value: "MEDIUM", label: "Medium", className: "text-yellow-600" },
  { value: "LOW", label: "Low", className: "text-blue-500" },
  { value: "NONE", label: "None", className: "text-muted-foreground" },
];

const LABEL_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#06b6d4", "#3b82f6", "#8b5cf6", "#ec4899",
];

export default function TaskDetail({
  task: initialTask,
  columns,
  workspaceMembers,
  labels: initialLabels,
  comments: initialComments,
  workspaceId,
  projectId,
  currentUserId,
  currentUserRole,
  currentUser,
}) {
  const router = useRouter();
  const canEdit = currentUserRole !== "VIEWER";

  const [task, setTask] = useState(initialTask);
  const [labels, setLabels] = useState(initialLabels);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(task.title);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionValue, setDescriptionValue] = useState(task.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6");
  const [labelCreateLoading, setLabelCreateLoading] = useState(false);

  async function updateTask(data) {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        setTask((prev) => ({ ...prev, ...result.task }));
      }
    } catch (err) {
      console.error("Update task error:", err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTitleSave() {
    if (!titleValue.trim() || titleValue === task.title) {
      setTitleValue(task.title);
      setIsEditingTitle(false);
      return;
    }
    await updateTask({ title: titleValue });
    setIsEditingTitle(false);
  }

  async function handleDescriptionSave() {
    if (descriptionValue === (task.description || "")) {
      setIsEditingDescription(false);
      return;
    }
    await updateTask({ description: descriptionValue });
    setIsEditingDescription(false);
  }

  async function handleAssigneeToggle(userId) {
    const isAssigned = task.assignees.some((a) => a.user.id === userId);
    try {
      const res = await fetch(`/api/tasks/${task.id}/assignees`, {
        method: isAssigned ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) return;
      const member = workspaceMembers.find((m) => m.user.id === userId);
      setTask((prev) => ({
        ...prev,
        assignees: isAssigned
          ? prev.assignees.filter((a) => a.user.id !== userId)
          : [...prev.assignees, { user: member.user }],
      }));
    } catch (err) {
      console.error("Toggle assignee error:", err);
    }
  }

  async function handleLabelToggle(labelId) {
    const isApplied = task.labels.some((l) => l.label.id === labelId);
    try {
      const res = await fetch(`/api/tasks/${task.id}/labels`, {
        method: isApplied ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelId }),
      });
      if (!res.ok) return;
      const label = labels.find((l) => l.id === labelId);
      setTask((prev) => ({
        ...prev,
        labels: isApplied
          ? prev.labels.filter((l) => l.label.id !== labelId)
          : [...prev.labels, { label }],
      }));
    } catch (err) {
      console.error("Toggle label error:", err);
    }
  }

  async function handleCreateLabel(e) {
    e.preventDefault();
    if (!newLabelName.trim()) return;
    setLabelCreateLoading(true);
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/labels`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newLabelName, color: newLabelColor }),
        }
      );
      const data = await res.json();
      if (!res.ok) return;
      setLabels((prev) => [...prev, data.label]);
      setNewLabelName("");
      setNewLabelColor("#3b82f6");
      setIsCreatingLabel(false);
    } catch (err) {
      console.error("Create label error:", err);
    } finally {
      setLabelCreateLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${task.title}"? This cannot be undone.`)) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push(`/workspace/${workspaceId}/project/${projectId}/board`);
        router.refresh();
      }
    } catch (err) {
      console.error("Delete task error:", err);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
          <Link href={`/workspace/${workspaceId}/projects`} className="hover:text-foreground transition-colors">
            Projects
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href={`/workspace/${workspaceId}/project/${projectId}/board`} className="hover:text-foreground transition-colors">
            {task.project.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground truncate max-w-[200px]">{task.title}</span>
        </nav>

        <div className="flex gap-8">
          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Title */}
            <div>
              {isEditingTitle && canEdit ? (
                <div className="flex gap-2">
                  <Input
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    className="text-2xl font-bold h-auto py-1 px-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave();
                      if (e.key === "Escape") {
                        setTitleValue(task.title);
                        setIsEditingTitle(false);
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleTitleSave}>Save</Button>
                </div>
              ) : (
                <h1
                  className={cn(
                    "text-2xl font-bold leading-tight",
                    canEdit && "cursor-pointer hover:bg-accent rounded px-2 py-1 -mx-2 transition-colors"
                  )}
                  onClick={() => canEdit && setIsEditingTitle(true)}
                >
                  {task.title}
                </h1>
              )}
            </div>

            {/* Labels display */}
            {task.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {task.labels.map(({ label }) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Description</h3>
              {isEditingDescription && canEdit ? (
                <div className="space-y-2">
                  <Textarea
                    value={descriptionValue}
                    onChange={(e) => setDescriptionValue(e.target.value)}
                    placeholder="Add a description..."
                    rows={6}
                    autoFocus
                    className="resize-none"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleDescriptionSave}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => {
                      setDescriptionValue(task.description || "");
                      setIsEditingDescription(false);
                    }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    "min-h-[80px] rounded-md p-3 text-sm",
                    canEdit ? "cursor-pointer hover:bg-accent transition-colors" : "bg-muted/30",
                    !task.description && "text-muted-foreground"
                  )}
                  onClick={() => canEdit && setIsEditingDescription(true)}
                >
                  {task.description || "Click to add a description..."}
                </div>
              )}
            </div>

            <Separator />

            {/* Document editor */}
            <div>
              <h3 className="text-sm font-semibold mb-2">Document</h3>
              <TaskEditor
                taskId={task.id}
                initialDocument={task.document}
                canEdit={canEdit}
              />
            </div>

            <Separator />

            {/* Attachments */}
            <TaskAttachments
              taskId={task.id}
              initialAttachments={task.attachments}
              canEdit={canEdit}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
            />

            <Separator />

            {/* Comments */}
            <TaskComments
              taskId={task.id}
              initialComments={initialComments}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              currentUser={currentUser}
            />

            <Separator />

            {/* Activity */}
            <div>
              <h3 className="text-sm font-semibold mb-4">Activity</h3>
              <ActivityFeed
                fetchUrl={`/api/tasks/${task.id}/activity`}
                showTask={false}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-56 shrink-0 space-y-5">
            {/* Status */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Status</p>
              {canEdit ? (
                <Select value={task.status} onValueChange={(val) => updateTask({ status: val })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline">{task.status}</Badge>
              )}
            </div>

            {/* Priority */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Priority</p>
              {canEdit ? (
                <Select value={task.priority} onValueChange={(val) => updateTask({ priority: val })}>
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className={opt.className}>{opt.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="outline">{task.priority}</Badge>
              )}
            </div>

            {/* Column */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Column</p>
              {canEdit ? (
                <Select
                  value={task.columnId || "none"}
                  onValueChange={(val) => updateTask({ columnId: val === "none" ? null : val })}
                >
                  <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No column</SelectItem>
                    {columns.map((col) => (
                      <SelectItem key={col.id} value={col.id}>{col.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="text-sm">{task.column?.name || "No column"}</span>
              )}
            </div>

            {/* Assignees */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Assignees</p>
              <div className="space-y-1.5">
                {task.assignees.map(({ user }) => (
                  <div key={user.id} className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.image} />
                      <AvatarFallback className="text-xs">{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate flex-1">{user.name}</span>
                    {canEdit && (
                      <button
                        onClick={() => handleAssigneeToggle(user.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {canEdit && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-full justify-start text-muted-foreground">
                        <Plus className="h-3.5 w-3.5 mr-1.5" />
                        Add assignee
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-2">
                      <div className="space-y-1">
                        {workspaceMembers.map((member) => {
                          const isAssigned = task.assignees.some((a) => a.user.id === member.user.id);
                          return (
                            <button
                              key={member.user.id}
                              onClick={() => handleAssigneeToggle(member.user.id)}
                              className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-accent transition-colors text-sm"
                            >
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={member.user.image} />
                                <AvatarFallback className="text-[10px]">{getInitials(member.user.name)}</AvatarFallback>
                              </Avatar>
                              <span className="flex-1 truncate text-left">{member.user.name}</span>
                              {isAssigned && <Check className="h-3.5 w-3.5 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>

            {/* Labels */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Labels</p>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {task.labels.map(({ label }) => (
                  <span
                    key={label.id}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-white"
                    style={{ backgroundColor: label.color }}
                  >
                    {label.name}
                    {canEdit && (
                      <button onClick={() => handleLabelToggle(label.id)} className="hover:opacity-70">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {canEdit && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-full justify-start text-muted-foreground">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add label
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2">
                    <div className="space-y-1 mb-2">
                      {labels.map((label) => {
                        const isApplied = task.labels.some((l) => l.label.id === label.id);
                        return (
                          <button
                            key={label.id}
                            onClick={() => handleLabelToggle(label.id)}
                            className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-accent transition-colors text-sm"
                          >
                            <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                            <span className="flex-1 truncate text-left">{label.name}</span>
                            {isApplied && <Check className="h-3.5 w-3.5 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                    {labels.length > 0 && <Separator className="my-2" />}
                    {isCreatingLabel ? (
                      <form onSubmit={handleCreateLabel} className="space-y-2">
                        <Input
                          value={newLabelName}
                          onChange={(e) => setNewLabelName(e.target.value)}
                          placeholder="Label name"
                          className="h-7 text-xs"
                          autoFocus
                        />
                        <div className="flex gap-1 flex-wrap">
                          {LABEL_COLORS.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewLabelColor(color)}
                              className="h-5 w-5 rounded-full border-2 transition-all"
                              style={{
                                backgroundColor: color,
                                borderColor: newLabelColor === color ? "hsl(var(--foreground))" : "transparent",
                              }}
                            />
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <Button type="submit" size="sm" className="h-6 text-xs flex-1" disabled={labelCreateLoading || !newLabelName.trim()}>
                            Create
                          </Button>
                          <Button type="button" size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setIsCreatingLabel(false)}>
                            Cancel
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setIsCreatingLabel(true)}
                        className="flex items-center gap-1.5 w-full px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                        Create label
                      </button>
                    )}
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Due date */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Due date</p>
              {canEdit ? (
                <Input
                  type="date"
                  className="h-8 text-sm"
                  value={task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : ""}
                  onChange={(e) => updateTask({ dueDate: e.target.value || null })}
                />
              ) : (
                <span className="text-sm">{task.dueDate ? formatDate(task.dueDate) : "No due date"}</span>
              )}
            </div>

            {/* Start date */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Start date</p>
              {canEdit ? (
                <Input
                  type="date"
                  className="h-8 text-sm"
                  value={task.startDate ? new Date(task.startDate).toISOString().split("T")[0] : ""}
                  onChange={(e) => updateTask({ startDate: e.target.value || null })}
                />
              ) : (
                <span className="text-sm">{task.startDate ? formatDate(task.startDate) : "No start date"}</span>
              )}
            </div>

            <Separator />

            {/* Metadata */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span>Created by <span className="text-foreground">{task.createdBy.name}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 shrink-0" />
                <span>{formatDateTime(task.createdAt)}</span>
              </div>
            </div>

            <Separator />

            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete task"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  MessageSquare,
} from "lucide-react";

const PRIORITY_CONFIG = {
  URGENT: { label: "Urgent", className: "text-red-500 bg-red-50" },
  HIGH: { label: "High", className: "text-orange-500 bg-orange-50" },
  MEDIUM: { label: "Medium", className: "text-yellow-600 bg-yellow-50" },
  LOW: { label: "Low", className: "text-blue-500 bg-blue-50" },
  NONE: { label: "None", className: "text-muted-foreground bg-muted" },
};

const STATUS_CONFIG = {
  TODO: { label: "To Do", className: "text-slate-600 bg-slate-100" },
  IN_PROGRESS: { label: "In Progress", className: "text-blue-600 bg-blue-100" },
  IN_REVIEW: { label: "In Review", className: "text-yellow-600 bg-yellow-100" },
  DONE: { label: "Done", className: "text-green-600 bg-green-100" },
  CANCELLED: { label: "Cancelled", className: "text-muted-foreground bg-muted" },
};

/**
 * List view component.
 * Shows tasks grouped by column in a sortable table layout.
 */
export default function ListView({
  initialColumns,
  workspaceId,
  projectId,
  currentUserRole,
}) {
  const router = useRouter();
  const canEdit = currentUserRole !== "VIEWER";

  const [columns, setColumns] = useState(initialColumns);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [addingTaskToColumn, setAddingTaskToColumn] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addTaskLoading, setAddTaskLoading] = useState(false);

  function toggleGroup(columnId) {
    setCollapsedGroups((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  }

  function handleSort(key) {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }

  function getSortedTasks(tasks) {
    if (!sortConfig.key) return tasks;

    return [...tasks].sort((a, b) => {
      let aVal, bVal;

      if (sortConfig.key === "title") {
        aVal = a.title.toLowerCase();
        bVal = b.title.toLowerCase();
      } else if (sortConfig.key === "priority") {
        const order = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4 };
        aVal = order[a.priority];
        bVal = order[b.priority];
      } else if (sortConfig.key === "dueDate") {
        aVal = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        bVal = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      } else if (sortConfig.key === "status") {
        const order = {
          TODO: 0,
          IN_PROGRESS: 1,
          IN_REVIEW: 2,
          DONE: 3,
          CANCELLED: 4,
        };
        aVal = order[a.status];
        bVal = order[b.status];
      }

      if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }

  function SortIcon({ column }) {
    if (sortConfig.key !== column) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />;
    }
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5" />
    );
  }

  async function handleStatusChange(taskId, newStatus, columnId) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) return;

      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) =>
            t.id === taskId ? { ...t, status: newStatus } : t
          ),
        }))
      );
    } catch (err) {
      console.error("Update status error:", err);
    }
  }

  async function handlePriorityChange(taskId, newPriority) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: newPriority }),
      });

      if (!res.ok) return;

      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t) =>
            t.id === taskId ? { ...t, priority: newPriority } : t
          ),
        }))
      );
    } catch (err) {
      console.error("Update priority error:", err);
    }
  }

  async function handleAddTask(e, columnId) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAddTaskLoading(true);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: newTaskTitle, columnId }),
        }
      );

      const data = await res.json();
      if (!res.ok) return;

      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId
            ? { ...col, tasks: [...col.tasks, data.task] }
            : col
        )
      );
      setNewTaskTitle("");
      setAddingTaskToColumn(null);
    } catch (err) {
      console.error("Add task error:", err);
    } finally {
      setAddTaskLoading(false);
    }
  }

  const totalTasks = columns.reduce((sum, col) => sum + col.tasks.length, 0);

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 min-w-[700px]">
        {/* Table header */}
        <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b mb-1">
          <div className="flex-1 flex items-center gap-1">
            <button
              onClick={() => handleSort("title")}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Title
              <SortIcon column="title" />
            </button>
          </div>
          <div className="w-32 flex items-center gap-1">
            <button
              onClick={() => handleSort("status")}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Status
              <SortIcon column="status" />
            </button>
          </div>
          <div className="w-28 flex items-center gap-1">
            <button
              onClick={() => handleSort("priority")}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Priority
              <SortIcon column="priority" />
            </button>
          </div>
          <div className="w-28 flex items-center gap-1">
            <button
              onClick={() => handleSort("dueDate")}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              Due date
              <SortIcon column="dueDate" />
            </button>
          </div>
          <div className="w-24">Assignees</div>
        </div>

        {/* Grouped rows */}
        {columns.map((column) => {
          const isCollapsed = collapsedGroups[column.id];
          const sortedTasks = getSortedTasks(column.tasks);

          return (
            <div key={column.id} className="mb-4">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(column.id)}
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-muted/50 rounded-md transition-colors text-sm font-medium"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <span>{column.name}</span>
                <span className="text-xs text-muted-foreground font-normal ml-1">
                  {column.tasks.length}
                </span>
              </button>

              {/* Task rows */}
              {!isCollapsed && (
                <div className="border rounded-lg overflow-hidden mt-1">
                  {sortedTasks.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                      No tasks in this column
                    </div>
                  ) : (
                    sortedTasks.map((task, index) => {
                      const isOverdue =
                        task.dueDate &&
                        new Date(task.dueDate) < new Date() &&
                        task.status !== "DONE";

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "flex items-center gap-2 px-4 py-2.5 hover:bg-muted/30 transition-colors cursor-pointer",
                            index !== sortedTasks.length - 1 && "border-b"
                          )}
                          onClick={() =>
                            router.push(
                              `/workspace/${workspaceId}/project/${projectId}/task/${task.id}`
                            )
                          }
                        >
                          {/* Title */}
                          <div className="flex-1 flex items-center gap-2 min-w-0">
                            <span className="text-sm truncate">
                              {task.title}
                            </span>
                            {task._count?.comments > 0 && (
                              <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                                <MessageSquare className="h-3 w-3" />
                                {task._count.comments}
                              </span>
                            )}
                          </div>

                          {/* Status */}
                          <div
                            className="w-32 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {canEdit ? (
                              <Select
                                value={task.status}
                                onValueChange={(val) =>
                                  handleStatusChange(task.id, val, column.id)
                                }
                              >
                                <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 focus:ring-0">
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded-full text-xs font-medium",
                                      STATUS_CONFIG[task.status]?.className
                                    )}
                                  >
                                    {STATUS_CONFIG[task.status]?.label}
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(STATUS_CONFIG).map(
                                    ([value, config]) => (
                                      <SelectItem
                                        key={value}
                                        value={value}
                                        className="text-xs"
                                      >
                                        {config.label}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  STATUS_CONFIG[task.status]?.className
                                )}
                              >
                                {STATUS_CONFIG[task.status]?.label}
                              </span>
                            )}
                          </div>

                          {/* Priority */}
                          <div
                            className="w-28 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {canEdit ? (
                              <Select
                                value={task.priority}
                                onValueChange={(val) =>
                                  handlePriorityChange(task.id, val)
                                }
                              >
                                <SelectTrigger className="h-7 text-xs border-0 bg-transparent p-0 focus:ring-0">
                                  <span
                                    className={cn(
                                      "px-2 py-0.5 rounded-full text-xs font-medium",
                                      PRIORITY_CONFIG[task.priority]?.className
                                    )}
                                  >
                                    {PRIORITY_CONFIG[task.priority]?.label}
                                  </span>
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(PRIORITY_CONFIG).map(
                                    ([value, config]) => (
                                      <SelectItem
                                        key={value}
                                        value={value}
                                        className="text-xs"
                                      >
                                        {config.label}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-xs font-medium",
                                  PRIORITY_CONFIG[task.priority]?.className
                                )}
                              >
                                {PRIORITY_CONFIG[task.priority]?.label}
                              </span>
                            )}
                          </div>

                          {/* Due date */}
                          <div className="w-28 shrink-0">
                            {task.dueDate ? (
                              <span
                                className={cn(
                                  "flex items-center gap-1 text-xs",
                                  isOverdue
                                    ? "text-destructive"
                                    : "text-muted-foreground"
                                )}
                              >
                                <Calendar className="h-3 w-3" />
                                {formatDate(task.dueDate)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No date
                              </span>
                            )}
                          </div>

                          {/* Assignees */}
                          <div className="w-24 shrink-0 flex -space-x-1.5">
                            {task.assignees?.slice(0, 3).map(({ user }) => (
                              <Avatar
                                key={user.id}
                                className="h-6 w-6 border-2 border-background"
                              >
                                <AvatarImage src={user.image} />
                                <AvatarFallback className="text-[10px]">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Add task row */}
                  {canEdit && (
                    <div className="border-t">
                      {addingTaskToColumn === column.id ? (
                        <form
                          onSubmit={(e) => handleAddTask(e, column.id)}
                          className="flex items-center gap-2 px-4 py-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Input
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Task title"
                            autoFocus
                            className="h-7 text-sm flex-1"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            className="h-7"
                            disabled={
                              addTaskLoading || !newTaskTitle.trim()
                            }
                          >
                            {addTaskLoading ? "Adding..." : "Add"}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              setAddingTaskToColumn(null);
                              setNewTaskTitle("");
                            }}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      ) : (
                        <button
                          onClick={() => setAddingTaskToColumn(column.id)}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Add task
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty state */}
        {totalTasks === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No tasks yet. Create your first task from the board view.
          </div>
        )}
      </div>
    </div>
  );
}
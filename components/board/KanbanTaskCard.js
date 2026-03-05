"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { cn, getInitials, formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  MessageSquare,
  Paperclip,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
} from "lucide-react";

/**
 * Priority color map for visual indicators.
 */
const PRIORITY_COLORS = {
  URGENT: "text-red-500",
  HIGH: "text-orange-500",
  MEDIUM: "text-yellow-500",
  LOW: "text-blue-400",
  NONE: "text-muted-foreground",
};

const PRIORITY_LABELS = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  NONE: "None",
};

/**
 * A single task card on the Kanban board.
 * Sortable via dnd-kit.
 * Clicking opens the task detail page.
 */
export default function KanbanTaskCard({
  task,
  workspaceId,
  projectId,
  canEdit,
  workspaceMembers,
  onTaskUpdated,
  onTaskDeleted,
  isDragging = false,
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    task.dueDate &&
    new Date(task.dueDate) < new Date() &&
    task.status !== "DONE";

  async function handleDelete(e) {
    e.stopPropagation();
    if (!confirm(`Delete "${task.title}"?`)) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/tasks/${task.id}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        onTaskDeleted(task.id);
      }
    } catch (err) {
      console.error("Delete task error:", err);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleOpenTask(e) {
    e.stopPropagation();
    router.push(
      `/workspace/${workspaceId}/project/${projectId}/task/${task.id}`
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border rounded-lg p-3 cursor-grab active:cursor-grabbing group",
        "hover:shadow-sm transition-shadow",
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg",
        isDeleting && "opacity-50"
      )}
      {...attributes}
      {...listeners}
    >
      {/* Task header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <p
          className="text-sm font-medium leading-snug flex-1 cursor-pointer hover:underline"
          onClick={handleOpenTask}
        >
          {task.title}
        </p>

        {canEdit && (
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              onClick={(e) => e.stopPropagation()}
            >
              <button className="h-6 w-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 hover:bg-accent transition-all shrink-0">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleOpenTask}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open task
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.map(({ label }) => (
            <span
              key={label.id}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          {/* Priority indicator */}
          {task.priority !== "NONE" && (
            <span
              className={cn(
                "text-xs font-medium",
                PRIORITY_COLORS[task.priority]
              )}
            >
              {PRIORITY_LABELS[task.priority]}
            </span>
          )}

          {/* Due date */}
          {task.dueDate && (
            <span
              className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-destructive" : "text-muted-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Comment count */}
          {task._count?.comments > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              {task._count.comments}
            </span>
          )}

          {/* Attachment count */}
          {task._count?.attachments > 0 && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="h-3 w-3" />
              {task._count.attachments}
            </span>
          )}

          {/* Assignee avatars */}
          {task.assignees && task.assignees.length > 0 && (
            <div className="flex -space-x-1.5">
              {task.assignees.slice(0, 3).map(({ user }) => (
                <Avatar
                  key={user.id}
                  className="h-5 w-5 border border-background"
                >
                  <AvatarImage src={user.image} alt={user.name} />
                  <AvatarFallback className="text-[10px]">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
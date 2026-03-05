"use client";

import { useState } from "react";
import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import KanbanTaskCard from "./KanbanTaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Plus, X } from "lucide-react";

/**
 * A single Kanban column.
 * Sortable via dnd-kit (can be dragged to reorder columns).
 * Contains a sortable list of task cards.
 */
export default function KanbanColumn({
  column,
  workspaceId,
  projectId,
  canEdit,
  canManageColumns,
  workspaceMembers,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  isDragging = false,
}) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addTaskLoading, setAddTaskLoading] = useState(false);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", column },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const taskIds = column.tasks.map((t) => t.id);

  async function handleAddTask(e) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAddTaskLoading(true);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTaskTitle,
            columnId: column.id,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) return;

      onTaskCreated(column.id, data.task);
      setNewTaskTitle("");
      setIsAddingTask(false);
    } catch (err) {
      console.error("Add task error:", err);
    } finally {
      setAddTaskLoading(false);
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col w-72 shrink-0 bg-muted/50 rounded-xl border",
        (isDragging || isSortableDragging) && "opacity-50"
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 p-3 border-b">
        {canManageColumns && (
          <button
            {...attributes}
            {...listeners}
            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: column.color }}
        />
        <span className="text-sm font-semibold flex-1 truncate">
          {column.name}
        </span>
        <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          {column.tasks.length}
        </span>
      </div>

      {/* Tasks list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[60px]">
        <SortableContext
          items={taskIds}
          strategy={verticalListSortingStrategy}
        >
          {column.tasks.map((task) => (
            <KanbanTaskCard
              key={task.id}
              task={task}
              workspaceId={workspaceId}
              projectId={projectId}
              canEdit={canEdit}
              workspaceMembers={workspaceMembers}
              onTaskUpdated={onTaskUpdated}
              onTaskDeleted={onTaskDeleted}
            />
          ))}
        </SortableContext>
      </div>

      {/* Add task */}
      {canEdit && (
        <div className="p-2 border-t">
          {isAddingTask ? (
            <form onSubmit={handleAddTask} className="space-y-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title"
                autoFocus
                className="text-sm"
              />
              <div className="flex gap-1">
                <Button
                  type="submit"
                  size="sm"
                  className="flex-1"
                  disabled={addTaskLoading || !newTaskTitle.trim()}
                >
                  {addTaskLoading ? "Adding..." : "Add task"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingTask(false);
                    setNewTaskTitle("");
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingTask(true)}
              className="flex items-center gap-2 w-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add task
            </button>
          )}
        </div>
      )}
    </div>
  );
}
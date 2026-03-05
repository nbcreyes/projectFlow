"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import KanbanColumn from "./KanbanColumn";
import KanbanTaskCard from "./KanbanTaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

/**
 * Main Kanban board component.
 * Manages all drag and drop logic for both columns and tasks.
 * Uses optimistic updates - the UI updates immediately and syncs to the server.
 */
export default function KanbanBoard({
  initialBoard,
  workspaceId,
  projectId,
  currentUserRole,
  workspaceMembers,
}) {
  const [columns, setColumns] = useState(initialBoard.columns);
  const [activeTask, setActiveTask] = useState(null);
  const [activeColumn, setActiveColumn] = useState(null);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [addColumnLoading, setAddColumnLoading] = useState(false);

  const canEdit = currentUserRole !== "VIEWER";
  const canManageColumns = ["OWNER", "ADMIN"].includes(currentUserRole);

  // Require pointer to move 8px before drag starts to avoid accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const columnIds = columns.map((col) => col.id);

  // Find which column a task belongs to
  function findColumnOfTask(taskId) {
    return columns.find((col) =>
      col.tasks.some((task) => task.id === taskId)
    );
  }

  function handleDragStart(event) {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === "column") {
      setActiveColumn(columns.find((col) => col.id === active.id));
      return;
    }

    if (activeData?.type === "task") {
      setActiveTask(activeData.task);
      return;
    }
  }

  function handleDragOver(event) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;

    const activeData = active.data.current;
    if (activeData?.type !== "task") return;

    const activeColumn = findColumnOfTask(activeId);
    const overColumn =
      columns.find((col) => col.id === overId) ||
      findColumnOfTask(overId);

    if (!activeColumn || !overColumn) return;
    if (activeColumn.id === overColumn.id) return;

    // Move task to new column optimistically
    setColumns((prev) => {
      const activeTask = activeColumn.tasks.find((t) => t.id === activeId);
      return prev.map((col) => {
        if (col.id === activeColumn.id) {
          return {
            ...col,
            tasks: col.tasks.filter((t) => t.id !== activeId),
          };
        }
        if (col.id === overColumn.id) {
          return {
            ...col,
            tasks: [...col.tasks, { ...activeTask, columnId: overColumn.id }],
          };
        }
        return col;
      });
    });
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    setActiveTask(null);
    setActiveColumn(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;
    const activeData = active.data.current;

    // Column reorder
    if (activeData?.type === "column") {
      if (activeId === overId) return;

      const oldIndex = columns.findIndex((col) => col.id === activeId);
      const newIndex = columns.findIndex((col) => col.id === overId);
      const reordered = arrayMove(columns, oldIndex, newIndex).map(
        (col, index) => ({ ...col, order: index })
      );

      setColumns(reordered);

      await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/columns`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            columns: reordered.map((col) => ({
              id: col.id,
              order: col.order,
            })),
          }),
        }
      );
      return;
    }

    // Task reorder within same column or confirm cross-column move
    if (activeData?.type === "task") {
      const activeColData = findColumnOfTask(activeId);
      if (!activeColData) return;

      const overTask = activeColData.tasks.find((t) => t.id === overId);
      const overColumn =
        columns.find((col) => col.id === overId) ||
        findColumnOfTask(overId);

      if (!overColumn) return;

      // Reorder within same column
      if (activeColData.id === overColumn.id && overTask) {
        const oldIndex = activeColData.tasks.findIndex(
          (t) => t.id === activeId
        );
        const newIndex = activeColData.tasks.findIndex(
          (t) => t.id === overId
        );
        const reorderedTasks = arrayMove(
          activeColData.tasks,
          oldIndex,
          newIndex
        ).map((task, index) => ({ ...task, order: index }));

        setColumns((prev) =>
          prev.map((col) =>
            col.id === activeColData.id
              ? { ...col, tasks: reorderedTasks }
              : col
          )
        );

        await fetch(
          `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/reorder`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tasks: reorderedTasks.map((t) => ({
                id: t.id,
                columnId: t.columnId,
                order: t.order,
              })),
            }),
          }
        );
        return;
      }

      // Persist cross-column move (already moved optimistically in dragOver)
      const updatedColumns = columns;
      const tasksToUpdate = [];
      updatedColumns.forEach((col) => {
        col.tasks.forEach((task, index) => {
          tasksToUpdate.push({
            id: task.id,
            columnId: col.id,
            order: index,
          });
        });
      });

      await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: tasksToUpdate }),
        }
      );
    }
  }

  function handleTaskCreated(columnId, newTask) {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, tasks: [...col.tasks, newTask] }
          : col
      )
    );
  }

  function handleTaskUpdated(updatedTask) {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.map((t) =>
          t.id === updatedTask.id ? { ...t, ...updatedTask } : t
        ),
      }))
    );
  }

  function handleTaskDeleted(taskId) {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }))
    );
  }

  async function handleAddColumn(e) {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    setAddColumnLoading(true);

    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/columns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newColumnName }),
        }
      );

      const data = await res.json();
      if (!res.ok) return;

      setColumns((prev) => [
        ...prev,
        { ...data.column, tasks: [] },
      ]);
      setNewColumnName("");
      setIsAddingColumn(false);
    } catch (err) {
      console.error("Add column error:", err);
    } finally {
      setAddColumnLoading(false);
    }
  }

  return (
    <div className="h-full overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-6 h-full items-start">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                workspaceId={workspaceId}
                projectId={projectId}
                canEdit={canEdit}
                canManageColumns={canManageColumns}
                workspaceMembers={workspaceMembers}
                onTaskCreated={handleTaskCreated}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
              />
            ))}
          </SortableContext>

          {/* Add column button */}
          {canManageColumns && (
            <div className="shrink-0 w-72">
              {isAddingColumn ? (
                <div className="bg-card border rounded-xl p-3 space-y-2">
                  <form onSubmit={handleAddColumn}>
                    <Input
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder="Column name"
                      autoFocus
                      className="mb-2"
                    />
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="sm"
                        disabled={addColumnLoading || !newColumnName.trim()}
                      >
                        {addColumnLoading ? "Adding..." : "Add column"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsAddingColumn(false);
                          setNewColumnName("");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingColumn(true)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl transition-colors border border-dashed"
                >
                  <Plus className="h-4 w-4" />
                  Add column
                </button>
              )}
            </div>
          )}
        </div>

        {/* Drag overlay - renders the dragged item at cursor position */}
        {typeof window !== "undefined" &&
          createPortal(
            <DragOverlay>
              {activeTask && (
                <KanbanTaskCard
                  task={activeTask}
                  isDragging
                />
              )}
              {activeColumn && (
                <KanbanColumn
                  column={activeColumn}
                  workspaceId={workspaceId}
                  projectId={projectId}
                  canEdit={false}
                  canManageColumns={false}
                  workspaceMembers={[]}
                  onTaskCreated={() => {}}
                  onTaskUpdated={() => {}}
                  onTaskDeleted={() => {}}
                  isDragging
                />
              )}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </div>
  );
}
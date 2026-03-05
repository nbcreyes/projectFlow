"use client";

import { useState, useRef } from "react";
import { timeAgo, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Pencil, Trash2, Check, X } from "lucide-react";

/**
 * Task comments component.
 * Handles posting, editing, and deleting comments.
 * Uses optimistic updates for instant feedback.
 */
export default function TaskComments({
  taskId,
  initialComments,
  currentUserId,
  currentUserRole,
  currentUser,
}) {
  const [comments, setComments] = useState(initialComments || []);
  const [newComment, setNewComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const textareaRef = useRef(null);

  const canManage = ["OWNER", "ADMIN"].includes(currentUserRole);

  async function handlePost(e) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsPosting(true);

    // Optimistic update — add comment to UI immediately
    const optimisticComment = {
      id: `optimistic-${Date.now()}`,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authorId: currentUserId,
      author: currentUser,
      reactions: [],
    };

    setComments((prev) => [...prev, optimisticComment]);
    setNewComment("");

    try {
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: optimisticComment.content }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Rollback optimistic update on failure
        setComments((prev) =>
          prev.filter((c) => c.id !== optimisticComment.id)
        );
        setNewComment(optimisticComment.content);
        return;
      }

      // Replace optimistic comment with real one from server
      setComments((prev) =>
        prev.map((c) =>
          c.id === optimisticComment.id ? data.comment : c
        )
      );
    } catch (err) {
      setComments((prev) =>
        prev.filter((c) => c.id !== optimisticComment.id)
      );
      setNewComment(optimisticComment.content);
      console.error("Post comment error:", err);
    } finally {
      setIsPosting(false);
    }
  }

  function startEdit(comment) {
    setEditingId(comment.id);
    setEditContent(comment.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditContent("");
  }

  async function handleEdit(commentId) {
    if (!editContent.trim()) return;
    setIsSavingEdit(true);

    try {
      const res = await fetch(
        `/api/tasks/${taskId}/comments/${commentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: editContent }),
        }
      );

      const data = await res.json();

      if (!res.ok) return;

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? data.comment : c))
      );
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      console.error("Edit comment error:", err);
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDelete(commentId) {
    if (!confirm("Delete this comment?")) return;

    setDeletingId(commentId);

    // Optimistic delete
    const deleted = comments.find((c) => c.id === commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      const res = await fetch(
        `/api/tasks/${taskId}/comments/${commentId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        // Rollback on failure
        setComments((prev) => {
          const index = prev.findIndex(
            (c) => new Date(c.createdAt) > new Date(deleted.createdAt)
          );
          if (index === -1) return [...prev, deleted];
          const next = [...prev];
          next.splice(index, 0, deleted);
          return next;
        });
      }
    } catch (err) {
      console.error("Delete comment error:", err);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comments list */}
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map((comment) => {
            const isAuthor = comment.authorId === currentUserId;
            const canDelete = isAuthor || canManage;
            const isEditing = editingId === comment.id;
            const isOptimistic = comment.id.startsWith("optimistic-");

            return (
              <div
                key={comment.id}
                className={`flex gap-3 ${isOptimistic ? "opacity-60" : ""}`}
              >
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarImage src={comment.author?.image} />
                  <AvatarFallback className="text-xs">
                    {getInitials(comment.author?.name)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {comment.author?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {timeAgo(comment.createdAt)}
                    </span>
                    {comment.updatedAt !== comment.createdAt && (
                      <span className="text-xs text-muted-foreground">
                        (edited)
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="min-h-[80px] text-sm resize-none"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Escape") cancelEdit();
                          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                            handleEdit(comment.id);
                          }
                        }}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="h-7"
                          onClick={() => handleEdit(comment.id)}
                          disabled={
                            isSavingEdit || !editContent.trim()
                          }
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          {isSavingEdit ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7"
                          onClick={cancelEdit}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group/comment relative">
                      <p className="text-sm whitespace-pre-wrap">
                        {comment.content}
                      </p>
                      {!isOptimistic && (
                        <div className="flex items-center gap-1 mt-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                          {isAuthor && (
                            <button
                              onClick={() => startEdit(comment)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1.5 py-0.5 rounded hover:bg-accent"
                            >
                              <Pencil className="h-3 w-3" />
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(comment.id)}
                              disabled={deletingId === comment.id}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-1.5 py-0.5 rounded hover:bg-destructive/10"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New comment form */}
      {currentUserRole !== "VIEWER" && (
        <form onSubmit={handlePost} className="flex gap-3">
          <Avatar className="h-7 w-7 shrink-0 mt-0.5">
            <AvatarImage src={currentUser?.image} />
            <AvatarFallback className="text-xs">
              {getInitials(currentUser?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              ref={textareaRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Leave a comment... (Ctrl+Enter to submit)"
              className="min-h-[80px] text-sm resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  handlePost(e);
                }
              }}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isPosting || !newComment.trim()}
            >
              {isPosting ? "Posting..." : "Comment"}
            </Button>
          </div>
        </form>
      )}

      {comments.length === 0 && currentUserRole === "VIEWER" && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet.
        </p>
      )}
    </div>
  );
}
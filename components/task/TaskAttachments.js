"use client";

import { useState, useRef } from "react";
import { formatDate, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Paperclip,
  Upload,
  Trash2,
  Download,
  FileText,
  FileImage,
  File,
  X,
} from "lucide-react";

function FileIcon({ mimeType, className }) {
  if (mimeType?.startsWith("image/")) {
    return <FileImage className={className} />;
  }
  if (mimeType === "application/pdf" || mimeType?.includes("document")) {
    return <FileText className={className} />;
  }
  return <File className={className} />;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Task attachments component.
 * Handles file upload, display, and deletion.
 */
export default function TaskAttachments({
  taskId,
  initialAttachments,
  canEdit,
  currentUserId,
  currentUserRole,
}) {
  const [attachments, setAttachments] = useState(initialAttachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  const canManage = ["OWNER", "ADMIN"].includes(currentUserRole);

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        return;
      }

      setAttachments((prev) => [data.attachment, ...prev]);
    } catch (err) {
      setUploadError("Something went wrong. Please try again.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDelete(attachmentId) {
    if (!confirm("Delete this attachment? This cannot be undone.")) return;

    setDeletingId(attachmentId);
    try {
      const res = await fetch(
        `/api/tasks/${taskId}/attachments/${attachmentId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete attachment");
        return;
      }

      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">
            Attachments ({attachments.length})
          </h3>
        </div>

        {canEdit && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Upload className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                  Upload file
                </>
              )}
            </Button>
          </>
        )}
      </div>

      {uploadError && (
        <div className="flex items-center justify-between bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError("")}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {attachments.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center">
          <Paperclip className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No attachments yet.</p>
          {canEdit && (
            <p className="text-xs text-muted-foreground mt-1">
              Upload files up to 10MB.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const isImage = attachment.mimeType?.startsWith("image/");
            const canDelete =
              canManage || attachment.uploadedById === currentUserId;

            return (
              <div
                key={attachment.id}
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/30 transition-colors group"
              >
                {isImage ? (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="h-10 w-10 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0">
                    <FileIcon
                      mimeType={attachment.mimeType}
                      className="h-5 w-5 text-muted-foreground"
                    />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {attachment.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(attachment.size)}</span>
                    <span>·</span>
                    <span>{formatDate(attachment.createdAt)}</span>
                    {attachment.uploadedBy && (
                      <>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                          <Avatar className="h-3.5 w-3.5">
                            <AvatarImage src={attachment.uploadedBy.image} />
                            <AvatarFallback className="text-[8px]">
                              {getInitials(attachment.uploadedBy.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{attachment.uploadedBy.name}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(attachment.id)}
                      disabled={deletingId === attachment.id}
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
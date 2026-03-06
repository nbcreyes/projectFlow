"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Workspace settings client component.
 * Handles general settings update and workspace deletion.
 */
export default function WorkspaceSettingsClient({
  workspace,
  role,
  memberCount,
  projectCount,
}) {
  const router = useRouter();
  const isOwner = role === "OWNER";
  const canEdit = ["OWNER", "ADMIN"].includes(role);

  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);
  const [description, setDescription] = useState(workspace.description || "");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState({ type: "", text: "" });

  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState({ type: "", text: "" });

  async function handleSave(e) {
    e.preventDefault();
    setSaveLoading(true);
    setSaveMsg({ type: "", text: "" });

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, description }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSaveMsg({ type: "error", text: data.error });
        return;
      }

      setSaveMsg({ type: "success", text: "Workspace updated successfully." });
      router.refresh();
    } catch {
      setSaveMsg({ type: "error", text: "Something went wrong." });
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleDelete(e) {
    e.preventDefault();

    if (deleteConfirm !== workspace.name) {
      setDeleteMsg({ type: "error", text: "Workspace name does not match." });
      return;
    }

    setDeleteLoading(true);
    setDeleteMsg({ type: "", text: "" });

    try {
      const res = await fetch(`/api/workspaces/${workspace.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        setDeleteMsg({ type: "error", text: data.error });
        return;
      }

      await signOut({ callbackUrl: "/onboarding" });
    } catch {
      setDeleteMsg({ type: "error", text: "Something went wrong." });
    } finally {
      setDeleteLoading(false);
    }
  }

  function Feedback({ msg }) {
    if (!msg.text) return null;
    return (
      <p className={`text-sm mt-2 ${msg.type === "error" ? "text-destructive" : "text-green-600"}`}>
        {msg.text}
      </p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Workspace settings</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your workspace configuration.
        </p>
      </div>

      <Separator />

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{memberCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Members</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{projectCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Projects</p>
          </div>
          <div className="ml-auto">
            <Badge variant="outline" className="capitalize">
              {role.toLowerCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* General settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Update your workspace name, URL slug, and description.
            {!canEdit && " You need Admin or Owner role to edit these settings."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wsName">Workspace name</Label>
              <Input
                id="wsName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Workspace"
                disabled={!canEdit}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wsSlug">URL slug</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">
                  projectflow.app/
                </span>
                <Input
                  id="wsSlug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="my-workspace"
                  disabled={!canEdit}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wsDescription">Description</Label>
              <Textarea
                id="wsDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this workspace for?"
                rows={3}
                disabled={!canEdit}
                className="resize-none"
              />
            </div>

            {canEdit && (
              <>
                <Feedback msg={saveMsg} />
                <Button type="submit" disabled={saveLoading}>
                  {saveLoading ? "Saving..." : "Save changes"}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Danger zone */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Permanently delete this workspace and all its projects, tasks, and
              data. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleDelete} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deleteConfirm">
                  Type <span className="font-semibold">{workspace.name}</span> to
                  confirm
                </Label>
                <Input
                  id="deleteConfirm"
                  value={deleteConfirm}
                  onChange={(e) => {
                    setDeleteConfirm(e.target.value);
                    setDeleteMsg({ type: "", text: "" });
                  }}
                  placeholder={workspace.name}
                />
              </div>
              <Feedback msg={deleteMsg} />
              <Button
                type="submit"
                variant="destructive"
                disabled={deleteLoading || deleteConfirm !== workspace.name}
              >
                {deleteLoading ? "Deleting..." : "Delete workspace"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

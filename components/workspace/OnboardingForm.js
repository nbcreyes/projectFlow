"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Onboarding form shown to new users after registration.
 * Creates their first workspace and redirects them into it.
 */
export default function OnboardingForm({ user }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create workspace");
        return;
      }

      router.push(`/workspace/${data.workspace.id}`);
      router.refresh();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">
          Welcome, {user?.name?.split(" ")[0]}
        </CardTitle>
        <CardDescription>
          Let us set up your first workspace. You can change this later.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="workspaceName">Workspace name</Label>
            <Input
              id="workspaceName"
              type="text"
              placeholder="Acme Inc. or My Projects"
              value={workspaceName}
              onChange={(e) => {
                setError("");
                setWorkspaceName(e.target.value);
              }}
              disabled={isLoading}
              required
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              This is usually your company name or team name.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !workspaceName.trim()}>
            {isLoading ? "Creating workspace..." : "Create workspace"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

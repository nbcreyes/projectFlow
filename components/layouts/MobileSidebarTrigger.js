"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Sidebar from "@/components/layouts/Sidebar";

export default function MobileSidebarTrigger({ workspaces, currentWorkspaceId, user }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden fixed top-3 left-3 z-50">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9 bg-background shadow-sm">
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <VisuallyHidden>
            <SheetTitle>Navigation</SheetTitle>
          </VisuallyHidden>
          <Sidebar
            workspaces={workspaces}
            currentWorkspaceId={currentWorkspaceId}
            user={user}
            onNavigate={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
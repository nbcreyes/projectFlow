"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, timeAgo, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  CheckSquare,
  MessageSquare,
  Users,
  Check,
  Trash2,
  BellOff,
} from "lucide-react";

const TYPE_CONFIG = {
  TASK_ASSIGNED: {
    icon: CheckSquare,
    className: "text-blue-500",
  },
  COMMENT_ADDED: {
    icon: MessageSquare,
    className: "text-green-500",
  },
  MEMBER_ADDED: {
    icon: Users,
    className: "text-purple-500",
  },
  TASK_DUE_SOON: {
    icon: CheckSquare,
    className: "text-orange-500",
  },
  TASK_OVERDUE: {
    icon: CheckSquare,
    className: "text-red-500",
  },
};

/**
 * Notifications page client component.
 * Handles mark as read, mark all read, delete, and navigation.
 */
export default function NotificationsClient({
  initialNotifications,
  initialUnreadCount,
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  async function handleMarkRead(notificationId) {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    await fetch(`/api/notifications/${notificationId}`, {
      method: "PATCH",
    });
  }

  async function handleDelete(notificationId) {
    const notification = notifications.find((n) => n.id === notificationId);
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    if (!notification.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    await fetch(`/api/notifications/${notificationId}`, {
      method: "DELETE",
    });
  }

  async function handleMarkAllRead() {
    setIsMarkingAll(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    await fetch("/api/notifications", { method: "PATCH" });
    setIsMarkingAll(false);
  }

  async function handleNotificationClick(notification) {
    if (!notification.isRead) {
      await handleMarkRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {unreadCount > 0
              ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
              : "All caught up"}
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        )}
      </div>

      <Separator />

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <BellOff className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-medium mb-1">No notifications</h3>
          <p className="text-sm text-muted-foreground">
            You are all caught up. Notifications will appear here when
            someone assigns you a task or comments on your work.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map((notification) => {
            const config =
              TYPE_CONFIG[notification.type] || TYPE_CONFIG.TASK_ASSIGNED;
            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg transition-colors group cursor-pointer",
                  notification.isRead
                    ? "hover:bg-muted/30"
                    : "bg-blue-50/50 hover:bg-blue-50 border border-blue-100"
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Triggered by avatar */}
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={notification.triggeredBy?.image} />
                    <AvatarFallback className="text-sm">
                      {getInitials(notification.triggeredBy?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-background flex items-center justify-center",
                    )}
                  >
                    <Icon className={cn("h-2.5 w-2.5", config.className)} />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {notification.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {timeAgo(notification.createdAt)}
                  </p>
                </div>

                {/* Unread dot + actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                  )}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {!notification.isRead && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(notification.id);
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(notification.id);
                      }}
                      className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { timeAgo, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckSquare,
  MessageSquare,
  Paperclip,
  Tag,
  UserPlus,
  UserMinus,
  Pencil,
  Trash2,
  Plus,
  ArrowRight,
  Activity,
} from "lucide-react";

const TYPE_CONFIG = {
  TASK_CREATED:    { icon: Plus,          color: "text-green-500",  bg: "bg-green-50" },
  TASK_UPDATED:    { icon: Pencil,         color: "text-blue-500",   bg: "bg-blue-50" },
  TASK_DELETED:    { icon: Trash2,         color: "text-red-500",    bg: "bg-red-50" },
  TASK_MOVED:      { icon: ArrowRight,     color: "text-purple-500", bg: "bg-purple-50" },
  TASK_ASSIGNED:   { icon: UserPlus,       color: "text-blue-500",   bg: "bg-blue-50" },
  TASK_UNASSIGNED: { icon: UserMinus,      color: "text-orange-500", bg: "bg-orange-50" },
  TASK_COMPLETED:  { icon: CheckSquare,    color: "text-green-500",  bg: "bg-green-50" },
  COMMENT_ADDED:   { icon: MessageSquare,  color: "text-slate-500",  bg: "bg-slate-50" },
  ATTACHMENT_ADDED:{ icon: Paperclip,      color: "text-yellow-500", bg: "bg-yellow-50" },
  LABEL_ADDED:     { icon: Tag,            color: "text-pink-500",   bg: "bg-pink-50" },
  LABEL_REMOVED:   { icon: Tag,            color: "text-muted-foreground", bg: "bg-muted" },
  PROJECT_CREATED: { icon: Plus,           color: "text-green-500",  bg: "bg-green-50" },
  PROJECT_UPDATED: { icon: Pencil,         color: "text-blue-500",   bg: "bg-blue-50" },
  MEMBER_ADDED:    { icon: UserPlus,       color: "text-purple-500", bg: "bg-purple-50" },
};

/**
 * Activity feed component.
 * Fetches and displays a chronological log of events.
 * Works for both task-level and project-level feeds.
 *
 * @param {string} fetchUrl - The API URL to fetch activities from
 * @param {boolean} showTask - Whether to show the task name in each entry
 */
export default function ActivityFeed({ fetchUrl, showTask = false }) {
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(fetchUrl);
        const data = await res.json();
        if (res.ok) setActivities(data.activities);
      } catch (err) {
        console.error("Load activity error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [fetchUrl]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="h-7 w-7 rounded-full bg-muted shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-2.5 bg-muted rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const config = TYPE_CONFIG[activity.type] || TYPE_CONFIG.TASK_UPDATED;
        const Icon = config.icon;
        const isLast = index === activities.length - 1;

        return (
          <div key={activity.id} className="flex gap-3">
            {/* Timeline line + icon */}
            <div className="flex flex-col items-center">
              <div
                className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${config.bg}`}
              >
                <Icon className={`h-3.5 w-3.5 ${config.color}`} />
              </div>
              {!isLast && (
                <div className="w-px flex-1 bg-border mt-1 mb-1 min-h-[12px]" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 pb-3 min-w-0">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5 shrink-0">
                  <AvatarImage src={activity.user?.image} />
                  <AvatarFallback className="text-[9px]">
                    {getInitials(activity.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm">
                  <span className="font-medium">{activity.user?.name}</span>{" "}
                  <span className="text-muted-foreground">
                    {activity.description}
                  </span>
                  {showTask && activity.task && (
                    <span className="text-muted-foreground">
                      {" "}— <span className="text-foreground font-medium">{activity.task.title}</span>
                    </span>
                  )}
                </p>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 ml-7">
                {timeAgo(activity.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
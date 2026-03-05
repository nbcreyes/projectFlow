"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const PRIORITY_COLORS = {
  URGENT: "bg-red-500",
  HIGH: "bg-orange-500",
  MEDIUM: "bg-yellow-500",
  LOW: "bg-blue-400",
  NONE: "bg-muted-foreground",
};

/**
 * Builds a 6-week grid for the given month.
 * Each cell is either null (padding) or a Date object.
 */
function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const grid = [];

  for (let i = 0; i < firstDay; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    grid.push(new Date(year, month, d));
  }
  while (grid.length % 7 !== 0) grid.push(null);

  return grid;
}

/**
 * Calendar view component.
 * Shows tasks plotted on a monthly grid by due date.
 */
export default function CalendarView({
  initialTasks,
  workspaceId,
  projectId,
  currentUserRole,
}) {
  const router = useRouter();
  const today = new Date();

  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const grid = buildCalendarGrid(currentYear, currentMonth);

  // Index tasks by their due date string (YYYY-MM-DD)
  const tasksByDate = {};
  const tasksWithoutDueDate = [];

  initialTasks.forEach((task) => {
    if (!task.dueDate) {
      tasksWithoutDueDate.push(task);
      return;
    }
    const date = new Date(task.dueDate);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!tasksByDate[key]) tasksByDate[key] = [];
    tasksByDate[key].push(task);
  });

  function goToPrevMonth() {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  }

  function goToToday() {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }

  function isToday(date) {
    if (!date) return false;
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  function getTasksForDate(date) {
    if (!date) return [];
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return tasksByDate[key] || [];
  }

  function isOverdue(task) {
    if (!task.dueDate || task.status === "DONE") return false;
    return new Date(task.dueDate) < today;
  }

  return (
    <div className="h-full overflow-auto flex">
      {/* Main calendar */}
      <div className="flex-1 flex flex-col p-6 min-w-0">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="text-xs font-medium text-muted-foreground text-center py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 flex-1 border-l border-t">
          {grid.map((date, index) => {
            const dayTasks = getTasksForDate(date);
            const isCurrentMonth =
              date && date.getMonth() === currentMonth;
            const isTodayDate = isToday(date);

            return (
              <div
                key={index}
                className={cn(
                  "border-r border-b min-h-[100px] p-1.5",
                  !isCurrentMonth && "bg-muted/20",
                  isTodayDate && "bg-blue-50/50"
                )}
              >
                {date && (
                  <>
                    {/* Date number */}
                    <div className="flex justify-end mb-1">
                      <span
                        className={cn(
                          "text-xs font-medium h-6 w-6 flex items-center justify-center rounded-full",
                          isTodayDate
                            ? "bg-primary text-primary-foreground"
                            : isCurrentMonth
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {date.getDate()}
                      </span>
                    </div>

                    {/* Task chips - show max 3 then +N */}
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 3).map((task) => (
                        <button
                          key={task.id}
                          onClick={() =>
                            router.push(
                              `/workspace/${workspaceId}/project/${projectId}/task/${task.id}`
                            )
                          }
                          className={cn(
                            "w-full text-left flex items-center gap-1 px-1.5 py-0.5 rounded text-xs truncate transition-opacity hover:opacity-80",
                            isOverdue(task)
                              ? "bg-red-100 text-red-700"
                              : task.status === "DONE"
                              ? "bg-green-100 text-green-700"
                              : "bg-accent text-accent-foreground"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              PRIORITY_COLORS[task.priority]
                            )}
                          />
                          <span className="truncate">{task.title}</span>
                        </button>
                      ))}
                      {dayTasks.length > 3 && (
                        <p className="text-xs text-muted-foreground px-1">
                          +{dayTasks.length - 3} more
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sidebar - tasks without due date */}
      <div className="w-64 shrink-0 border-l p-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">No due date</h3>
          <span className="text-xs text-muted-foreground ml-auto">
            {tasksWithoutDueDate.length}
          </span>
        </div>

        {tasksWithoutDueDate.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            All tasks have a due date.
          </p>
        ) : (
          <div className="space-y-2">
            {tasksWithoutDueDate.map((task) => (
              <button
                key={task.id}
                onClick={() =>
                  router.push(
                    `/workspace/${workspaceId}/project/${projectId}/task/${task.id}`
                  )
                }
                className="w-full text-left p-2 rounded-lg border hover:bg-accent transition-colors"
              >
                <p className="text-sm font-medium truncate">{task.title}</p>
                <div className="flex items-center justify-between mt-1">
                  {task.column && (
                    <span className="text-xs text-muted-foreground truncate">
                      {task.column.name}
                    </span>
                  )}
                  <div className="flex -space-x-1 ml-auto">
                    {task.assignees?.slice(0, 2).map(({ user }) => (
                      <Avatar
                        key={user.id}
                        className="h-4 w-4 border border-background"
                      >
                        <AvatarImage src={user.image} />
                        <AvatarFallback className="text-[8px]">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { ChevronLeft, ChevronRight, Flame, Trash2 } from "lucide-react";
import { useState } from "react";

import { calculateStreak } from "@/lib/streak";
import { Task } from "@/lib/types";

interface CompletionCalendarProps {
  task: Task;
  onToggleDate?: (date: string, completed: boolean) => void;
  onClearProgress?: () => void;
}

export function CompletionCalendar({
  task,
  onToggleDate,
  onClearProgress,
}: CompletionCalendarProps) {
  const [offset, setOffset] = useState(0);

  if (!task.isDaily) return null;
  const completionHistory = task.completionHistory || {};

  const getTotalCompletions = () => {
    return Object.keys(completionHistory).length;
  };

  // Generate 7 days ending at (today - offset)
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - offset);

  const days: {
    date: string;
    completed: boolean;
    dayOfMonth: number;
    dayOfWeek: string;
    isToday: boolean;
  }[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    days.push({
      date: dateStr,
      completed: completionHistory[dateStr] === true,
      dayOfMonth: date.getDate(),
      dayOfWeek: date.toLocaleDateString("en-US", { weekday: "short" }),
      isToday: dateStr === today,
    });
  }

  const handleDayClick = (day: (typeof days)[0]) => {
    if (onToggleDate) {
      onToggleDate(day.date, !day.completed);
    }
  };

  const goToPrevious = () => {
    setOffset(offset + 7);
  };

  const goToNext = () => {
    setOffset(Math.max(0, offset - 7));
  };

  const canGoNext = offset > 0;

  return (
    <div className="space-y-4">
      {/* Header with streak, total, and clear button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            <div className="text-l font-medium">{calculateStreak(task)}</div>
            <div className="text-m font-medium">Day Streak</div>
          </div>
          <div className="text-muted-foreground text-sm">
            • {getTotalCompletions()} total
          </div>
        </div>
        {onClearProgress && (
          <button
            onClick={onClearProgress}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Clear all progress"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Left arrow */}
        <button
          onClick={goToPrevious}
          className="hover:bg-muted rounded p-1 transition-colors"
          aria-label="Previous week"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Days grid */}
        <div className="flex flex-1 justify-center gap-2">
          {days.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-1">
              {/* Dot */}
              <button
                onClick={() => handleDayClick(day)}
                className={`h-5 w-5 rounded-full border-2 transition-all hover:scale-110 ${
                  day.completed
                    ? "border-green-600 bg-green-500"
                    : "bg-muted border-border"
                } ${day.isToday ? "ring-primary ring-2 ring-offset-1" : ""}`}
                title={`${day.date}${day.completed ? " ✓" : ""}`}
              />
              {/* Day of month */}
              <div
                className={`text-xs font-medium ${day.isToday ? "text-primary" : ""}`}
              >
                {day.dayOfMonth}
              </div>
              {/* Day of week */}
              <div className="text-muted-foreground text-xs">
                {day.dayOfWeek}
              </div>
            </div>
          ))}
        </div>

        {/* Right arrow */}
        <button
          onClick={goToNext}
          disabled={!canGoNext}
          className={`rounded p-1 transition-colors ${
            canGoNext ? "hover:bg-muted" : "cursor-not-allowed opacity-30"
          }`}
          aria-label="Next week"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="text-muted-foreground mt-3 flex items-center justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="bg-muted border-border h-3 w-3 rounded-full border-2" />
          <span>Incomplete</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full border-2 border-green-600 bg-green-500" />
          <span>Completed</span>
        </div>
      </div>
    </div>
  );
}

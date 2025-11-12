"use client";

import { Calendar, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
  onClick?: (task: Task) => void;
  onDoubleClick?: (task: Task) => void;
  isDaily?: boolean;
  hideDelete?: boolean;
}

const formatTime = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes === 0
    ? `${hours}h`
    : `${hours}h ${remainingMinutes}m`;
};

export const TaskItem = ({
  task,
  onToggle,
  onDelete,
  onUpdate,
  onClick,
  onDoubleClick,
  isDaily = false,
  hideDelete = false,
}: TaskItemProps) => {
  const { tags } = useTasks();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [clickTimeout, setClickTimeout] = useState<NodeJS.Timeout | null>(null);
  const isDue = task.dueDate && new Date(task.dueDate) < new Date();

  // For daily tasks, check if completed today
  const today = new Date().toISOString().split("T")[0];
  const isCompletedToday =
    task.isDaily && task.completionHistory?.[today] === true;
  const displayCompleted = task.isDaily ? isCompletedToday : task.completed;

  const getTagsForTask = () => {
    if (!task?.tags) return [];
    return task.tags
      .map((tagId) => tags.find((t) => t.id === tagId))
      .filter(Boolean);
  };

  const playSound = () => {
    const audio = new Audio("/media/water-drip2.mp3");
    audio.play().catch((err) => console.log("Audio play failed:", err));
  };

  useEffect(() => {
    setEditTitle(task.title);
  }, [task.title]);

  useEffect(() => {
    setIsEditingTitle(false);
  }, [task.id]);

  const handleTitleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    setIsEditingTitle(true);
  };

  const handleTitleSave = () => {
    if (editTitle.trim() && editTitle.trim() !== task.title) {
      onUpdate(task.id, { title: editTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setEditTitle(task.title);
    setIsEditingTitle(false);
  };

  const handleClick = () => {
    if (isEditingTitle) return;

    // Clear any existing timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }

    // Set a timeout for single click
    const timeout = setTimeout(() => {
      onClick?.(task);
      setClickTimeout(null);
    }, 250); // 250ms delay to detect double-click

    setClickTimeout(timeout);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isEditingTitle) return;

    // Clear the single click timeout
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }

    // Trigger focus mode
    onDoubleClick?.(task);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeout) {
        clearTimeout(clickTimeout);
      }
    };
  }, [clickTimeout]);

  return (
    <div
      className={cn(
        "hover:bg-muted/50 flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
        displayCompleted && "opacity-60",
        isDaily && "border-blue-200 bg-blue-50/50",
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isEditingTitle) {
          e.preventDefault();
          onClick?.(task);
        }
      }}
      role="button"
      tabIndex={0}
    >
      <input
        type="checkbox"
        checked={displayCompleted}
        onChange={(e) => {
          e.stopPropagation();
          playSound();
          onToggle(task.id, e.target.checked);
        }}
        onClick={(e) => e.stopPropagation()}
        className="rounded"
      />

      <div className="min-w-0 flex-1">
        {isEditingTitle ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTitleSave();
            }}
            className="mb-1"
          >
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full border-none bg-transparent p-0 font-medium outline-none"
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleTitleCancel();
                }
              }}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </form>
        ) : (
          <div
            className={cn(
              "hover:bg-muted/20 -mx-1 cursor-pointer rounded px-1 font-medium",
              displayCompleted && "line-through",
            )}
            onClick={handleTitleClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleTitleClick(e);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Click to edit task title"
          >
            {task.title}
          </div>
        )}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {task.dueDate && (
            <div
              className={cn(
                "flex items-center gap-1 text-xs",
                isDue ? "text-red-500" : "text-muted-foreground",
              )}
            >
              <Calendar className="h-3 w-3" />
              {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}

          {task.timePeriod && (
            <div className="text-muted-foreground bg-muted rounded px-2 py-1 text-xs">
              {formatTime(task.timePeriod)}
            </div>
          )}

          {task.isDaily && (
            <div className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-600">
              Daily
            </div>
          )}

          {getTagsForTask().map(
            (tag) =>
              tag && (
                <div
                  key={tag.id}
                  className="bg-primary/10 text-primary rounded px-2 py-1 text-xs font-medium"
                  style={
                    tag.color
                      ? { backgroundColor: `${tag.color}20`, color: tag.color }
                      : undefined
                  }
                >
                  {tag.name}
                </div>
              ),
          )}
        </div>

        {task.description && (
          <div className="text-muted-foreground prose prose-sm dark:prose-invert mt-1 line-clamp-2 max-w-none text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {task.description}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {!hideDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(task.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

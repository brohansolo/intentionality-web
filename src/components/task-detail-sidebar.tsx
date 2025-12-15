"use client";

import { Calendar, Clock, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { CompletionCalendar } from "@/components/completion-calendar";
import { FocusMode } from "@/components/focus-mode";
import { TagSelector } from "@/components/tag-selector";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { createShortcutHandler } from "@/lib/keyboard-utils";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TaskDetailSidebarProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

export const TaskDetailSidebar = ({
  task,
  onClose,
  onUpdate,
}: TaskDetailSidebarProps) => {
  const {
    projects,
    getActiveProjects,
    addToToday,
    removeFromToday,
    isInToday,
    getTaskTagIds: getTaskTags,
    addTagToTask,
    removeTagFromTask,
    deleteTask,
  } = useTasks();
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [timePeriod, setTimePeriod] = useState(task?.timePeriod || "");
  const [isDaily, setIsDaily] = useState(task?.isDaily || false);
  const [projectId, setProjectId] = useState(task?.projectId || "");
  const [showFocusMode, setShowFocusMode] = useState(false);

  // Update state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setDueDate(task.dueDate || "");
      setTimePeriod(task.timePeriod?.toString() || "");
      setIsDaily(task.isDaily || false);
      setProjectId(task.projectId || "");
    }
  }, [task]);

  // Auto-resize textarea on mount and when title changes
  useEffect(() => {
    const textarea = document.getElementById(
      "task-title",
    ) as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  }, [title, task]);

  const handleClose = useCallback(() => {
    // Save any pending changes before closing
    if (task) {
      const updates: Partial<Task> = {
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: dueDate || undefined,
        timePeriod: timePeriod ? Number(timePeriod) : undefined,
        isDaily,
        projectId: projectId || undefined,
      };
      onUpdate(task.id, updates);
    }
    onClose();
  }, [
    task,
    title,
    description,
    dueDate,
    timePeriod,
    isDaily,
    projectId,
    onUpdate,
    onClose,
  ]);

  useEffect(() => {
    if (!task) return;

    const handleKeyDown = createShortcutHandler([
      {
        key: "Escape",
        handler: () => handleClose(),
        allowInInput: true, // Allow Escape to close even when in input fields
        description: "Close task detail sidebar",
      },
    ]);

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [task, handleClose]);

  if (!task) return null;

  if (showFocusMode) {
    return (
      <FocusMode
        task={task}
        onClose={() => setShowFocusMode(false)}
        onUpdate={onUpdate}
      />
    );
  }

  const handleSave = () => {
    if (!task) return;
    const updates: Partial<Task> = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      timePeriod: timePeriod ? Number(timePeriod) : undefined,
      isDaily,
      projectId: projectId || undefined,
    };
    onUpdate(task.id, updates);
    onClose();
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes === 0
      ? `${hours}h`
      : `${hours}h ${remainingMinutes}m`;
  };

  const handleAddTag = (tagId: string) => {
    if (!task) return;
    addTagToTask(task.id, tagId);
    // const currentTags = task.tags || [];
    // if (!currentTags.includes(tagId)) {
    //   onUpdate(task.id, { tags: [...currentTags, tagId] });
    // }
  };

  const handleRemoveTag = (tagId: string) => {
    if (!task) return;
    removeTagFromTask(task.id, tagId);
  };

  const handleToggleDate = (date: string, completed: boolean) => {
    if (!task) return;
    const updatedHistory = {
      ...(task.completionHistory || {}),
    };

    if (completed) {
      updatedHistory[date] = true;
    } else {
      delete updatedHistory[date];
    }

    onUpdate(task.id, { completionHistory: updatedHistory });
  };

  const handleClearProgress = () => {
    if (!task) return;
    if (
      window.confirm(
        "Are you sure you want to clear all completion history? This cannot be undone.",
      )
    ) {
      onUpdate(task.id, { completionHistory: {} });
    }
  };

  const handleDelete = () => {
    if (!task) return;
    if (
      window.confirm(
        "Are you sure you want to delete this task? This cannot be undone.",
      )
    ) {
      deleteTask(task.id);
      onClose();
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/20"
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            handleClose();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Close task details"
      />

      {/* Sidebar */}
      <div className="bg-background fixed top-0 right-0 z-50 h-full w-96 overflow-y-auto border-l shadow-lg">
        <div className="p-6">
          {/* Header */}
          <div className="mb-1 flex items-start justify-between">
            <textarea
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-med flex-1 resize-none overflow-hidden rounded-sm font-semibold hover:cursor-text"
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="text-muted-foreground mb-2 text-sm font-medium">
            <span className="font-sm">Created: </span>
            {new Date(task.createdAt).toLocaleDateString()}
          </div>

          {/* Tags */}
          <div className="mb-3">
            <TagSelector
              currentTags={getTaskTags(task.id)}
              onAddTag={handleAddTag}
              onRemoveTag={handleRemoveTag}
            />
          </div>

          {/* Project Assignment */}
          <div className="mb-4">
            <label
              htmlFor="task-project"
              className="mb-2 block text-sm font-medium"
            >
              Project
            </label>
            <select
              id="task-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-md border p-3"
            >
              <option value="">No project</option>
              {getActiveProjects().map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <div className="mb-3">
              {/* Due Date - only for non-daily tasks */}
              {!task.isDaily && (
                <div>
                  <label
                    htmlFor="task-due-date"
                    className="mb-2 block flex items-center gap-2 text-sm font-medium"
                  >
                    <Calendar className="h-4 w-4" />
                    Due Date
                  </label>
                  <input
                    id="task-due-date"
                    type="date"
                    value={
                      dueDate
                        ? typeof dueDate === "string"
                          ? dueDate.split("T")[0]
                          : ""
                        : ""
                    }
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-md border p-3"
                  />
                  {dueDate && (
                    <button
                      onClick={() => setDueDate("")}
                      className="text-muted-foreground hover:text-foreground mt-1 text-xs"
                    >
                      Remove due date
                    </button>
                  )}
                </div>
              )}

              {/* Streak and Calendar for Daily Tasks */}
              {task.isDaily && (
                <div className="rounded-lg border p-4">
                  <CompletionCalendar
                    task={task}
                    onToggleDate={handleToggleDate}
                    onClearProgress={handleClearProgress}
                  />
                </div>
              )}
            </div>

            {/* Daily Task Toggle */}
            <div>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={isDaily}
                  onChange={(e) => {
                    setIsDaily(e.target.checked);
                    // Update task but preserve completion history
                    onUpdate(task.id, {
                      isDaily: e.target.checked,
                      completionHistory: task.completionHistory || {},
                    });
                  }}
                  className="rounded"
                />
                <span className="text-sm font-medium">Daily task</span>
              </label>
              {task.completionHistory &&
                Object.keys(task.completionHistory).length > 0 && (
                  <p className="text-muted-foreground mt-1 ml-7 text-xs">
                    Completion history will be preserved
                  </p>
                )}
            </div>
          </div>

          {/* Time Period */}
          <div className="mb-3">
            <label
              htmlFor="task-time-period"
              className="mb-2 block flex items-center gap-2 text-sm font-medium"
            >
              <Clock className="h-4 w-4" />
              Estimate
            </label>
            <div className="flex items-center gap-2">
              <input
                id="task-time-period"
                type="number"
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                placeholder="0"
                min="0"
                className="flex-1 rounded-md border p-3"
              />
              <span className="text-muted-foreground text-sm">minutes</span>
            </div>
            {task.timePeriod && (
              <div className="text-muted-foreground mt-1 text-xs">
                Estimated time: {formatTime(task.timePeriod)}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <label
              htmlFor="task-description"
              className="mb-2 block text-sm font-medium"
            >
              Description
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="h-32 w-full resize-none rounded-md border p-3"
            />
          </div>

          {/* Focus Mode and Save Buttons */}
          <div className="space-y-3 border-t pt-4">
            <Button
              onClick={() => setShowFocusMode(true)}
              style={{ backgroundColor: "#f97316", color: "white" }}
              className="w-full cursor-pointer hover:opacity-90"
            >
              Focus Mode
            </Button>
            <Button
              onClick={() => {
                if (isInToday(task.id)) {
                  removeFromToday(task.id);
                } else {
                  addToToday(task.id);
                }
              }}
              // variant={isInToday(task.id) ? "outline" : "default"}
              className="w-full bg-indigo-500 hover:cursor-pointer"
            >
              {isInToday(task.id) ? "Remove from Today" : "Add to Today"}
            </Button>
            <Button
              onClick={handleSave}
              className="w-full bg-emerald-500 hover:cursor-pointer"
            >
              Save Changes
            </Button>
          </div>

          {/* Task Info */}
          <div className="text-muted-foreground space-y-3 border-t pt-4 text-sm">
            <div className="grid grid-cols-2 gap-2">
              {task.lastCompleted && (
                <div>
                  <span className="font-medium">Last completed: </span>{" "}
                  {new Date(task.lastCompleted).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Current project info */}
            {task.projectId && (
              <div>
                <span className="font-medium">Current project:</span>
                <br />
                {projects.find((p) => p.id === task.projectId)?.name ||
                  "Unknown project"}
              </div>
            )}

            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <div
                className={cn(
                  "inline-block rounded px-2 py-1 text-xs font-medium",
                  task.completed
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800",
                )}
              >
                {task.completed ? "Completed" : "Pending"}
              </div>

              {task.isDaily && (
                <div className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                  Daily Task
                </div>
              )}

              {task.dueDate && (
                <div
                  className={cn(
                    "inline-block rounded px-2 py-1 text-xs font-medium",
                    new Date(task.dueDate) < new Date()
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800",
                  )}
                >
                  {new Date(task.dueDate) < new Date()
                    ? "Overdue"
                    : "Has Due Date"}
                </div>
              )}
            </div>
          </div>

          {/* Delete Task Button */}
          <div className="mt-4 border-t pt-4">
            <Button
              onClick={handleDelete}
              variant="destructive"
              className="w-full hover:cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Task
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

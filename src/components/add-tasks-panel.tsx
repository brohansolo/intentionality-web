"use client";

import { ChevronDown, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AddTasksPanelProps {
  onClose: () => void;
}

interface DraggableTaskItemProps {
  task: Task;
  isInToday: boolean;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
}

const DraggableTaskItem = ({
  task,
  isInToday,
  onDragStart,
}: DraggableTaskItemProps) => {
  const inToday = isInToday;
  const today = new Date().toISOString().split("T")[0];
  const isCompletedToday =
    task.isDaily && task.completionHistory?.[today] === true;
  const isDisabled = inToday || isCompletedToday;

  return (
    <div
      draggable={!isDisabled}
      onDragStart={(e) => onDragStart(e, task.id)}
      className={cn(
        "rounded-md border p-2 text-sm",
        isDisabled
          ? "bg-muted/50 border-muted text-muted-foreground cursor-not-allowed opacity-50"
          : "hover:bg-muted/50 cursor-grab transition-colors active:cursor-grabbing",
      )}
    >
      <div className={cn("font-medium", isDisabled && "line-through")}>
        {task.title}
      </div>
      {task.description && (
        <div className="text-muted-foreground mt-1 truncate text-xs">
          {task.description}
        </div>
      )}
    </div>
  );
};

export const AddTasksPanel = ({ onClose }: AddTasksPanelProps) => {
  const { projects, getInboxTasks, getProjectTasks, getDailyTasks, isInToday } =
    useTasks();

  // Initialize with all sections collapsed (inbox, daily-tasks, and all project IDs)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    () => {
      const initial = new Set<string>(["inbox", "daily-tasks"]);
      // Add all project IDs to collapsed set
      projects.forEach((p) => initial.add(p.id));
      return initial;
    },
  );

  const inboxTasks = getInboxTasks().filter((t) => !t.completed);
  const dailyTasks = getDailyTasks(); // Show all daily tasks, including completed ones

  // Count tasks IN Today view for each section
  const inboxInTodayCount = inboxTasks.filter((t) => isInToday(t.id)).length;
  const dailyInTodayCount = dailyTasks.filter((t) => isInToday(t.id)).length;

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    // Prevent dragging if task is in Today view or is a completed daily task
    const today = new Date().toISOString().split("T")[0];
    const allTasks = [...inboxTasks, ...dailyTasks];
    projects.forEach((p) => {
      allTasks.push(...getProjectTasks(p.id).filter((t) => !t.completed));
    });
    const task = allTasks.find((t) => t.id === taskId);
    const isCompletedToday =
      task?.isDaily && task?.completionHistory?.[today] === true;

    if (isInToday(taskId) || isCompletedToday) {
      e.preventDefault();
      return;
    }
    // Firefox requires at least one setData call
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "copy";
  };

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="bg-background relative z-50 w-80 overflow-y-auto border-l">
      <div className="bg-background sticky top-0 flex items-center justify-between border-b p-4">
        <h2 className="font-semibold">Add Tasks</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4 p-4">
        {/* Inbox Section */}
        {inboxTasks.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection("inbox")}
              className="text-muted-foreground hover:text-foreground mb-2 flex w-full items-center gap-1 text-sm font-medium transition-colors"
            >
              {collapsedSections.has("inbox") ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="flex-1 text-left">Inbox</span>
              {inboxInTodayCount > 0 && (
                <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
                  {inboxInTodayCount}
                </span>
              )}
            </button>
            {!collapsedSections.has("inbox") && (
              <div className="space-y-2">
                {inboxTasks.map((task) => (
                  <DraggableTaskItem
                    key={task.id}
                    task={task}
                    isInToday={isInToday(task.id)}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Daily Tasks Section */}
        {dailyTasks.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection("daily-tasks")}
              className="text-muted-foreground hover:text-foreground mb-2 flex w-full items-center gap-1 text-sm font-medium transition-colors"
            >
              {collapsedSections.has("daily-tasks") ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span className="flex-1 text-left">Daily Tasks</span>
              {dailyInTodayCount > 0 && (
                <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
                  {dailyInTodayCount}
                </span>
              )}
            </button>
            {!collapsedSections.has("daily-tasks") && (
              <div className="space-y-2">
                {dailyTasks.map((task) => (
                  <DraggableTaskItem
                    key={task.id}
                    task={task}
                    isInToday={isInToday(task.id)}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Projects Sections */}
        {projects
          .filter((p) => !p.completed)
          .map((project) => {
            const projectTasks = getProjectTasks(project.id).filter(
              (t) => !t.completed,
            );
            if (projectTasks.length === 0) return null;

            const projectInTodayCount = projectTasks.filter((t) =>
              isInToday(t.id),
            ).length;

            return (
              <div key={project.id}>
                <button
                  onClick={() => toggleSection(project.id)}
                  className="text-muted-foreground hover:text-foreground mb-2 flex w-full items-center gap-1 text-sm font-medium transition-colors"
                >
                  {collapsedSections.has(project.id) ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span className="flex-1 text-left">{project.name}</span>
                  {projectInTodayCount > 0 && (
                    <span className="bg-muted rounded-full px-2 py-0.5 text-xs">
                      {projectInTodayCount}
                    </span>
                  )}
                </button>
                {!collapsedSections.has(project.id) && (
                  <div className="space-y-2">
                    {projectTasks.map((task) => (
                      <DraggableTaskItem
                        key={task.id}
                        task={task}
                        isInToday={isInToday(task.id)}
                        onDragStart={handleDragStart}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

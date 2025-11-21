"use client";

import { GripVertical, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/lib/types";

import { AddTasksPanel } from "./add-tasks-panel";
import { TaskItem } from "./task-item";

interface TodayViewProps {
  onTaskClick: (task: Task) => void;
  onTaskDoubleClick: (task: Task) => void;
}

export const TodayView = ({
  onTaskClick,
  onTaskDoubleClick,
}: TodayViewProps) => {
  const {
    getTodayTasksList,
    updateTask,
    deleteTask,
    removeFromToday,
    reorderTodayTasks,
    todayTasks,
    addToToday,
    isInToday,
    clearToday,
    markDailyTaskComplete,
    markDailyTaskIncomplete,
  } = useTasks();

  const [isAddTasksPanelOpen, setIsAddTasksPanelOpen] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const tasks = getTodayTasksList();

  const handleToggle = (id: string, completed: boolean) => {
    const task = tasks.find((t) => t.id === id);
    if (task?.isDaily) {
      if (completed) {
        markDailyTaskComplete(id);
      } else {
        markDailyTaskIncomplete(id);
      }
    } else {
      updateTask(id, { completed });
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask(id);
    }
  };

  const handleRemoveFromToday = (taskId: string) => {
    removeFromToday(taskId);
  };

  const handleClearToday = () => {
    if (
      window.confirm("Are you sure you want to clear all tasks from Today?")
    ) {
      clearToday();
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", taskId); // Required for Firefox
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex?: number) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if it's a task from the add panel
    const taskIdFromPanel = e.dataTransfer.getData("taskId");
    if (taskIdFromPanel && !isInToday(taskIdFromPanel)) {
      addToToday(taskIdFromPanel);
      setDraggedTaskId(null);
      return;
    }

    // Otherwise, it's a reorder operation
    if (!draggedTaskId) return;

    const draggedIndex = todayTasks.findIndex(
      (t) => t.taskId === draggedTaskId,
    );
    if (
      draggedIndex === -1 ||
      dropIndex === undefined ||
      draggedIndex === dropIndex
    ) {
      setDraggedTaskId(null);
      return;
    }

    const reordered = [...todayTasks];
    const [draggedItem] = reordered.splice(draggedIndex, 1);
    reordered.splice(dropIndex, 0, draggedItem);

    reorderTodayTasks(reordered);
    setDraggedTaskId(null);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div
        className="flex-1 overflow-y-auto p-6"
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e)}
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Today</h1>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsAddTasksPanelOpen(true)}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Tasks
              </Button>
              {tasks.length > 0 && (
                <Button onClick={handleClearToday} variant="outline">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {tasks.length === 0 ? (
            <div
              className="text-muted-foreground border-muted rounded-lg border-2 border-dashed py-12 text-center"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e)}
            >
              <p>No tasks planned for today.</p>
              <p className="mt-2">
                Click &quot;Add Tasks&quot; or drag tasks here to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="group flex items-start gap-3"
                >
                  {/* Task Numbering */}
                  <div className="flex flex-shrink-0 items-center gap-2 pt-3">
                    <div className="bg-primary text-primary-foreground pointer-events-none flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <button
                      type="button"
                      className="cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
                      onMouseDown={(e) => {
                        // Allow drag on the handle
                        const parent = e.currentTarget.closest(
                          '[draggable="true"]',
                        ) as HTMLElement;
                        if (parent) {
                          parent.draggable = true;
                        }
                      }}
                    >
                      <GripVertical className="text-muted-foreground h-4 w-4" />
                    </button>
                  </div>

                  {/* Task Item Component */}
                  <div className="min-w-0 flex-1">
                    <TaskItem
                      task={task}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onUpdate={updateTask}
                      onClick={onTaskClick}
                      onDoubleClick={onTaskDoubleClick}
                      hideDelete={true}
                    />
                  </div>

                  {/* Remove from Today Button */}
                  <div className="flex-shrink-0 pt-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromToday(task.id);
                      }}
                      title="Remove from Today"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isAddTasksPanelOpen && (
        <AddTasksPanel onClose={() => setIsAddTasksPanelOpen(false)} />
      )}
    </div>
  );
};

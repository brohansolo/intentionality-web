"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { TaskItem } from "@/components/task-item";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/lib/types";

interface InboxViewProps {
  onTaskClick: (task: Task) => void;
  onTaskDoubleClick: (task: Task) => void;
}

export const InboxView = ({
  onTaskClick,
  onTaskDoubleClick,
}: InboxViewProps) => {
  const { getInboxTasks, updateTask, deleteTask } = useTasks();
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  const allInboxTasks = getInboxTasks();
  const inboxTasks = allInboxTasks.filter((task) => !task.completed);
  const completedTasks = allInboxTasks.filter((task) => task.completed);

  return (
    <div className="flex-1 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Inbox</h1>
        </div>

        <div className="space-y-2">
          {inboxTasks.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <p>No tasks in your inbox.</p>
              <p className="text-sm">Add a task to get started!</p>
            </div>
          ) : (
            inboxTasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("taskId", task.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
              >
                <TaskItem
                  task={task}
                  onToggle={(id, completed) => updateTask(id, { completed })}
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                  onClick={onTaskClick}
                  onDoubleClick={onTaskDoubleClick}
                />
              </div>
            ))
          )}
        </div>

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <button
              type="button"
              onClick={() => setShowCompletedTasks(!showCompletedTasks)}
              className="text-muted-foreground hover:text-foreground mb-3 flex w-full items-center gap-2 text-sm font-semibold transition-colors"
            >
              {showCompletedTasks ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Completed Tasks ({completedTasks.length})
            </button>
            {showCompletedTasks && (
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={(id, completed) => updateTask(id, { completed })}
                    onDelete={deleteTask}
                    onUpdate={updateTask}
                    onClick={onTaskClick}
                    onDoubleClick={onTaskDoubleClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

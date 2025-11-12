"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { TaskItem } from "@/components/task-item";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ArchivedViewProps {
  onTaskClick?: (task: Task) => void;
  onTaskDoubleClick?: (task: Task) => void;
}

export const ArchivedView = ({
  onTaskClick,
  onTaskDoubleClick,
}: ArchivedViewProps) => {
  const {
    tasks,
    projects,
    updateTask,
    deleteTask,
    reorderTasks,
    updateProject,
  } = useTasks();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  // Filter for completed tasks and projects
  const archivedTasks = tasks
    .filter((task) => task.completed)
    .sort((a, b) => {
      // Sort by completion date (most recent first)
      const aDate = a.lastCompleted || a.createdAt;
      const bDate = b.lastCompleted || b.createdAt;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

  const completedProjects = projects
    .filter((p) => p.completed)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedTask) return;

    const draggedIndex = archivedTasks.findIndex((t) => t.id === draggedTask);
    if (draggedIndex === -1 || draggedIndex === dropIndex) return;

    const reorderedTasks = [...archivedTasks];
    const [draggedItem] = reorderedTasks.splice(draggedIndex, 1);
    reorderedTasks.splice(dropIndex, 0, draggedItem);

    reorderTasks(reorderedTasks);
    setDraggedTask(null);
  };

  const getProjectTasks = (projectId: string) =>
    tasks.filter((t) => t.projectId === projectId);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Archived</h1>
        <p className="text-muted-foreground mt-1">
          Completed projects ({completedProjects.length}) and tasks (
          {archivedTasks.length})
        </p>
      </div>

      <div className="space-y-8">
        {/* Completed Projects */}
        {completedProjects.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Completed Projects</h2>
            {completedProjects.map((project) => {
              const projectTasks = getProjectTasks(project.id);
              return (
                <div
                  key={project.id}
                  className="space-y-3 rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-1 items-center gap-3">
                      <button
                        onClick={() =>
                          updateProject(project.id, { completed: false })
                        }
                        className={cn(
                          "h-5 w-5 flex-shrink-0 rounded border transition-colors",
                          project.completed
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/50 hover:border-muted-foreground",
                        )}
                        aria-label="Mark project as incomplete"
                      >
                        {project.completed && <Check className="h-4 w-4" />}
                      </button>
                      <div className="space-y-1">
                        <h3 className="text-lg font-medium">{project.name}</h3>
                        {project.description && (
                          <p className="text-muted-foreground text-sm">
                            {project.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {projectTasks.length > 0 && (
                    <div className="space-y-2 border-t pt-2">
                      <p className="text-muted-foreground text-sm">
                        {projectTasks.length} task
                        {projectTasks.length !== 1 ? "s" : ""}
                      </p>
                      <div className="ml-4 space-y-1">
                        {projectTasks.slice(0, 5).map((task) => (
                          <div key={task.id} className="text-sm">
                            <TaskItem
                              task={task}
                              onToggle={(id, completed) =>
                                updateTask(id, { completed })
                              }
                              onUpdate={updateTask}
                              onDelete={deleteTask}
                              onClick={onTaskClick}
                              onDoubleClick={onTaskDoubleClick}
                            />
                          </div>
                        ))}
                        {projectTasks.length > 5 && (
                          <p className="text-muted-foreground ml-4 text-xs">
                            +{projectTasks.length - 5} more task
                            {projectTasks.length - 5 !== 1 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Completed Tasks (not in projects) */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Completed Tasks</h2>
          {archivedTasks.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              No completed tasks yet
            </div>
          ) : (
            archivedTasks.map((task, index) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <TaskItem
                  task={task}
                  onToggle={(id, completed) => updateTask(id, { completed })}
                  onUpdate={updateTask}
                  onDelete={deleteTask}
                  onClick={onTaskClick}
                  onDoubleClick={onTaskDoubleClick}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

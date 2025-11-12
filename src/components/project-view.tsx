"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

import { TagSelector } from "@/components/tag-selector";
import { TaskItem } from "@/components/task-item";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProjectViewProps {
  projectId: string;
  onTaskClick: (task: Task) => void;
  onTaskDoubleClick: (task: Task) => void;
  onViewChange: (view: string) => void;
}

export const ProjectView = ({
  projectId,
  onTaskClick,
  onTaskDoubleClick,
  onViewChange,
}: ProjectViewProps) => {
  const {
    projects,
    getProjectTasks,
    updateTask,
    deleteTask,
    deleteProject,
    updateProject,
    reorderTasks,
  } = useTasks();
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editDescription, setEditDescription] = useState("");
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  const project = projects.find((p) => p.id === projectId);
  const allProjectTasks = getProjectTasks(projectId);
  const projectTasks = allProjectTasks.filter((task) => !task.completed);
  const completedTasks = allProjectTasks.filter((task) => task.completed);

  if (!project) {
    return (
      <div className="flex-1 p-6">
        <div className="text-muted-foreground py-12 text-center">
          <p>Project not found</p>
        </div>
      </div>
    );
  }

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

    const draggedIndex = projectTasks.findIndex((t) => t.id === draggedTask);
    if (draggedIndex === -1 || draggedIndex === dropIndex) return;

    const reorderedTasks = [...projectTasks];
    const [draggedItem] = reorderedTasks.splice(draggedIndex, 1);
    reorderedTasks.splice(dropIndex, 0, draggedItem);

    reorderTasks(reorderedTasks);
    setDraggedTask(null);
  };

  const handleDeleteProject = () => {
    if (
      confirm(
        `Are you sure you want to delete "${project.name}" and all its tasks?`,
      )
    ) {
      deleteProject(projectId);
      onViewChange("inbox");
    }
  };

  const handleCompleteProject = () => {
    updateProject(projectId, { completed: true });
    onViewChange("inbox");
  };

  const handleProjectNameClick = () => {
    setIsEditingProjectName(true);
    setEditProjectName(project.name);
  };

  const handleProjectNameSave = () => {
    if (editProjectName.trim() && editProjectName.trim() !== project.name) {
      updateProject(projectId, { name: editProjectName.trim() });
    }
    setIsEditingProjectName(false);
  };

  const handleProjectNameCancel = () => {
    setEditProjectName(project.name);
    setIsEditingProjectName(false);
  };

  const handleDescriptionClick = () => {
    setIsEditingDescription(true);
    setEditDescription(project.description || "");
  };

  const handleDescriptionSave = () => {
    updateProject(projectId, {
      description: editDescription.trim() || undefined,
    });
    setIsEditingDescription(false);
  };

  const handleDescriptionCancel = () => {
    setEditDescription(project.description || "");
    setIsEditingDescription(false);
  };

  const handleAddProjectTag = (tagId: string) => {
    const currentTags = project.tags || [];
    if (!currentTags.includes(tagId)) {
      updateProject(projectId, { tags: [...currentTags, tagId] });
    }
  };

  const handleRemoveProjectTag = (tagId: string) => {
    const currentTags = project.tags || [];
    updateProject(projectId, {
      tags: currentTags.filter((id) => id !== tagId),
    });
  };

  return (
    <div className="flex-1 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCompleteProject}
              className={cn(
                "h-5 w-5 flex-shrink-0 rounded border transition-colors",
                project.completed
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-muted-foreground/50 hover:border-muted-foreground",
              )}
              aria-label="Mark project as complete"
            >
              {project.completed && <Check className="h-4 w-4" />}
            </button>
            {isEditingProjectName ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleProjectNameSave();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={editProjectName}
                  onChange={(e) => setEditProjectName(e.target.value)}
                  className="border-primary border-b-2 border-none bg-transparent text-2xl font-bold outline-none"
                  onBlur={handleProjectNameSave}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      handleProjectNameCancel();
                    }
                  }}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                />
              </form>
            ) : (
              <div
                className="hover:bg-muted/20 -mx-2 cursor-pointer rounded px-2 text-2xl font-bold"
                onClick={handleProjectNameClick}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleProjectNameClick();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label="Click to edit project name"
              >
                {project.name}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive h-8 w-8"
                onClick={handleDeleteProject}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Project Description */}
        <div className="mb-6">
          <div className="rounded-lg border bg-stone-100 dark:bg-stone-800">
            <button
              type="button"
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="hover:bg-muted/20 flex w-full items-center gap-2 p-3 transition-colors"
            >
              {isDescriptionExpanded ? (
                <ChevronDown className="text-muted-foreground h-4 w-4" />
              ) : (
                <ChevronRight className="text-muted-foreground h-4 w-4" />
              )}
              <span className="text-sm font-medium">Description</span>
            </button>
            {isDescriptionExpanded && (
              <>
                {isEditingDescription ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleDescriptionSave();
                    }}
                    className="border-t"
                  >
                    <textarea
                      value={editDescription}
                      onChange={(e) => {
                        setEditDescription(e.target.value);
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                      }}
                      placeholder="Click to add a description..."
                      className="min-h-[80px] w-full resize-y overflow-hidden rounded-none border-0 p-3 focus:ring-0 focus:outline-none"
                      onBlur={handleDescriptionSave}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          handleDescriptionCancel();
                        }
                      }}
                      onFocus={(e) => {
                        e.target.style.height = "auto";
                        e.target.style.height = e.target.scrollHeight + "px";
                      }}
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                    />
                  </form>
                ) : (
                  <div
                    className="hover:bg-muted/20 cursor-pointer border-t p-3"
                    onClick={handleDescriptionClick}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleDescriptionClick();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label="Click to edit project description"
                  >
                    {project.description ? (
                      <div className="prose prose-sm dark:prose-invert text-muted-foreground max-w-none">
                        <ReactMarkdown>{project.description}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60 italic">
                        Click to add a description...
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Project Tags */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex-shrink-0 text-sm font-medium">Tags:</div>
          <TagSelector
            currentTags={project.tags || []}
            onAddTag={handleAddProjectTag}
            onRemoveTag={handleRemoveProjectTag}
          />
        </div>

        <div className="space-y-8">
          {/* Active Tasks */}
          <div className="space-y-2">
            {projectTasks.length === 0 ? (
              <div className="text-muted-foreground py-12 text-center">
                <p>No active tasks in this project.</p>
                <p className="text-sm">Add a task to get started!</p>
              </div>
            ) : (
              projectTasks.map((task, index) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="group relative"
                >
                  <div className="absolute top-1/2 left-1 z-10 -translate-y-1/2 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                    <GripVertical className="text-muted-foreground h-4 w-4" />
                  </div>
                  <div className="pl-6">
                    <TaskItem
                      task={task}
                      onToggle={(id, completed) =>
                        updateTask(id, { completed })
                      }
                      onDelete={deleteTask}
                      onUpdate={updateTask}
                      onClick={onTaskClick}
                      onDoubleClick={onTaskDoubleClick}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Completed Tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <button
                type="button"
                onClick={() => setShowCompletedTasks(!showCompletedTasks)}
                className="text-muted-foreground hover:text-foreground flex w-full items-center gap-2 text-sm font-semibold transition-colors"
              >
                {showCompletedTasks ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Completed Tasks ({completedTasks.length})
              </button>
              {showCompletedTasks && (
                <div className="mt-3 space-y-2">
                  {completedTasks.map((task) => (
                    <div key={task.id} className="pl-6">
                      <TaskItem
                        task={task}
                        onToggle={(id, completed) =>
                          updateTask(id, { completed })
                        }
                        onDelete={deleteTask}
                        onUpdate={updateTask}
                        onClick={onTaskClick}
                        onDoubleClick={onTaskDoubleClick}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

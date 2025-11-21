"use client";

import { ChevronDown, ChevronRight, Filter, X } from "lucide-react";
import { useState } from "react";

import { TaskItem } from "@/components/task-item";
import { useTasksAdapter as useTasks } from "@/hooks/use-tasks-adapter";
import { Task } from "@/lib/types";

interface AllTasksViewProps {
  onTaskClick: (task: Task) => void;
  onTaskDoubleClick: (task: Task) => void;
}

type SortOption = "order" | "dueDate" | "createdAt";

export const AllTasksView = ({
  onTaskClick,
  onTaskDoubleClick,
}: AllTasksViewProps) => {
  const { tasks, projects, tags, updateTask, deleteTask, reorderTasks } =
    useTasks();
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("order");
  const [groupByProject, setGroupByProject] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);

  // Filter and sort tasks
  const filteredAndSortedTasks = tasks
    .filter((task) => {
      if (task.completed) return false;
      if (task.parentTaskId) return false; // Filter out subtasks

      // Filter by selected tags
      if (selectedTags.length > 0) {
        if (!task.tags || task.tags.length === 0) return false;
        return selectedTags.some((tagId) => task.tags?.includes(tagId));
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "dueDate") {
        // Tasks without due dates go to the end
        if (!a.dueDate && !b.dueDate) return a.order - b.order;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortBy === "createdAt") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      // Default: sort by order
      return a.order - b.order;
    });

  const allTasks = filteredAndSortedTasks;

  const handleDragStart = (task: Task) => {
    setDraggedTask(task);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetTask: Task) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.id === targetTask.id) return;

    const draggedIndex = allTasks.findIndex((t) => t.id === draggedTask.id);
    const targetIndex = allTasks.findIndex((t) => t.id === targetTask.id);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const reorderedTasks = [...allTasks];
    const [removed] = reorderedTasks.splice(draggedIndex, 1);
    reorderedTasks.splice(targetIndex, 0, removed);

    reorderTasks(reorderedTasks);
    setDraggedTask(null);
  };

  const getProjectName = (projectId?: string) => {
    if (!projectId) return null;
    return projects.find((p) => p.id === projectId)?.name;
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  // Group tasks by project if enabled
  const groupedTasks = groupByProject
    ? allTasks.reduce(
        (acc, task) => {
          let groupKey: string;
          if (task.isDaily) {
            groupKey = "daily-tasks";
          } else if (task.projectId) {
            groupKey = task.projectId;
          } else {
            groupKey = "no-project";
          }

          if (!acc[groupKey]) {
            acc[groupKey] = [];
          }
          acc[groupKey].push(task);
          return acc;
        },
        {} as Record<string, Task[]>,
      )
    : null;

  const renderTask = (task: Task) => (
    <div
      key={task.id}
      draggable={!groupByProject}
      onDragStart={() => !groupByProject && handleDragStart(task)}
      onDragOver={!groupByProject ? handleDragOver : undefined}
      onDrop={!groupByProject ? (e) => handleDrop(e, task) : undefined}
    >
      {/* {task.projectId && !groupByProject && (
        <div className="text-xs text-muted-foreground ml-11 mb-1">
          Project: {getProjectName(task.projectId)}
        </div>
      )} */}
      <TaskItem
        task={task}
        onToggle={(id, completed) => updateTask(id, { completed })}
        onDelete={deleteTask}
        onUpdate={updateTask}
        onClick={onTaskClick}
        onDoubleClick={onTaskDoubleClick}
      />
    </div>
  );

  return (
    <div className="flex-1 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">All Tasks</h1>
        </div>

        {/* Filters and Controls */}
        <div className="mb-6 space-y-4">
          {/* Sort and Group Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm font-medium">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="size-auto w-35 rounded-md border px-3 py-1.5 text-sm"
              >
                <option value="order">Manual Order</option>
                <option value="dueDate">Due Date</option>
                <option value="createdAt">Created Date</option>
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={groupByProject}
                onChange={(e) => setGroupByProject(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">Group by Project</span>
            </label>
          </div>

          {/* Tag Filters */}
          {tags.length > 0 && (
            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="text-muted-foreground h-4 w-4" />
                  <span className="text-sm font-medium">Filter by Tags</span>
                </div>
                {selectedTags.length > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs"
                  >
                    <X className="h-3 w-3" />
                    Clear filters
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      selectedTags.includes(tag.id)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                    style={
                      selectedTags.includes(tag.id) && tag.color
                        ? { backgroundColor: tag.color, color: "white" }
                        : !selectedTags.includes(tag.id) && tag.color
                          ? {
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }
                          : undefined
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tasks List */}
        <div className="space-y-2">
          {allTasks.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <p>No tasks found.</p>
              <p className="text-sm">
                {selectedTags.length > 0
                  ? "Try changing your filters."
                  : "Create one to get started!"}
              </p>
            </div>
          ) : groupByProject ? (
            // Grouped view
            <>
              {/* Daily Tasks */}
              {groupedTasks?.["daily-tasks"] && (
                <div className="mb-6">
                  <h3 className="text-muted-foreground mb-3 px-2 text-sm font-semibold">
                    Daily Tasks
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks["daily-tasks"].map(renderTask)}
                  </div>
                </div>
              )}
              {/* Tasks without project */}
              {groupedTasks?.["no-project"] && (
                <div className="mb-6">
                  <h3 className="text-muted-foreground mb-3 px-2 text-sm font-semibold">
                    No Project
                  </h3>
                  <div className="space-y-2">
                    {groupedTasks["no-project"].map(renderTask)}
                  </div>
                </div>
              )}
              {/* Tasks grouped by project */}
              {projects
                .filter((p) => !p.completed && groupedTasks?.[p.id]?.length)
                .map((project) => (
                  <div key={project.id} className="mb-6">
                    <h3 className="text-muted-foreground mb-3 px-2 text-sm font-semibold">
                      {project.name}
                    </h3>
                    <div className="space-y-2">
                      {groupedTasks?.[project.id]?.map(renderTask)}
                    </div>
                  </div>
                ))}
            </>
          ) : (
            // Regular list view
            allTasks.map(renderTask)
          )}
        </div>

        {tasks.filter((t) => t.completed).length > 0 && (
          <div className="mt-6 border-t pt-6">
            <button
              type="button"
              onClick={() => setShowCompletedTasks(!showCompletedTasks)}
              className="text-muted-foreground hover:text-foreground mb-4 flex w-full items-center gap-2 text-sm font-semibold transition-colors"
            >
              {showCompletedTasks ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Completed ({tasks.filter((t) => t.completed).length})
            </button>
            {showCompletedTasks && (
              <div className="space-y-2">
                {tasks
                  .filter((task) => task.completed)
                  .sort((a, b) => a.order - b.order)
                  .map((task) => (
                    <div key={task.id}>
                      {task.projectId && (
                        <div className="text-muted-foreground mb-1 ml-11 text-xs">
                          Project: {getProjectName(task.projectId)}
                        </div>
                      )}
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
  );
};

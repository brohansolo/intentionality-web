"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { TaskItem } from "@/components/task-item";
import { Button } from "@/components/ui/button";
import { useKeyboard } from "@/hooks/use-keyboard";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/lib/types";

interface NextStepsViewProps {
  onTaskClick: (task: Task) => void;
  onTaskDoubleClick: (task: Task) => void;
}

export const NextStepsView = ({
  onTaskClick,
  onTaskDoubleClick,
}: NextStepsViewProps) => {
  const {
    projects,
    getProjectTasks,
    getDailyTasks,
    addTask,
    updateTask,
    deleteTask,
    markDailyTaskComplete,
    getActiveProjects,
  } = useTasks();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedProject, setSelectedProject] = useState("");

  useKeyboard({
    onCreateTask: () => setIsAddingTask(true),
  });

  // Get incomplete daily tasks
  const incompleteDailyTasks = getDailyTasks().filter(
    (task) => !task.completed,
  );

  // Get the first incomplete task from each project
  const nextSteps = projects
    .map((project) => {
      const projectTasks = getProjectTasks(project.id);
      const firstIncompleteTask = projectTasks.find((task) => !task.completed);
      return {
        project,
        nextTask: firstIncompleteTask,
      };
    })
    .filter((item) => item.nextTask); // Only show projects that have incomplete tasks

  const handleToggle = (id: string, completed: boolean, isDaily: boolean) => {
    if (isDaily && completed) {
      markDailyTaskComplete(id);
    } else {
      updateTask(id, { completed });
    }
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskTitle.trim() && selectedProject) {
      addTask(taskTitle.trim(), selectedProject);
      setTaskTitle("");
      setSelectedProject("");
      setIsAddingTask(false);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Next Steps</h1>
            <p className="text-muted-foreground">
              Today&apos;s tasks and first steps from each project
            </p>
          </div>
          <Button
            onClick={() => setIsAddingTask(true)}
            className="flex cursor-pointer items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>

        {isAddingTask && (
          <form
            onSubmit={handleAddTask}
            className="bg-muted/20 mb-6 rounded-lg border p-4"
          >
            <div className="space-y-3">
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Task title"
                className="w-full rounded-md border p-2"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsAddingTask(false);
                    setTaskTitle("");
                    setSelectedProject("");
                  }
                }}
              />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full rounded-md border p-2"
                required
              >
                <option value="">Select a project</option>
                {getActiveProjects().map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={!selectedProject}
                  className="cursor-pointer"
                >
                  Add Task
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsAddingTask(false);
                    setTaskTitle("");
                    setSelectedProject("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="space-y-8">
          {/* Project Next Steps Section */}
          {nextSteps.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-foreground text-xl font-semibold">
                Project Next Steps
              </h2>
              <div className="space-y-6">
                {nextSteps.map(({ project, nextTask }) => (
                  <div key={project.id} className="space-y-2">
                    <h3 className="text-muted-foreground text-lg font-medium">
                      {project.name}
                    </h3>
                    {nextTask && (
                      <TaskItem
                        task={nextTask}
                        onToggle={(id, completed) =>
                          handleToggle(id, completed, nextTask.isDaily)
                        }
                        onDelete={deleteTask}
                        onUpdate={updateTask}
                        onClick={onTaskClick}
                        onDoubleClick={onTaskDoubleClick}
                        isDaily={nextTask.isDaily}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily Tasks Section */}
          {incompleteDailyTasks.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-foreground text-xl font-semibold">
                Today&apos;s Tasks
              </h2>
              <div className="space-y-2">
                {incompleteDailyTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={(id, completed) =>
                      handleToggle(id, completed, task.isDaily)
                    }
                    onDelete={deleteTask}
                    onUpdate={updateTask}
                    onClick={onTaskClick}
                    onDoubleClick={onTaskDoubleClick}
                    isDaily={true}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {incompleteDailyTasks.length === 0 && nextSteps.length === 0 && (
            <div className="text-muted-foreground py-12 text-center">
              <p>No next steps found.</p>
              <p className="text-sm">
                All daily tasks are complete and all projects are finished!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

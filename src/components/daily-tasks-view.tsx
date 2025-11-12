"use client";

import { TaskItem } from "@/components/task-item";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/lib/types";

interface DailyTasksViewProps {
  onTaskClick: (task: Task) => void;
  onTaskDoubleClick: (task: Task) => void;
}

export const DailyTasksView = ({
  onTaskClick,
  onTaskDoubleClick,
}: DailyTasksViewProps) => {
  const {
    getDailyTasks,
    updateTask,
    deleteTask,
    markDailyTaskComplete,
    markDailyTaskIncomplete,
    projects,
  } = useTasks();

  const dailyTasks = getDailyTasks();

  const handleToggle = (id: string, completed: boolean) => {
    if (completed) {
      markDailyTaskComplete(id);
    } else {
      markDailyTaskIncomplete(id);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Daily Tasks</h1>
            <p className="text-muted-foreground">
              Tasks that need to be completed daily
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {dailyTasks.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <p>No daily tasks yet.</p>
              <p className="text-sm">
                Add tasks that you want to complete every day!
              </p>
            </div>
          ) : (
            (() => {
              // Group daily tasks by project
              const generalTasks = dailyTasks.filter((task) => !task.projectId);
              const tasksByProject = projects.reduce(
                (acc, project) => {
                  const projectTasks = dailyTasks.filter(
                    (task) => task.projectId === project.id,
                  );
                  if (projectTasks.length > 0) {
                    acc[project.id] = { project, tasks: projectTasks };
                  }
                  return acc;
                },
                {} as Record<
                  string,
                  { project: (typeof projects)[0]; tasks: typeof dailyTasks }
                >,
              );

              return (
                <>
                  {/* General daily tasks (no project) */}
                  {generalTasks.length > 0 && (
                    <div>
                      <h3 className="text-muted-foreground mb-3 text-lg font-medium">
                        General Daily Tasks
                      </h3>
                      <div className="space-y-2">
                        {generalTasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={handleToggle}
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

                  {/* Daily tasks grouped by project */}
                  {Object.values(tasksByProject).map(({ project, tasks }) => (
                    <div key={project.id}>
                      <h3 className="text-muted-foreground mb-3 text-lg font-medium">
                        {project.name} - Daily Tasks
                      </h3>
                      <div className="space-y-2">
                        {tasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onToggle={handleToggle}
                            onDelete={deleteTask}
                            onUpdate={updateTask}
                            onClick={onTaskClick}
                            onDoubleClick={onTaskDoubleClick}
                            isDaily={true}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
};

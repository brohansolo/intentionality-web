"use client";

import { useEffect, useState } from "react";

import { AddTaskModal } from "@/components/add-task-modal";
import { AllTasksView } from "@/components/all-tasks-view";
import { ArchivedView } from "@/components/archived-view";
import { DailyTasksView } from "@/components/daily-tasks-view";
import { FocusMode } from "@/components/focus-mode";
import { InboxView } from "@/components/inbox-view";
import { NextStepsView } from "@/components/next-steps-view";
import { ProjectView } from "@/components/project-view";
import { ScratchpadModal } from "@/components/scratchpad-modal";
import { Sidebar } from "@/components/sidebar";
import { TaskDetailSidebar } from "@/components/task-detail-sidebar";
import { TodayView } from "@/components/today-view";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/lib/types";

const HomePage = () => {
  const [currentView, setCurrentView] = useState<string>("today");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [focusTask, setFocusTask] = useState<Task | null>(null);
  const [scratchpadOpen, setScratchpadOpen] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const { tasks, updateTask } = useTasks();

  // Keep selectedTask in sync with the latest task data
  useEffect(() => {
    if (selectedTask) {
      const updatedTask = tasks.find((t) => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  }, [tasks, selectedTask?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // 's' key for scratchpad
      if (e.key === "s" && !e.metaKey && !e.ctrlKey && !isInInput) {
        e.preventDefault();
        setScratchpadOpen(true);
      }

      // 'a' key for add task modal - works globally with Ctrl/Cmd modifier, or when not in input
      if ((e.key === "a" || e.key === "A") && !focusTask) {
        if (e.ctrlKey || e.metaKey || !isInInput) {
          e.preventDefault();
          setAddTaskModalOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusTask]);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
  };

  const handleTaskDoubleClick = (task: Task) => {
    setSelectedTask(null);
    setFocusTask(task);
  };

  const handleCloseTaskDetail = () => {
    setSelectedTask(null);
  };

  const handleCloseFocusMode = () => {
    setFocusTask(null);
  };

  // Determine default project based on current view
  const getDefaultProjectId = () => {
    // If viewing a specific project, return that project ID
    if (
      currentView !== "today" &&
      currentView !== "all-tasks" &&
      currentView !== "inbox" &&
      currentView !== "next-steps" &&
      currentView !== "daily-tasks" &&
      currentView !== "archived"
    ) {
      return currentView;
    }
    return undefined;
  };

  // Determine if we're creating a daily task
  const getIsDaily = () => {
    return currentView === "daily-tasks";
  };

  const renderView = () => {
    if (currentView === "today") {
      return (
        <TodayView
          onTaskClick={handleTaskClick}
          onTaskDoubleClick={handleTaskDoubleClick}
        />
      );
    }
    if (currentView === "all-tasks") {
      return (
        <AllTasksView
          onTaskClick={handleTaskClick}
          onTaskDoubleClick={handleTaskDoubleClick}
        />
      );
    }
    if (currentView === "inbox") {
      return (
        <InboxView
          onTaskClick={handleTaskClick}
          onTaskDoubleClick={handleTaskDoubleClick}
        />
      );
    }
    if (currentView === "next-steps") {
      return (
        <NextStepsView
          onTaskClick={handleTaskClick}
          onTaskDoubleClick={handleTaskDoubleClick}
        />
      );
    }
    if (currentView === "daily-tasks") {
      return (
        <DailyTasksView
          onTaskClick={handleTaskClick}
          onTaskDoubleClick={handleTaskDoubleClick}
        />
      );
    }
    if (currentView === "archived") {
      return (
        <ArchivedView
          onTaskClick={handleTaskClick}
          onTaskDoubleClick={handleTaskDoubleClick}
        />
      );
    }
    return (
      <ProjectView
        projectId={currentView}
        onTaskClick={handleTaskClick}
        onTaskDoubleClick={handleTaskDoubleClick}
        onViewChange={setCurrentView}
      />
    );
  };

  return (
    <div className="relative flex h-screen">
      {focusTask ? (
        <FocusMode
          task={focusTask}
          onClose={handleCloseFocusMode}
          onUpdate={updateTask}
        />
      ) : (
        <>
          <Sidebar currentView={currentView} onViewChange={setCurrentView} />
          {renderView()}
          <TaskDetailSidebar
            task={selectedTask}
            onClose={handleCloseTaskDetail}
            onUpdate={updateTask}
          />
        </>
      )}
      <ScratchpadModal open={scratchpadOpen} onOpenChange={setScratchpadOpen} />
      <AddTaskModal
        isOpen={addTaskModalOpen}
        onClose={() => setAddTaskModalOpen(false)}
        defaultProjectId={getDefaultProjectId()}
        isDaily={getIsDaily()}
      />
    </div>
  );
};

export default HomePage;

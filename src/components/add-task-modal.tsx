"use client";

import { useEffect, useRef, useState } from "react";

import { TagInput } from "@/components/tag-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTasks } from "@/hooks/use-tasks";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectId?: string;
  isDaily?: boolean;
}

export const AddTaskModal = ({
  isOpen,
  onClose,
  defaultProjectId,
  isDaily = false,
}: AddTaskModalProps) => {
  const { projects, addTask, addToToday } = useTasks();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskProject, setNewTaskProject] = useState<string>(
    defaultProjectId || "",
  );
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isDailyTask, setIsDailyTask] = useState(isDaily);
  const [addToTodayList, setAddToTodayList] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [highlightSave, setHighlightSave] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const projectSelectRef = useRef<HTMLButtonElement>(null);
  const timePeriodInputRef = useRef<HTMLInputElement>(null);
  const descriptionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const keepEditingButtonRef = useRef<HTMLButtonElement>(null);
  const [lastFocusedElement, setLastFocusedElement] =
    useState<HTMLElement | null>(null);

  // Filter out completed projects
  const activeProjects = projects.filter((p) => !p.completed);

  // Update default project when prop changes
  useEffect(() => {
    if (defaultProjectId) {
      setNewTaskProject(defaultProjectId);
    }
  }, [defaultProjectId]);

  // Auto-focus title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const hasTaskContent = () => {
    return (
      newTaskTitle.trim() ||
      newTaskDescription.trim() ||
      newTaskProject ||
      timePeriod ||
      selectedTags.length > 0 ||
      isDailyTask !== isDaily ||
      addToTodayList
    );
  };

  const resetModal = () => {
    setNewTaskTitle("");
    setNewTaskProject(defaultProjectId || "");
    setNewTaskDescription("");
    setTimePeriod("");
    setSelectedTags([]);
    setIsDailyTask(isDaily);
    setAddToTodayList(false);
    setHighlightSave(false);
    setShowExitConfirmation(false);
    onClose();
  };

  const handleClose = () => {
    // Store currently focused element
    setLastFocusedElement(document.activeElement as HTMLElement);

    if (hasTaskContent()) {
      setShowExitConfirmation(true);
    } else {
      resetModal();
    }
  };

  const handleKeepEditing = () => {
    setShowExitConfirmation(false);
    // Restore focus to the last focused element after a brief delay
    setTimeout(() => {
      if (lastFocusedElement && lastFocusedElement.focus) {
        lastFocusedElement.focus();
      }
    }, 50);
  };

  const handleSaveNewTask = () => {
    if (!newTaskTitle.trim()) return;

    const taskId = addTask(
      newTaskTitle.trim(),
      newTaskProject && newTaskProject !== "none" ? newTaskProject : undefined,
      undefined, // no due date
      isDailyTask, // is daily (from state)
      timePeriod ? Number(timePeriod) : undefined, // time period
      newTaskDescription.trim() || undefined,
      selectedTags.length > 0 ? selectedTags : undefined, // tags
    );

    // Add to Today list if checkbox is checked
    if (addToTodayList && taskId) {
      addToToday(taskId);
    }

    resetModal();
  };

  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setHighlightSave(true);
      setTimeout(() => {
        handleSaveNewTask();
      }, 100);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleClose();
    }
  };

  // Auto-focus Keep Editing button when confirmation dialog opens
  // and handle Escape key for closing the dialog
  useEffect(() => {
    if (showExitConfirmation) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          resetModal();
        }
      };

      document.addEventListener("keydown", handleKeyDown);

      if (keepEditingButtonRef.current) {
        setTimeout(() => {
          keepEditingButtonRef.current?.focus();
        }, 50);
      }

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [showExitConfirmation, resetModal]);

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200,
        }}
      >
        <div
          style={{
            backgroundColor: "var(--background, white)",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "500px",
            width: "90%",
            maxHeight: "80vh",
            overflowY: "auto",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div style={{ marginBottom: "16px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Add New Task
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--muted-foreground, #6b7280)",
              }}
            >
              Create a new task. Press Enter to save or Escape to cancel.
            </p>
          </div>

          <div style={{ display: "grid", gap: "24px", marginBottom: "24px" }}>
            <div style={{ display: "grid", gap: "8px" }}>
              <label
                htmlFor="task-title"
                style={{ fontSize: "14px", fontWeight: "500" }}
              >
                Title
              </label>
              <Input
                id="task-title"
                ref={titleInputRef}
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleDialogKeyDown}
                placeholder="Task title..."
              />
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <label
                htmlFor="task-project"
                style={{ fontSize: "14px", fontWeight: "500" }}
              >
                Project
              </label>
              <Select value={newTaskProject} onValueChange={setNewTaskProject}>
                <SelectTrigger
                  id="task-project"
                  ref={projectSelectRef}
                  onKeyDown={handleDialogKeyDown}
                >
                  <SelectValue placeholder="No project" />
                </SelectTrigger>
                <SelectContent style={{ zIndex: 250 }}>
                  <SelectItem value="none">No project</SelectItem>
                  {activeProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <TagInput
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
            />

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="add-to-today"
                checked={addToTodayList}
                onChange={(e) => setAddToTodayList(e.target.checked)}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="add-to-today"
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Add to Today
              </label>
              <input
                type="checkbox"
                id="is-daily-task"
                checked={isDailyTask}
                onChange={(e) => setIsDailyTask(e.target.checked)}
                style={{
                  width: "16px",
                  height: "16px",
                  cursor: "pointer",
                }}
              />
              <label
                htmlFor="is-daily-task"
                style={{
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Daily Task
              </label>
            </div>

            {isDailyTask && (
              <div style={{ display: "grid", gap: "8px" }}>
                <label
                  htmlFor="task-time-period"
                  style={{ fontSize: "14px", fontWeight: "500" }}
                >
                  Time Period (minutes)
                </label>
                <Input
                  id="task-time-period"
                  ref={timePeriodInputRef}
                  type="number"
                  value={timePeriod}
                  onChange={(e) => setTimePeriod(e.target.value)}
                  onKeyDown={handleDialogKeyDown}
                  placeholder="0"
                  min="0"
                />
              </div>
            )}
            <div style={{ display: "grid", gap: "8px" }}>
              <label
                htmlFor="task-description"
                style={{ fontSize: "14px", fontWeight: "500" }}
              >
                Description
              </label>
              <Textarea
                id="task-description"
                ref={descriptionTextareaRef}
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                onKeyDown={handleDialogKeyDown}
                placeholder="Task description (optional)..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          <div
            style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}
          >
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveNewTask}
              disabled={!newTaskTitle.trim()}
              style={
                highlightSave ? { boxShadow: "0 0 0 2px var(--ring)" } : {}
              }
            >
              Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Exit Confirmation Dialog */}
      {showExitConfirmation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 201,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-confirmation-title"
            style={{
              backgroundColor: "var(--background, white)",
              borderRadius: "8px",
              padding: "24px",
              maxWidth: "400px",
              width: "90%",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div style={{ marginBottom: "16px" }}>
              <h2
                id="exit-confirmation-title"
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                Unsaved Changes
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--muted-foreground, #6b7280)",
                }}
              >
                You have unsaved changes in the task. Are you sure you want to
                leave without saving?
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <Button
                ref={keepEditingButtonRef}
                variant="outline"
                onClick={handleKeepEditing}
              >
                Keep Editing
              </Button>
              <Button variant="destructive" onClick={resetModal}>
                Discard Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

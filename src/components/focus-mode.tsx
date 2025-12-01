"use client";

import { Check, Minus, Pause, Play, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTimer } from "react-timer-hook";

import { AddTaskModal } from "@/components/add-task-modal";
import { CompletionAnimation } from "@/components/completion-animation";
import { SubtaskList } from "@/components/subtask-list";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { createShortcutHandler } from "@/lib/keyboard-utils";
import { Task } from "@/lib/types";

interface FocusModeProps {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void | Promise<void>;
}

export const FocusMode = ({ task, onClose, onUpdate }: FocusModeProps) => {
  const { projects, tasks, addTask, updateTask, deleteTask, reorderTasks } =
    useTasks();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  // Get subtasks for this task
  const subtasks = tasks
    .filter((t) => t.parentTaskId === task.id)
    .sort((a, b) => a.order - b.order);

  const [timerMinutes, setTimerMinutes] = useState(task.timePeriod || 25);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const timeInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const titleRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize title textarea
  useEffect(() => {
    const textarea = titleRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [title]);

  // Auto-resize description textarea
  useEffect(() => {
    const textarea = descriptionRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [description]);

  // Initialize timer with saved time or default
  const getExpiryTimestamp = (seconds: number) => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + seconds);
    return time;
  };

  const initialSeconds = task.timeLeft ?? (task.timePeriod || 25) * 60;

  const { totalSeconds, seconds, minutes, isRunning, start, pause, restart } =
    useTimer({
      expiryTimestamp: getExpiryTimestamp(initialSeconds),
      autoStart: false,
      onExpire: () => playNotificationSound(),
    });

  // Add task dialog state
  const [showAddTaskDialog, setShowAddTaskDialog] = useState(false);
  const [showFocusModeExitConfirmation, setShowFocusModeExitConfirmation] =
    useState(false);
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const exitButtonRef = useRef<HTMLButtonElement>(null);

  // Initialize audio element
  useEffect(() => {
    // Using a simple beep sound data URL as fallback
    // Users can replace this with their own MP3 file
    audioRef.current = new Audio();
    // Default system beep sound (simple tone)
    audioRef.current.src = "/media/timer-end-sound.mp3";

    // Preload the audio
    audioRef.current.load();

    // Mark as loaded when ready
    audioRef.current.addEventListener("canplaythrough", () => {
      setAudioLoaded(true);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    // Don't handle keys if exit confirmation is showing
    if (showFocusModeExitConfirmation) return;

    const handleKeyDown = createShortcutHandler([
      {
        key: "a",
        handler: () => {
          if (!showAddTaskDialog) {
            setShowAddTaskDialog(true);
          }
        },
        allowInInput: false,
        description: "Add new task",
      },
      {
        key: "Escape",
        handler: (e) => {
          const target = e.target as HTMLElement;
          const isInInput =
            target.tagName === "INPUT" || target.tagName === "TEXTAREA";

          if (!showAddTaskDialog) {
            if (isInInput) {
              // Blur the input field when Escape is pressed
              (target as HTMLInputElement | HTMLTextAreaElement).blur();
            } else {
              // Show exit confirmation if not in an input field
              setShowFocusModeExitConfirmation(true);
            }
          }
        },
        allowInInput: true, // Allow Escape in input fields for blur functionality
        preventDefault: false, // Let Escape work naturally
      },
      {
        key: " ",
        handler: () => {
          if (isRunningRef.current) {
            pause();
            pausedTimeRef.current = totalSecondsRef.current;
          } else if (pausedTimeRef.current !== null) {
            restart(getExpiryTimestamp(pausedTimeRef.current), true);
            pausedTimeRef.current = null;
          } else {
            // Start fresh
            start();
          }
        },
        allowInInput: false,
        description: "Play/pause timer",
      },
    ]);

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showAddTaskDialog, showFocusModeExitConfirmation, pause, restart, start]);

  const playNotificationSound = () => {
    if (audioRef.current && audioLoaded) {
      // Reset to start if already played
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.error("Failed to play notification sound:", err);
        // Fallback to system notification if audio fails
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Timer Complete!", {
            body: `Finished working on: ${task.title}`,
          });
        }
      });
    }
  };

  const handleTimerChange = (delta: number) => {
    const newMinutes = Math.max(1, Math.min(60, timerMinutes + delta));
    setTimerMinutes(newMinutes);
    if (!isRunning) {
      restart(getExpiryTimestamp(newMinutes * 60), false);
      pausedTimeRef.current = null;
    }
  };

  const handleSecondsChange = (delta: number) => {
    const newSeconds = Math.max(0, Math.min(3600, totalSeconds + delta));
    const newMinutes = Math.ceil(newSeconds / 60);
    setTimerMinutes(newMinutes);
    if (!isRunning) {
      restart(getExpiryTimestamp(newSeconds), false);
      pausedTimeRef.current = null;
    }
  };

  const handleTimerInputChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 60) {
      setTimerMinutes(numValue);
      if (!isRunning) {
        restart(getExpiryTimestamp(numValue * 60), false);
        pausedTimeRef.current = null;
      }
    }
  };

  const [editingSection, setEditingSection] = useState<
    "minutes" | "seconds" | null
  >(null);
  const [pendingInput, setPendingInput] = useState("");
  const pausedTimeRef = useRef<number | null>(null);
  const isRunningRef = useRef(isRunning);
  const totalSecondsRef = useRef(totalSeconds);

  // Keep the refs in sync
  useEffect(() => {
    isRunningRef.current = isRunning;
    totalSecondsRef.current = totalSeconds;
  }, [isRunning, totalSeconds]);

  const handleTimeLeftClick = () => {
    const input = timeInputRef.current;
    if (!input) return;

    const cursorPos = input.selectionStart ?? 0;
    const isInMinutes = cursorPos < 3; // Before the colon at position 2

    setEditingSection(isInMinutes ? "minutes" : "seconds");
    setPendingInput("");
  };

  const handleTimeLeftKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const input = timeInputRef.current;
    if (!input) return;

    // Handle backspace/delete
    if (e.key === "Backspace" || e.key === "Delete") {
      setPendingInput("");
      return;
    }

    // Handle arrow keys and tab - navigate between sections
    if (e.key === "ArrowRight" || e.key === "Tab") {
      e.preventDefault();
      setEditingSection("seconds");
      setPendingInput("");
      setTimeout(() => input.setSelectionRange(3, 3), 0);
      return;
    }

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setEditingSection("minutes");
      setPendingInput("");
      setTimeout(() => input.setSelectionRange(0, 0), 0);
      return;
    }

    // Only allow digits
    if (!/^\d$/.test(e.key)) {
      if (e.key.length === 1) {
        e.preventDefault();
      }
      return;
    }

    e.preventDefault();

    const currentValue = input.value;
    const [currentMins, currentSecs] = currentValue
      .split(":")
      .map((s) => s || "00");

    // Determine which section we're editing
    const cursorPos = input.selectionStart ?? 0;
    const activeSection =
      editingSection ?? (cursorPos < 3 ? "minutes" : "seconds");

    if (activeSection === "minutes") {
      // Build up the new input
      const newInput = pendingInput + e.key;
      setPendingInput(newInput);

      if (newInput.length === 1) {
        // First digit of minutes
        const newValue = `${newInput.padStart(2, "0")}:${currentSecs}`;
        input.value = newValue;
        handleTimeLeftChange(newValue, true);
        setTimeout(() => input.setSelectionRange(1, 1), 0);
      } else if (newInput.length === 2) {
        // Second digit of minutes
        const mins = parseInt(newInput, 10);
        if (mins <= 59) {
          const newValue = `${newInput}:${currentSecs}`;
          input.value = newValue;
          handleTimeLeftChange(newValue, true);
          setTimeout(() => input.setSelectionRange(2, 2), 0);
        }
      } else if (newInput.length > 2) {
        // Overflow to seconds
        const minsStr = newInput.slice(0, 2);
        const secsStr = newInput.slice(2, 4);
        const mins = parseInt(minsStr, 10);
        const secs = parseInt(secsStr, 10);

        if (mins <= 59 && secs <= 59) {
          const newValue = `${minsStr}:${secsStr.padStart(2, "0")}`;
          input.value = newValue;
          handleTimeLeftChange(newValue, true);
          setEditingSection("seconds");
          setPendingInput(secsStr);
          setTimeout(
            () =>
              input.setSelectionRange(3 + secsStr.length, 3 + secsStr.length),
            0,
          );
        }
      }
    } else {
      // Editing seconds
      const newInput = pendingInput + e.key;
      setPendingInput(newInput);

      if (newInput.length === 1) {
        // First digit of seconds
        const newValue = `${currentMins}:${newInput.padStart(2, "0")}`;
        input.value = newValue;
        handleTimeLeftChange(newValue, true);
        setTimeout(() => input.setSelectionRange(4, 4), 0);
      } else if (newInput.length >= 2) {
        // Second digit of seconds
        const secs = parseInt(newInput.slice(0, 2), 10);
        if (secs <= 59) {
          const newValue = `${currentMins}:${newInput.slice(0, 2)}`;
          input.value = newValue;
          handleTimeLeftChange(newValue, true);
          setTimeout(() => input.setSelectionRange(5, 5), 0);
          setPendingInput(newInput.slice(0, 2));
        }
      }
    }
  };

  const handleTimeLeftChange = (value: string, wasUserEdit = false) => {
    // Parse MM:SS format
    const parts = value.split(":");
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      if (
        !isNaN(mins) &&
        !isNaN(secs) &&
        mins >= 0 &&
        mins <= 59 &&
        secs >= 0 &&
        secs <= 59
      ) {
        const newTotalSeconds = mins * 60 + secs;
        setTimerMinutes(Math.ceil(newTotalSeconds / 60));

        // Only restart the timer if user is manually editing
        if (wasUserEdit) {
          restart(getExpiryTimestamp(newTotalSeconds), false);
          pausedTimeRef.current = null;
        }
      }
    }
  };

  const handleReset = () => {
    restart(getExpiryTimestamp(timerMinutes * 60), false);
    pausedTimeRef.current = null;
  };

  const handleSave = async () => {
    await onUpdate(task.id, {
      title: title.trim() || task.title,
      description: description.trim() || undefined,
      timePeriod: timerMinutes,
      timeLeft: totalSeconds,
    });
    onClose();
  };

  const handleDone = async () => {
    // Save title, description and timer, then mark as complete
    await onUpdate(task.id, {
      title: title.trim() || task.title,
      description: description.trim() || undefined,
      timePeriod: timerMinutes,
      timeLeft: undefined, // Clear saved time when completing task
      completed: true,
    });
    // Show completion animation
    setShowCompletionAnimation(true);
  };

  const handleAnimationComplete = () => {
    // Close focus mode after animation
    onClose();
  };

  // Auto-focus exit button when focus mode exit dialog opens
  useEffect(() => {
    if (showFocusModeExitConfirmation && exitButtonRef.current) {
      setTimeout(() => {
        exitButtonRef.current?.focus();
      }, 50);
    }
  }, [showFocusModeExitConfirmation]);

  // Handle keyboard events in focus mode exit confirmation dialog
  useEffect(() => {
    if (!showFocusModeExitConfirmation) return;

    const handleExitDialogKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowFocusModeExitConfirmation(false);
      }
    };

    document.addEventListener("keydown", handleExitDialogKeyDown);
    return () =>
      document.removeEventListener("keydown", handleExitDialogKeyDown);
  }, [showFocusModeExitConfirmation, handleSave]);

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const maxSeconds = timerMinutes * 60;
  const percentage =
    maxSeconds > 0 ? ((maxSeconds - totalSeconds) / maxSeconds) * 100 : 0;
  const circumference = 2 * Math.PI * 150; // Updated to match new radius
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        zIndex: 40,
        backgroundColor: "var(--background, white)",
      }}
    >
      {/* Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleSave}
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          zIndex: 10,
        }}
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Left side - Timer */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          borderRight: "1px solid",
          borderColor: "var(--border, #e5e7eb)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: "600px",
            width: "100%",
          }}
        >
          {/* Circular Timer */}
          <div
            style={{
              position: "relative",
              width: "400px",
              height: "400px",
              marginBottom: "48px",
            }}
          >
            {/* Circular progress */}
            <svg
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                transform: "rotate(-90deg)",
              }}
              viewBox="0 0 320 320"
            >
              {/* Background circle */}
              <circle
                cx="160"
                cy="160"
                r="150"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-muted/20"
              />
              {/* Progress circle */}
              <circle
                cx="160"
                cy="160"
                r="150"
                stroke="#f97316"
                strokeWidth="12"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "stroke-dashoffset 1s linear" }}
                strokeLinecap="round"
              />
            </svg>

            {/* Timer display */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <input
                ref={timeInputRef}
                type="text"
                value={formatTime(minutes, seconds)}
                onChange={(e) => handleTimeLeftChange(e.target.value)}
                onKeyDown={handleTimeLeftKeyDown}
                onClick={handleTimeLeftClick}
                disabled={isRunning}
                className="border-none bg-transparent text-center text-7xl font-bold tabular-nums outline-none disabled:cursor-not-allowed"
                style={{ width: "280px" }}
              />
            </div>
          </div>

          {/* Timer controls */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "16px",
              marginBottom: "32px",
            }}
          >
            {/* Minutes control */}
            <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleTimerChange(-1)}
                disabled={isRunning}
                className="h-12 w-12"
              >
                <Minus className="h-5 w-5" />
              </Button>
              <input
                type="number"
                value={timerMinutes}
                onChange={(e) => handleTimerInputChange(e.target.value)}
                disabled={isRunning}
                min="1"
                max="60"
                className="rounded-md border px-4 py-2 text-center text-xl font-medium disabled:cursor-not-allowed disabled:opacity-50"
                style={{ width: "80px" }}
                onFocus={(e) => e.target.select()}
              />
              <div className="text-xl font-medium">
                {timerMinutes === 1 ? "minute" : "minutes"}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleTimerChange(1)}
                disabled={isRunning || timerMinutes >= 60}
                className="h-12 w-12"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* Seconds control */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSecondsChange(-30)}
                className="h-8 px-3 text-sm"
              >
                -30s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSecondsChange(-10)}
                className="h-8 px-3 text-sm"
              >
                -10s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSecondsChange(10)}
                className="h-8 px-3 text-sm"
              >
                +10s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSecondsChange(30)}
                className="h-8 px-3 text-sm"
              >
                +30s
              </Button>
            </div>
          </div>

          {/* Play/Pause and Reset buttons */}
          <div style={{ display: "flex", gap: "16px", marginBottom: "32px" }}>
            <Button
              onClick={() => {
                // Preload audio on first user interaction
                if (!isRunning && audioRef.current && !audioLoaded) {
                  audioRef.current
                    .play()
                    .then(() => {
                      audioRef.current?.pause();
                      if (audioRef.current) {
                        audioRef.current.currentTime = 0;
                      }
                      setAudioLoaded(true);
                    })
                    .catch(() => {
                      // Audio preload failed, but continue anyway
                      setAudioLoaded(false);
                    });
                }
                if (isRunning) {
                  // Pause the timer
                  pause();
                  pausedTimeRef.current = totalSecondsRef.current;
                } else if (pausedTimeRef.current !== null) {
                  // Resume from paused state - restart with saved time
                  restart(getExpiryTimestamp(pausedTimeRef.current), true);
                  pausedTimeRef.current = null;
                } else {
                  // Start fresh
                  start();
                }
              }}
              size="lg"
              style={{
                backgroundColor: "#f97316",
                color: "white",
                paddingLeft: "48px",
                paddingRight: "48px",
                paddingTop: "24px",
                paddingBottom: "24px",
                fontSize: "18px",
              }}
              className="hover:opacity-90"
            >
              {isRunning ? (
                <>
                  <Pause className="mr-2 h-6 w-6" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-6 w-6" />
                  Start
                </>
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              style={{
                paddingLeft: "48px",
                paddingRight: "48px",
                paddingTop: "24px",
                paddingBottom: "24px",
                fontSize: "18px",
              }}
            >
              <RotateCcw className="mr-2 h-6 w-6" />
              Reset
            </Button>
          </div>
        </div>

        {/* Instructions */}
        <div
          style={{
            marginTop: "32px",
            fontSize: "14px",
            textAlign: "center",
            maxWidth: "448px",
            color: "var(--muted-foreground, #6b7280)",
          }}
        >
          <p>
            Press{" "}
            <kbd className="bg-muted rounded px-2 py-1 text-xs">Space</kbd> to
            play/pause
          </p>
          <p style={{ marginTop: "4px" }}>
            Press{" "}
            <kbd className="bg-muted rounded px-2 py-1 text-xs">Ctrl/Cmd+A</kbd>{" "}
            to add a new task
          </p>
          <p style={{ marginTop: "4px" }}>
            Press <kbd className="bg-muted rounded px-2 py-1 text-xs">Esc</kbd>{" "}
            to exit and save
          </p>
        </div>

        {/* Audio file upload hint */}
        <div
          style={{
            marginTop: "16px",
            fontSize: "12px",
            textAlign: "center",
            maxWidth: "448px",
            color: "var(--muted-foreground, #6b7280)",
          }}
        >
          {/* <p>To use a custom notification sound, place your audio file at /public/media/bell-sound.mp3</p> */}
        </div>
      </div>

      {/* Right side - Task details */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: "48px",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            marginBottom: "16px",
          }}
        >
          <div style={{ margin: "0 auto", width: "100%" }}>
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value.trim())}
              placeholder="Task title..."
              rows={1}
              style={{
                fontSize: "36px",
                fontWeight: "bold",
                marginLeft: "-15px",
                width: "100%",
                border: "2px solid transparent",
                borderRadius: "8px",
                padding: "8px 12px",
                backgroundColor: "transparent",
                outline: "none",
                resize: "none",
                overflow: "hidden",
                fontFamily: "inherit",
                lineHeight: "1.2",
              }}
              className="hover:border-border focus:border-primary transition-colors"
            />
            <div
              style={{
                fontSize: "14px",
                color: "var(--muted-foreground, #6b7280)",
              }}
            >
              {task.dueDate && (
                <div style={{ marginBottom: "8px" }}>
                  <span style={{ fontWeight: "500" }}>Due:</span>{" "}
                  {new Date(task.dueDate).toLocaleDateString()}
                </div>
              )}
              {task.projectId && (
                <div style={{ marginBottom: "8px" }}>
                  <span style={{ fontWeight: "500" }}>Project:</span>{" "}
                  {projects.find((p) => p.id === task.projectId)?.name ||
                    task.projectId}
                </div>
              )}
            </div>
          </div>
        </div>
        <div>
          <label
            htmlFor="focus-description"
            style={{
              fontSize: "18px",
              fontWeight: "500",
              marginBottom: "12px",
              display: "block",
            }}
          >
            Description
          </label>
          <textarea
            ref={descriptionRef}
            id="focus-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add notes, thoughts, or details about this task..."
            style={{
              width: "100%",
              padding: "16px",
              marginLeft: "-5px",
              border: "1px solid var(--border, #e5e7eb)",
              borderRadius: "8px",
              resize: "vertical",
              minHeight: "200px",
              fontSize: "16px",
              fontFamily: "inherit",
              lineHeight: "1.5",
              overflow: "hidden",
            }}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </div>

        {/* Subtasks Section */}
        <div style={{ marginTop: "24px" }}>
          <div
            style={{
              fontSize: "18px",
              fontWeight: "500",
              marginBottom: "12px",
              display: "block",
            }}
          >
            Subtasks
          </div>
          <SubtaskList
            subtasks={subtasks}
            onAddSubtask={async (title) => {
              const subtaskId = await addTask(
                title,
                task.projectId,
                undefined,
                false,
                undefined,
                "",
              );
              // Update the newly created subtask to have the parent task ID
              await updateTask(subtaskId, {
                parentTaskId: task.id,
                order: subtasks.length,
              });
            }}
            onRemoveSubtask={(id) => deleteTask(id)}
            onToggleSubtask={(id) => {
              const subtask = subtasks.find((st) => st.id === id);
              if (subtask) {
                updateTask(id, { completed: !subtask.completed });
              }
            }}
            onReorderSubtasks={(reorderedSubtasks) => {
              reorderTasks(
                reorderedSubtasks.map((st, index) => ({ ...st, order: index })),
              );
            }}
          />
        </div>
      </div>

      {/* Add Task Modal */}
      <AddTaskModal
        isOpen={showAddTaskDialog}
        onClose={() => setShowAddTaskDialog(false)}
        defaultProjectId={task.projectId}
      />

      {/* Exit Confirmation Dialog for Focus Mode */}
      {showFocusModeExitConfirmation && (
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
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                Exit Focus Mode?
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--muted-foreground, #6b7280)",
                }}
              >
                Are you sure you want to exit focus mode? Your progress will be
                saved.
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
                variant="outline"
                onClick={() => setShowFocusModeExitConfirmation(false)}
              >
                Stay in Focus Mode
              </Button>
              <Button
                ref={exitButtonRef}
                onClick={() => {
                  setShowFocusModeExitConfirmation(false);
                  handleSave();
                }}
              >
                Exit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Done Button - Bottom Right */}
      <Button
        onClick={handleDone}
        size="lg"
        style={{
          position: "fixed",
          bottom: "32px",
          right: "32px",
          backgroundColor: "#3b82f6",
          color: "white",
          paddingLeft: "32px",
          paddingRight: "32px",
          paddingTop: "16px",
          paddingBottom: "16px",
          fontSize: "16px",
          fontWeight: "600",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          zIndex: 50,
        }}
        className="hover:opacity-90"
      >
        <Check className="mr-2 h-5 w-5" />
        Done
      </Button>

      {/* Completion Animation Overlay */}
      {showCompletionAnimation && (
        <CompletionAnimation onComplete={handleAnimationComplete} />
      )}
    </div>
  );
};

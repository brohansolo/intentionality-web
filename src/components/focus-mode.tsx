"use client";

import { Check, Minus, Pause, Play, Plus, RotateCcw, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { AddTaskModal } from "@/components/add-task-modal";
import { CompletionAnimation } from "@/components/completion-animation";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { Task } from "@/lib/types";

interface FocusModeProps {
  task: Task;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Task>) => void;
}

export const FocusMode = ({ task, onClose, onUpdate }: FocusModeProps) => {
  const { projects } = useTasks();
  const [description, setDescription] = useState(task.description || "");
  const [timerMinutes, setTimerMinutes] = useState(task.timePeriod || 25);
  const [timeLeft, setTimeLeft] = useState((task.timePeriod || 25) * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioLoaded, setAudioLoaded] = useState(false);

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
    audioRef.current.src = "/media/bell-sound.mp3";

    // Preload the audio
    audioRef.current.load();

    // Mark as loaded when ready
    audioRef.current.addEventListener("canplaythrough", () => {
      setAudioLoaded(true);
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Timer countdown logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            playNotificationSound();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keys if exit confirmation is showing
      if (showFocusModeExitConfirmation) return;

      // Check if we're in an input field
      const target = e.target as HTMLElement;
      const isInInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      // 'a' key to add task - works globally with Ctrl/Cmd modifier, or when not in input
      if ((e.key === "a" || e.key === "A") && !showAddTaskDialog) {
        if (e.ctrlKey || e.metaKey || !isInInput) {
          e.preventDefault();
          setShowAddTaskDialog(true);
        }
      } else if (e.key === "Escape" && !showAddTaskDialog) {
        if (isInInput) {
          // Blur the input field when Escape is pressed
          (target as HTMLInputElement | HTMLTextAreaElement).blur();
        } else {
          // Show exit confirmation if not in an input field
          e.preventDefault();
          setShowFocusModeExitConfirmation(true);
        }
      } else if (e.key === " " && e.target === document.body) {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    description,
    timerMinutes,
    showAddTaskDialog,
    showFocusModeExitConfirmation,
  ]);

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
      setTimeLeft(newMinutes * 60);
    }
  };

  const handleSecondsChange = (delta: number) => {
    const newSeconds = Math.max(0, Math.min(3600, timeLeft + delta));
    setTimeLeft(newSeconds);
    // Update timerMinutes to reflect the change
    const newMinutes = Math.ceil(newSeconds / 60);
    setTimerMinutes(newMinutes);
  };

  const handleTimerInputChange = (value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 1 && numValue <= 60) {
      setTimerMinutes(numValue);
      if (!isRunning) {
        setTimeLeft(numValue * 60);
      }
    }
  };

  const handleTimeLeftChange = (value: string) => {
    // Parse MM:SS format
    const parts = value.split(":");
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      if (
        !isNaN(mins) &&
        !isNaN(secs) &&
        mins >= 0 &&
        mins <= 60 &&
        secs >= 0 &&
        secs < 60
      ) {
        const totalSeconds = mins * 60 + secs;
        setTimeLeft(totalSeconds);
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(timerMinutes * 60);
  };

  const handleSave = () => {
    onUpdate(task.id, {
      description: description.trim() || undefined,
      timePeriod: timerMinutes,
    });
    onClose();
  };

  const handleDone = () => {
    // Save description and timer, then mark as complete
    onUpdate(task.id, {
      description: description.trim() || undefined,
      timePeriod: timerMinutes,
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
  }, [showFocusModeExitConfirmation]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const percentage =
    ((timerMinutes * 60 - timeLeft) / (timerMinutes * 60)) * 100;
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
                type="text"
                value={formatTime(timeLeft)}
                onChange={(e) => handleTimeLeftChange(e.target.value)}
                disabled={isRunning}
                className="border-none bg-transparent text-center text-7xl font-bold tabular-nums outline-none disabled:cursor-not-allowed"
                style={{ width: "280px" }}
                onFocus={(e) => e.target.select()}
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
                setIsRunning(!isRunning);
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
        <div style={{ maxWidth: "768px", margin: "0 auto", width: "100%" }}>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              marginBottom: "32px",
            }}
          >
            {task.title}
          </h1>

          <div style={{ marginBottom: "16px" }}>
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
              id="focus-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add notes, thoughts, or details about this task..."
              style={{
                width: "100%",
                padding: "16px",
                border: "1px solid var(--border, #e5e7eb)",
                borderRadius: "8px",
                resize: "none",
                height: "384px",
                fontSize: "16px",
                fontFamily: "inherit",
                lineHeight: "1.5",
              }}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>

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

"use client";

import { GripVertical, X } from "lucide-react";
import { KeyboardEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Task } from "@/lib/types";

interface SubtaskListProps {
  subtasks: Task[];
  onAddSubtask: (title: string) => void;
  onRemoveSubtask: (id: string) => void;
  onToggleSubtask: (id: string) => void;
  onReorderSubtasks: (subtasks: Task[]) => void;
}

export function SubtaskList({
  subtasks,
  onAddSubtask,
  onRemoveSubtask,
  onToggleSubtask,
  onReorderSubtasks,
}: SubtaskListProps) {
  const [inputValue, setInputValue] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleAddSubtask = () => {
    if (inputValue.trim()) {
      onAddSubtask(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newSubtasks = [...subtasks];
    const draggedItem = newSubtasks[draggedIndex];
    newSubtasks.splice(draggedIndex, 1);
    newSubtasks.splice(index, 0, draggedItem);

    onReorderSubtasks(newSubtasks);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-3">
      <Input
        type="text"
        placeholder="Add a subtask..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full"
      />

      {subtasks.length > 0 && (
        <ul className="space-y-2">
          {subtasks.map((subtask, index) => (
            <li
              key={subtask.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="bg-card hover:bg-accent/50 flex cursor-move items-center gap-2 rounded-md border p-2"
            >
              <GripVertical className="text-muted-foreground h-4 w-4 flex-shrink-0" />

              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => onToggleSubtask(subtask.id)}
                className="h-4 w-4 flex-shrink-0 cursor-pointer rounded border-gray-300"
              />

              <span
                className={`flex-1 text-sm ${
                  subtask.completed ? "text-muted-foreground line-through" : ""
                }`}
              >
                {subtask.title}
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => onRemoveSubtask(subtask.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

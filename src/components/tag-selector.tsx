"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";

interface TagSelectorProps {
  currentTags: string[];
  onAddTag: (tagId: string) => void;
  onRemoveTag: (tagId: string) => void;
  onCancel?: () => void;
}

export const TagSelector = ({
  currentTags,
  onAddTag,
  onRemoveTag,
  onCancel,
}: TagSelectorProps) => {
  const { tags, getOrCreateTag } = useTasks();
  const [showInput, setShowInput] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter out tags that are already assigned
  const availableTags = tags.filter((tag) => !currentTags.includes(tag.id));

  const handleAddExistingTag = (tagId: string) => {
    onAddTag(tagId);
    setShowDropdown(false);
  };

  const handleCreateNewTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTagInput.trim()) {
      const tag = getOrCreateTag(newTagInput.trim());
      onAddTag(tag.id);
      setNewTagInput("");
      setShowInput(false);
      setShowDropdown(false);
    }
  };

  const handleCancel = () => {
    setShowInput(false);
    setShowDropdown(false);
    setNewTagInput("");
    onCancel?.();
  };

  // Handle escape key to close dropdown
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (showDropdown || showInput)) {
        handleCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [showDropdown, showInput]);

  // Get tag objects for current tags
  const currentTagObjects = currentTags
    .map((tagId) => tags.find((t) => t.id === tagId))
    .filter(Boolean);

  return (
    <div className="space-y-2">
      {/* Current Tags */}
      <div className="flex flex-wrap gap-2">
        {currentTagObjects.map(
          (tag) =>
            tag && (
              <div
                key={tag.id}
                className="bg-primary/10 text-primary inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium"
                style={
                  tag.color
                    ? { backgroundColor: `${tag.color}20`, color: tag.color }
                    : undefined
                }
              >
                {tag.name}
                <button
                  onClick={() => onRemoveTag(tag.id)}
                  className="hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ),
        )}

        {/* Add Tag Button/Dropdown */}
        {!showInput && !showDropdown ? (
          <button
            onClick={() => setShowDropdown(true)}
            className="hover:bg-muted inline-flex items-center gap-1 rounded border border-dashed px-2 py-1 text-xs font-medium"
          >
            <Plus className="h-3 w-3" />
            Add tag
          </button>
        ) : null}
      </div>

      {/* Tag Dropdown */}
      {showDropdown && !showInput && (
        <div className="bg-background rounded-lg border p-3 shadow-lg">
          <div className="mb-2 text-xs font-medium">
            Select existing tag or create new
          </div>

          {/* Existing Tags */}
          {availableTags.length > 0 && (
            <div className="mb-3">
              <div className="text-muted-foreground mb-2 text-xs">
                Existing Tags
              </div>
              <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                {availableTags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleAddExistingTag(tag.id)}
                    className="rounded px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80"
                    style={
                      tag.color
                        ? {
                            backgroundColor: `${tag.color}20`,
                            color: tag.color,
                          }
                        : { backgroundColor: "var(--muted)" }
                    }
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Create New Tag Button */}
          <div className="border-t pt-2">
            <button
              onClick={() => setShowInput(true)}
              className="hover:bg-muted flex w-full items-center justify-center gap-1 rounded-md border border-dashed p-2 text-xs transition-colors"
            >
              <Plus className="h-3 w-3" />
              Create New Tag
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* New Tag Input */}
      {showInput && (
        <form
          onSubmit={handleCreateNewTag}
          className="bg-background rounded-lg border p-3 shadow-lg"
        >
          <div className="mb-2 text-xs font-medium">Create new tag</div>
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            placeholder="Tag name..."
            className="mb-3 w-full rounded-md border p-2 text-xs"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                handleCancel();
              }
            }}
          />
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="h-7 flex-1 text-xs">
              Create & Add
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => {
                setShowInput(false);
                setShowDropdown(true);
                setNewTagInput("");
              }}
            >
              Back
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

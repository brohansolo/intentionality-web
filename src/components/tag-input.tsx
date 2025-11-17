"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTasks } from "@/hooks/use-tasks";

interface TagInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export const TagInput = ({ selectedTags, onTagsChange }: TagInputProps) => {
  const { tags, getOrCreateTag } = useTasks();
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showCreateTagConfirmation, setShowCreateTagConfirmation] =
    useState(false);
  const [pendingTagName, setPendingTagName] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Get all available tags (not yet selected)
  const suggestedTags = tags.filter((tag) => !selectedTags.includes(tag.id));

  const handleAddTag = (tagName: string) => {
    if (!tagName.trim()) return;

    // Check if tag already exists
    const existingTag = tags.find(
      (t) => t.name.toLowerCase() === tagName.trim().toLowerCase(),
    );

    if (existingTag) {
      // Tag exists, add it directly
      if (!selectedTags.includes(existingTag.id)) {
        onTagsChange([...selectedTags, existingTag.id]);
      }
      setTagInput("");
      setShowTagSuggestions(true); // Keep dropdown open
      tagInputRef.current?.focus();
    } else {
      // Tag doesn't exist, show confirmation
      setPendingTagName(tagName.trim());
      setShowCreateTagConfirmation(true);
    }
  };

  const handleConfirmCreateTag = () => {
    const tag = getOrCreateTag(pendingTagName);
    if (!selectedTags.includes(tag.id)) {
      onTagsChange([...selectedTags, tag.id]);
    }
    setTagInput("");
    setPendingTagName("");
    setShowCreateTagConfirmation(false);
    setShowTagSuggestions(true); // Keep dropdown open
    tagInputRef.current?.focus();
  };

  const handleCancelCreateTag = () => {
    setPendingTagName("");
    setShowCreateTagConfirmation(false);
    tagInputRef.current?.focus();
  };

  const handleSelectSuggestedTag = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      onTagsChange([...selectedTags, tagId]);
    }
    setTagInput("");
    setShowTagSuggestions(true); // Keep dropdown open
    tagInputRef.current?.focus();
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((id) => id !== tagId));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag(tagInput);
    } else if (e.key === "Backspace" && !tagInput && selectedTags.length > 0) {
      e.preventDefault();
      onTagsChange(selectedTags.slice(0, -1));
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (showTagSuggestions) {
        setShowTagSuggestions(false);
      }
    }
  };

  return (
    <>
      <div style={{ display: "grid", gap: "8px", position: "relative" }}>
        <label
          htmlFor="task-tags"
          style={{ fontSize: "14px", fontWeight: "500" }}
        >
          Tags
        </label>
        <div
          style={{
            border: "1px solid var(--input, #e5e7eb)",
            borderRadius: "6px",
            padding: "8px 16px",
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            alignItems: "center",
            minHeight: "42px",
          }}
        >
          {selectedTags.map((tagId) => {
            const tag = tags.find((t) => t.id === tagId);
            if (!tag) return null;
            return (
              <Badge
                key={tagId}
                variant="secondary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  paddingRight: "4px",
                  backgroundColor: tag.color ? `${tag.color}20` : undefined,
                  borderColor: tag.color || undefined,
                  color: tag.color || undefined,
                }}
              >
                {tag.name}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tagId)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.7,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity = "0.7";
                  }}
                >
                  <X size={14} />
                </button>
              </Badge>
            );
          })}
          <Input
            id="task-tags"
            ref={tagInputRef}
            value={tagInput}
            onChange={(e) => {
              setTagInput(e.target.value);
            }}
            onKeyDown={handleTagInputKeyDown}
            onFocus={() => {
              setShowTagSuggestions(true);
            }}
            onBlur={() => {
              // Delay to allow click on suggestions
              setTimeout(() => setShowTagSuggestions(false), 200);
            }}
            placeholder={selectedTags.length === 0 ? "Add tags..." : ""}
            style={{
              border: "none",
              outline: "none",
              boxShadow: "none",
              flex: 1,
              minWidth: "100px",
              padding: "0",
              height: "24px",
            }}
          />
        </div>
        {showTagSuggestions && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: "4px",
              backgroundColor: "var(--background, white)",
              border: "1px solid var(--input, #e5e7eb)",
              borderRadius: "6px",
              boxShadow:
                "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
              maxHeight: "200px",
              overflowY: "auto",
              zIndex: 10,
            }}
          >
            {suggestedTags.length > 0 ? (
              suggestedTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleSelectSuggestedTag(tag.id)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    textAlign: "left",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: "14px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor =
                      "var(--accent, #f3f4f6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Badge
                    variant="secondary"
                    style={{
                      backgroundColor: tag.color ? `${tag.color}20` : undefined,
                      borderColor: tag.color || undefined,
                      color: tag.color || undefined,
                    }}
                  >
                    {tag.name}
                  </Badge>
                </button>
              ))
            ) : (
              <div
                style={{
                  padding: "8px 12px",
                  fontSize: "14px",
                  color: "var(--muted-foreground, #6b7280)",
                }}
              >
                No matching tags
              </div>
            )}
          </div>
        )}
        <p
          style={{
            fontSize: "12px",
            color: "var(--muted-foreground, #6b7280)",
          }}
        >
          Press Enter to add a tag
        </p>
      </div>

      {/* Create Tag Confirmation Dialog */}
      {showCreateTagConfirmation && (
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
            zIndex: 202,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-tag-confirmation-title"
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
                id="create-tag-confirmation-title"
                style={{
                  fontSize: "18px",
                  fontWeight: "600",
                  marginBottom: "8px",
                }}
              >
                Create New Tag
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--muted-foreground, #6b7280)",
                }}
              >
                Tag &quot;{pendingTagName}&quot; doesn&apos;t exist. Do you want
                to create it?
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <Button variant="outline" onClick={handleCancelCreateTag}>
                Cancel
              </Button>
              <Button onClick={handleConfirmCreateTag}>Create Tag</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

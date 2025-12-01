"use client";

import { X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createShortcutHandler } from "@/lib/keyboard-utils";

interface ScratchpadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScratchpadModal({ open, onOpenChange }: ScratchpadModalProps) {
  const [text, setText] = useState("");
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const discardButtonRef = useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasContent = useCallback(() => {
    return text.trim().length > 0;
  }, [text]);

  const handleKeepEditing = useCallback(() => {
    setShowExitConfirmation(false);
  }, []);

  const handleDiscard = useCallback(() => {
    setText("");
    setShowExitConfirmation(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      console.log("[ScratchpadModal] handleOpenChange called", {
        newOpen,
        hasContent: hasContent(),
        text,
      });
      if (!newOpen && hasContent()) {
        // Show confirmation dialog if there's content
        console.log(
          "[ScratchpadModal] Closing with content - showing confirmation",
        );
        setShowExitConfirmation(true);
        // Don't call onOpenChange yet - wait for user to confirm
      } else {
        // Close directly if no content
        console.log("[ScratchpadModal] Closing without content");
        setText("");
        setShowExitConfirmation(false);
        onOpenChange(newOpen);
      }
    },
    [hasContent, onOpenChange],
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = createShortcutHandler([
      {
        key: "Escape",
        handler: () => {
          if (showExitConfirmation) {
            // In confirmation dialog: Escape keeps editing
            handleKeepEditing();
          } else {
            // In main scratchpad: Escape closes (with confirmation if content)
            handleOpenChange(false);
          }
        },
        allowInInput: true,
        description: "Close scratchpad or cancel confirmation",
      },
      {
        key: "Enter",
        handler: () => {
          if (showExitConfirmation) {
            // In confirmation dialog: Enter discards
            handleDiscard();
          }
          // Don't handle Enter in the main scratchpad - let it work normally in textarea
        },
        allowInInput: false, // Only allow when NOT in input (i.e., when confirmation is showing)
        description: "Discard scratchpad changes",
      },
    ]);

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    open,
    showExitConfirmation,
    handleKeepEditing,
    handleOpenChange,
    handleDiscard,
  ]);

  // Auto-focus textarea when scratchpad opens
  useEffect(() => {
    if (open && !showExitConfirmation && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [open, showExitConfirmation]);

  // Auto-focus discard button when confirmation dialog opens
  useEffect(() => {
    if (showExitConfirmation && discardButtonRef.current) {
      setTimeout(() => {
        discardButtonRef.current?.focus();
      }, 50);
    }
  }, [showExitConfirmation]);

  if (!open && !showExitConfirmation) return null;

  return (
    <>
      {/* Main Scratchpad Modal */}
      <div
        role="button"
        tabIndex={-1}
        aria-label="Close scratchpad"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: open ? "flex" : "none",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 200,
        }}
        onClick={(e) => {
          // Close when clicking the backdrop (only if confirmation not showing)
          if (!showExitConfirmation && e.target === e.currentTarget) {
            handleOpenChange(false);
          }
        }}
        onKeyDown={(e) => {
          // Handle Enter or Space to close (standard button behavior)
          if (
            !showExitConfirmation &&
            e.target === e.currentTarget &&
            (e.key === "Enter" || e.key === " ")
          ) {
            e.preventDefault();
            handleOpenChange(false);
          }
        }}
      >
        <div
          style={{
            backgroundColor: "var(--background, white)",
            borderRadius: "8px",
            padding: "24px",
            maxWidth: "800px",
            width: "90%",
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          {/* Close button */}
          <button
            onClick={() => handleOpenChange(false)}
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "4px",
              color: "var(--muted-foreground, #6b7280)",
            }}
            className="hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>

          <div style={{ marginBottom: "16px" }}>
            <h2
              style={{
                fontSize: "18px",
                fontWeight: "600",
                marginBottom: "8px",
              }}
            >
              Scratch Pad
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--muted-foreground, #6b7280)",
              }}
            >
              Use this space for quick notes and thoughts.
            </p>
          </div>
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your notes here..."
            className="min-h-[400px] w-full resize-y"
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {/* Exit Confirmation Dialog - shown on top */}
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
            zIndex: 9999,
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
                Discard changes?
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--muted-foreground, #6b7280)",
                }}
              >
                You have unsaved notes in the scratch pad. Are you sure you want
                to close and discard them?
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "flex-end",
              }}
            >
              <Button variant="outline" onClick={handleKeepEditing}>
                Keep Editing
              </Button>
              <Button
                ref={discardButtonRef}
                variant="destructive"
                onClick={handleDiscard}
              >
                Discard
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

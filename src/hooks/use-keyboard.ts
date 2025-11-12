"use client";

import { useEffect } from "react";

interface UseKeyboardProps {
  onCreateTask: () => void;
}

export const useKeyboard = ({ onCreateTask }: UseKeyboardProps) => {
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Check for 't' key
      if (event.key.toLowerCase() === "a") {
        event.preventDefault();
        onCreateTask();
      }
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [onCreateTask]);
};

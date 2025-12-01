/**
 * Centralized keyboard shortcut utilities
 * Provides consistent handling of keyboard shortcuts across the application
 * while preserving standard text editing operations (Cmd/Ctrl+A, Cmd/Ctrl+C, etc.)
 */

/**
 * Check if the event target is an input field where text editing should be preserved
 */
export function isInInputField(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  if (!target) return false;

  const tagName = target.tagName;
  const isContentEditable = target.isContentEditable;

  return (
    tagName === "INPUT" ||
    tagName === "TEXTAREA" ||
    tagName === "SELECT" ||
    isContentEditable
  );
}

/**
 * Check if the event is a standard text editing command that should be preserved
 * Examples: Cmd/Ctrl+A (select all), Cmd/Ctrl+C (copy), Cmd/Ctrl+V (paste), etc.
 */
export function isStandardEditingCommand(event: KeyboardEvent): boolean {
  const hasModifier = event.ctrlKey || event.metaKey;
  if (!hasModifier) return false;

  const key = event.key.toLowerCase();

  // Standard editing commands that should never be intercepted in input fields
  const editingKeys = [
    "a", // Select all
    "c", // Copy
    "x", // Cut
    "v", // Paste
    "z", // Undo
    "y", // Redo (Windows)
    "arrowleft", // Move cursor to start (macOS)
    "arrowright", // Move cursor to end (macOS)
    "arrowup", // Move cursor to start of document (macOS)
    "arrowdown", // Move cursor to end of document (macOS)
  ];

  return editingKeys.includes(key);
}

/**
 * Check if a keyboard shortcut should be handled
 * Returns true only if:
 * 1. The event is not in an input field, OR
 * 2. The event is in an input field but is NOT a standard editing command
 */
export function shouldHandleShortcut(
  event: KeyboardEvent,
  options: {
    allowInInput?: boolean; // Allow this shortcut even in input fields
    requireModifier?: boolean; // Require Cmd/Ctrl to be pressed
  } = {},
): boolean {
  const { allowInInput = false, requireModifier = false } = options;

  // If modifier is required and not present, don't handle
  if (requireModifier && !event.ctrlKey && !event.metaKey) {
    return false;
  }

  const inInput = isInInputField(event);

  // If not in input field, always handle (unless it requires a modifier that's not present)
  if (!inInput) {
    return true;
  }

  // If in input field and shortcut is allowed there, check if it's a standard editing command
  if (allowInInput) {
    // Don't handle if it's a standard editing command
    return !isStandardEditingCommand(event);
  }

  // If in input field and shortcut is not allowed there, don't handle
  return false;
}

/**
 * Higher-order function to create a keyboard event handler with proper input field detection
 *
 * @param handler - The function to call when the shortcut should be handled
 * @param options - Configuration for when to handle the shortcut
 * @returns A keyboard event handler function
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   const handleKeyDown = createKeyboardHandler(
 *     (e) => {
 *       if (e.key === 'a' || e.key === 'A') {
 *         openAddTaskModal();
 *       }
 *     },
 *     { allowInInput: false }
 *   );
 *
 *   document.addEventListener('keydown', handleKeyDown);
 *   return () => document.removeEventListener('keydown', handleKeyDown);
 * }, []);
 * ```
 */
export function createKeyboardHandler(
  handler: (event: KeyboardEvent) => void,
  options: {
    allowInInput?: boolean;
    requireModifier?: boolean;
  } = {},
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    if (shouldHandleShortcut(event, options)) {
      handler(event);
    }
  };
}

/**
 * Check if a key matches the expected key (case-insensitive)
 */
export function isKey(event: KeyboardEvent, key: string): boolean {
  return event.key.toLowerCase() === key.toLowerCase();
}

/**
 * Check if the event has Cmd (macOS) or Ctrl (Windows/Linux) pressed
 */
export function hasModKey(event: KeyboardEvent): boolean {
  return event.ctrlKey || event.metaKey;
}

/**
 * Keyboard shortcut handler configuration
 */
export interface ShortcutConfig {
  key: string;
  handler: (event: KeyboardEvent) => void;
  ctrlOrCmd?: boolean; // Require Ctrl/Cmd modifier
  shift?: boolean; // Require Shift modifier
  alt?: boolean; // Require Alt modifier
  allowInInput?: boolean; // Allow this shortcut even in input fields
  preventDefault?: boolean; // Prevent default browser behavior
  description?: string; // Human-readable description for documentation
}

/**
 * Create a keyboard event handler that handles multiple shortcuts
 *
 * @example
 * ```tsx
 * const handleKeyDown = createShortcutHandler([
 *   {
 *     key: 'a',
 *     ctrlOrCmd: true,
 *     handler: () => openAddTaskModal(),
 *     allowInInput: false,
 *     description: 'Open add task modal'
 *   },
 *   {
 *     key: 's',
 *     handler: () => openScratchpad(),
 *     allowInInput: false,
 *     description: 'Open scratchpad'
 *   }
 * ]);
 * ```
 */
export function createShortcutHandler(
  shortcuts: ShortcutConfig[],
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    for (const shortcut of shortcuts) {
      // Check if key matches
      if (!isKey(event, shortcut.key)) {
        continue;
      }

      // Check modifiers
      const hasRequiredCtrlOrCmd = shortcut.ctrlOrCmd
        ? hasModKey(event)
        : !event.ctrlKey && !event.metaKey;
      const hasRequiredShift = shortcut.shift
        ? event.shiftKey
        : !event.shiftKey;
      const hasRequiredAlt = shortcut.alt ? event.altKey : !event.altKey;

      if (!hasRequiredCtrlOrCmd || !hasRequiredShift || !hasRequiredAlt) {
        continue;
      }

      // Check if we should handle this shortcut
      if (
        !shouldHandleShortcut(event, {
          allowInInput: shortcut.allowInInput,
          requireModifier: shortcut.ctrlOrCmd,
        })
      ) {
        continue;
      }

      // Prevent default if requested
      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }

      // Handle the shortcut
      shortcut.handler(event);
      break; // Only handle the first matching shortcut
    }
  };
}

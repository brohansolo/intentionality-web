"use client";

import { FileIcon, FilePlus } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DB_PATH_KEY = "intentionality_db_path";

export const SettingsDialog = ({
  open,
  onOpenChange,
}: SettingsDialogProps) => {
  const [dbPath, setDbPath] = useState<string | null>(null);

  // Load database path from localStorage on mount
  useEffect(() => {
    const savedPath = localStorage.getItem(DB_PATH_KEY);
    setDbPath(savedPath);
  }, []);

  // Save database path to localStorage
  const saveDbPath = (path: string | null) => {
    if (path) {
      localStorage.setItem(DB_PATH_KEY, path);
    } else {
      localStorage.removeItem(DB_PATH_KEY);
    }
    setDbPath(path);
  };

  const handleSelectExistingFile = async () => {
    try {
      // @ts-expect-error - File System Access API may not be in TypeScript types
      const [fileHandle] = await window.showOpenFilePicker({
        types: [
          {
            description: "SQLite Database",
            accept: {
              "application/x-sqlite3": [".db", ".sqlite", ".sqlite3"],
            },
          },
        ],
        multiple: false,
      });

      if (fileHandle) {
        // For now, we'll store the file name. In a full implementation,
        // you'd store a handle or path that can be used to access the file
        saveDbPath(fileHandle.name);
      }
    } catch (err) {
      // User cancelled or browser doesn't support File System Access API
      console.log("File selection cancelled or not supported:", err);
    }
  };

  const handleCreateNewFile = async () => {
    try {
      // @ts-expect-error - File System Access API may not be in TypeScript types
      const fileHandle = await window.showSaveFilePicker({
        suggestedName: "intentionality.db",
        types: [
          {
            description: "SQLite Database",
            accept: {
              "application/x-sqlite3": [".db", ".sqlite", ".sqlite3"],
            },
          },
        ],
      });

      if (fileHandle) {
        // Create an empty file
        const writable = await fileHandle.createWritable();
        await writable.close();

        // Store the file name
        saveDbPath(fileHandle.name);
      }
    } catch (err) {
      // User cancelled or browser doesn't support File System Access API
      console.log("File creation cancelled or not supported:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Configure your application preferences
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Task Database Location Setting */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-shrink-0">
              <h3 className="text-sm font-medium">Task Database Location</h3>
              <p className="text-muted-foreground text-xs">
                Choose where to store your task database
              </p>
            </div>

            <div className="flex flex-1 items-center gap-2">
              <div className="bg-muted flex-1 rounded-md border px-3 py-2 text-sm">
                {dbPath || (
                  <span className="text-muted-foreground italic">
                    No database selected
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleSelectExistingFile}
                title="Select existing database"
              >
                <FileIcon className="h-4 w-4" />
              </Button>

              <Button
                variant="outline"
                size="icon"
                onClick={handleCreateNewFile}
                title="Create new database"
              >
                <FilePlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

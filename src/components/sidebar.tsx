"use client";

import {
  ChevronDown,
  ChevronRight,
  Edit2,
  GripVertical,
  Palette,
  Plus,
  Settings,
  Tag,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { SettingsDialog } from "@/components/settings-dialog";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { cn } from "@/lib/utils";

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
  const {
    projects,
    addProject,
    updateProject,
    reorderProjects,
    updateTask,
    tags,
    addTag,
    updateTag,
    deleteTag,
    addToToday,
    isInToday,
  } = useTasks();
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [draggedProject, setDraggedProject] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [dragOverProject, setDragOverProject] = useState<string | null>(null);
  const [dragOverToday, setDragOverToday] = useState(false);
  const [dropIndicatorIndex, setDropIndicatorIndex] = useState<number | null>(
    null,
  );
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editingTagName, setEditingTagName] = useState("");
  const [newGlobalTag, setNewGlobalTag] = useState("");
  const [showAddGlobalTag, setShowAddGlobalTag] = useState(false);
  const [colorPickerTag, setColorPickerTag] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Preset colors for quick selection
  const presetColors = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#eab308",
    "#84cc16",
    "#22c55e",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#0ea5e9",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
    "#f43f5e",
    "#64748b",
    "#6b7280",
    "#000000",
  ];

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (projectName.trim()) {
      addProject(projectName.trim());
      setProjectName("");
      setIsAddingProject(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProject(projectId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();

    // Only show drop indicator for project drags, not task drags
    if (draggedProject) {
      e.dataTransfer.dropEffect = "move";
      setDropIndicatorIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedProject) return;

    // Work with only active (non-completed) projects
    const activeProjects = projects.filter((p) => !p.completed);
    const completedProjects = projects.filter((p) => p.completed);

    const draggedIndex = activeProjects.findIndex(
      (p) => p.id === draggedProject,
    );
    if (draggedIndex === -1 || draggedIndex === dropIndex) return;

    // Adjust dropIndex when dragging downward
    let adjustedDropIndex = dropIndex;
    if (draggedIndex < dropIndex) {
      adjustedDropIndex = dropIndex - 1;
    }

    // Reorder only the active projects
    const reorderedActive = [...activeProjects];
    const [draggedItem] = reorderedActive.splice(draggedIndex, 1);
    reorderedActive.splice(adjustedDropIndex, 0, draggedItem);

    // Combine active and completed projects
    const reorderedProjects = [...reorderedActive, ...completedProjects];

    reorderProjects(reorderedProjects);
    setDraggedProject(null);
    setDropIndicatorIndex(null);
  };

  const handleStartEditing = (project: { id: string; name: string }) => {
    setEditingProject(project.id);
    setEditingName(project.name);
  };

  const handleSaveEdit = () => {
    if (editingProject && editingName.trim()) {
      updateProject(editingProject, { name: editingName.trim() });
    }
    setEditingProject(null);
    setEditingName("");
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
    setEditingName("");
  };

  const handleTaskDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if this is a task drag (not a project drag)
    // dataTransfer.types contains lowercase mime types, so check for 'taskid' or 'text/plain'
    const isTaskDrag = e.dataTransfer.types.some(
      (type) => type.toLowerCase().includes("taskid") || type === "text/plain",
    );
    if (isTaskDrag && !draggedProject) {
      e.dataTransfer.dropEffect = "move";
      setDragOverProject(projectId);
    }
  };

  const handleTaskDrop = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId) {
      updateTask(taskId, { projectId });
    }
    setDragOverProject(null);
  };

  const handleDragLeave = () => {
    setDragOverProject(null);
  };

  const handleDragEnd = () => {
    setDraggedProject(null);
    setDropIndicatorIndex(null);
  };

  const handleTodayDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Check if this is a task drag (not a project drag)
    const isTaskDrag = e.dataTransfer.types.some(
      (type) => type.toLowerCase().includes("taskid") || type === "text/plain",
    );
    if (isTaskDrag && !draggedProject) {
      e.dataTransfer.dropEffect = "move";
      setDragOverToday(true);
    }
  };

  const handleTodayDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData("taskId");
    if (taskId && !isInToday(taskId)) {
      addToToday(taskId);
      onViewChange("today"); // Optionally switch to Today view
    }
    setDragOverToday(false);
  };

  const handleTodayDragLeave = () => {
    setDragOverToday(false);
  };

  return (
    <div
      className="bg-muted/30 sticky top-0 h-screen overflow-y-auto"
      style={{
        width: "256px",
        borderRight: "1px solid",
        borderColor: "var(--border, #e5e7eb)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <button
          onClick={() => onViewChange("today")}
          onDragOver={handleTodayDragOver}
          onDrop={handleTodayDrop}
          onDragLeave={handleTodayDragLeave}
          className={cn(
            "hover:bg-muted w-full cursor-pointer rounded-md p-2 text-left transition-colors",
            currentView === "today" && "bg-muted font-medium",
            dragOverToday && "bg-primary/10 ring-primary ring-2",
          )}
        >
          Today
        </button>

        <button
          onClick={() => onViewChange("inbox")}
          className={cn(
            "hover:bg-muted w-full cursor-pointer rounded-md p-2 text-left transition-colors",
            currentView === "inbox" && "bg-muted font-medium",
          )}
        >
          Inbox
        </button>

        {/* <button
          onClick={() => onViewChange("next-steps")}
          className={cn(
            "w-full text-left p-2 rounded-md hover:bg-muted transition-colors cursor-pointer",
            currentView === "next-steps" && "bg-muted font-medium"
          )}
        >
          Next Steps
        </button> */}

        <button
          onClick={() => onViewChange("daily-tasks")}
          className={cn(
            "hover:bg-muted w-full cursor-pointer rounded-md p-2 text-left transition-colors",
            currentView === "daily-tasks" && "bg-muted font-medium",
          )}
        >
          Dailies
        </button>

        <button
          onClick={() => onViewChange("all-tasks")}
          className={cn(
            "hover:bg-muted w-full cursor-pointer rounded-md p-2 text-left transition-colors",
            currentView === "all-tasks" && "bg-muted font-medium",
          )}
        >
          All Tasks
        </button>

        <div className="pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-muted-foreground text-sm font-medium">
              Projects
            </h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsAddingProject(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {isAddingProject && (
            <form onSubmit={handleAddProject} className="mb-2">
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full rounded-md border p-2 text-sm"
                // eslint-disable-next-line jsx-a11y/no-autofocus
                autoFocus
                onBlur={() => {
                  if (!projectName.trim()) {
                    setIsAddingProject(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsAddingProject(false);
                    setProjectName("");
                  }
                }}
              />
            </form>
          )}

          <div className="space-y-1">
            {projects
              .filter((p) => !p.completed)
              .map((project, index) => (
                <div key={project.id}>
                  {/* Drop indicator line */}
                  {dropIndicatorIndex === index && (
                    <div className="bg-primary my-1 h-0.5 rounded-full" />
                  )}

                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, project.id)}
                    onDragOver={(e) => {
                      handleDragOver(e, index);
                      handleTaskDragOver(e, project.id);
                    }}
                    onDrop={(e) => {
                      // Try to get taskId data first to determine if it's a task drag
                      const taskId = e.dataTransfer.getData("taskId");
                      if (taskId) {
                        // It's a task being dragged (from inbox or other views)
                        handleTaskDrop(e, project.id);
                      } else {
                        // It's a project being reordered
                        handleDrop(e, index);
                      }
                    }}
                    onDragEnd={handleDragEnd}
                    onDragLeave={handleDragLeave}
                    className={cn(
                      "group transition-colors",
                      dragOverProject === project.id &&
                        "bg-primary/10 rounded-md",
                      draggedProject === project.id && "opacity-50",
                    )}
                  >
                    {editingProject === project.id ? (
                      <div className="flex items-center gap-1">
                        <div className="cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                          <GripVertical className="text-muted-foreground h-3 w-3" />
                        </div>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSaveEdit();
                          }}
                          className="flex-1"
                        >
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            className="w-full rounded-md border p-2 text-sm"
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus
                            onBlur={handleCancelEdit}
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                handleCancelEdit();
                              }
                            }}
                          />
                        </form>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <div className="cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing">
                          <GripVertical className="text-muted-foreground h-3 w-3" />
                        </div>
                        <button
                          onClick={() => onViewChange(project.id)}
                          onDoubleClick={() => handleStartEditing(project)}
                          className={cn(
                            "hover:bg-muted flex-1 rounded-md p-2 text-left text-sm transition-colors hover:cursor-pointer",
                            currentView === project.id &&
                              "bg-muted font-medium",
                          )}
                        >
                          {project.name}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Drop indicator at the end */}
                  {dropIndicatorIndex === index + 1 &&
                    index ===
                      projects.filter((p) => !p.completed).length - 1 && (
                      <div className="bg-primary my-1 h-0.5 rounded-full" />
                    )}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Tag Management Section */}
      <div
        style={{
          paddingTop: "16px",
          borderTop: "1px solid var(--border, #e5e7eb)",
          marginTop: "16px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setShowTagManagement(!showTagManagement)}
          className="hover:bg-muted flex w-full items-center justify-between rounded-md p-2 text-left transition-colors"
        >
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span className="text-sm">Tags</span>
          </div>
          {showTagManagement ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>

        {showTagManagement && (
          <div className="mt-2 space-y-2 px-2">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="group hover:bg-muted/50 relative flex items-center gap-2 rounded-md p-2 transition-colors"
              >
                {editingTag === tag.id ? (
                  <div className="flex flex-1 gap-1">
                    <input
                      type="text"
                      value={editingTagName}
                      onChange={(e) => setEditingTagName(e.target.value)}
                      className="flex-1 rounded border p-1 text-xs"
                      // eslint-disable-next-line jsx-a11y/no-autofocus
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          if (editingTagName.trim()) {
                            updateTag(tag.id, { name: editingTagName.trim() });
                          }
                          setEditingTag(null);
                        } else if (e.key === "Escape") {
                          setEditingTag(null);
                        }
                      }}
                      onBlur={() => {
                        if (editingTagName.trim()) {
                          updateTag(tag.id, { name: editingTagName.trim() });
                        }
                        setEditingTag(null);
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <div
                      className="flex-1 truncate rounded px-2 py-1 text-xs"
                      style={
                        tag.color
                          ? {
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }
                          : undefined
                      }
                    >
                      {tag.name}
                    </div>
                    <button
                      onClick={() =>
                        setColorPickerTag(
                          colorPickerTag === tag.id ? null : tag.id,
                        )
                      }
                      className="hover:bg-muted rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      title="Change color"
                    >
                      <Palette className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingTag(tag.id);
                        setEditingTagName(tag.name);
                      }}
                      className="hover:bg-muted rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      title="Rename tag"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        if (
                          confirm(
                            `Delete tag "${tag.name}"? This will remove it from all tasks and projects.`,
                          )
                        ) {
                          deleteTag(tag.id);
                        }
                      }}
                      className="hover:bg-destructive/10 text-destructive rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
                      title="Delete tag"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </>
                )}

                {/* Color Picker Dropdown */}
                {colorPickerTag === tag.id && (
                  <div className="bg-background absolute right-0 left-0 z-10 mt-1 rounded-lg border p-3 shadow-lg">
                    <div className="mb-3 flex flex-wrap gap-2">
                      {presetColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => {
                            updateTag(tag.id, { color });
                            setColorPickerTag(null);
                          }}
                          className="hover:border-primary h-6 w-6 rounded-full border-2 border-transparent transition-all hover:scale-110"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                    <div className="border-t pt-2">
                      <label className="flex items-center gap-2 text-xs">
                        <span>Custom:</span>
                        <input
                          type="color"
                          value={tag.color || "#000000"}
                          onChange={(e) => {
                            updateTag(tag.id, { color: e.target.value });
                            setColorPickerTag(null);
                          }}
                          className="h-6 w-full cursor-pointer rounded"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {showAddGlobalTag ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (newGlobalTag.trim()) {
                    addTag(newGlobalTag.trim());
                    setNewGlobalTag("");
                    setShowAddGlobalTag(false);
                  }
                }}
                className="flex gap-1"
              >
                <input
                  type="text"
                  value={newGlobalTag}
                  onChange={(e) => setNewGlobalTag(e.target.value)}
                  placeholder="New tag name..."
                  className="flex-1 rounded border p-2 text-xs"
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  onBlur={() => {
                    if (!newGlobalTag.trim()) {
                      setShowAddGlobalTag(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setShowAddGlobalTag(false);
                      setNewGlobalTag("");
                    }
                  }}
                />
                <Button type="submit" size="sm" className="h-8 px-2 text-xs">
                  Add
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setShowAddGlobalTag(true)}
                className="hover:bg-muted flex w-full items-center justify-center gap-1 rounded-md border border-dashed p-2 text-xs transition-colors"
              >
                <Plus className="h-3 w-3" />
                Add New Tag
              </button>
            )}
          </div>
        )}
      </div>

      {/* Archived view at bottom */}
      <div
        style={{
          paddingTop: "16px",
          borderTop: "1px solid var(--border, #e5e7eb)",
          marginTop: "16px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => onViewChange("archived")}
          className={cn(
            "hover:bg-muted w-full rounded-md p-2 text-left transition-colors",
            currentView === "archived" && "bg-muted font-medium",
          )}
        >
          Archived
        </button>
      </div>

      {/* Settings button */}
      <div
        style={{
          paddingTop: "16px",
          borderTop: "1px solid var(--border, #e5e7eb)",
          marginTop: "16px",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setShowSettings(true)}
          className="hover:bg-muted flex w-full items-center gap-2 rounded-md p-2 transition-colors"
        >
          <Settings className="h-4 w-4" />
          <span className="text-sm">Settings</span>
        </button>
      </div>

      {/* Settings Dialog */}
      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
};

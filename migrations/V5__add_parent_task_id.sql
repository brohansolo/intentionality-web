-- Migration: V5__add_parent_task_id
-- Created: 2025-11-17
-- Description: Add parent_task_id column to tasks table for subtask support

-- Add parent_task_id column
ALTER TABLE tasks
ADD COLUMN parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;

-- Create index for parent_task_id lookups
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Add comment for documentation
COMMENT ON COLUMN tasks.parent_task_id IS 'Reference to parent task for subtask hierarchy';

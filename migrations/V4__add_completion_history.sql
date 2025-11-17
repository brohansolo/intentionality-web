-- Migration: V4__add_completion_history
-- Created: 2025-11-02
-- Description: Add completion_history JSONB column to track daily task completions

-- Add completion_history column for daily tasks
ALTER TABLE tasks
ADD COLUMN completion_history JSONB DEFAULT '{}'::jsonb;

-- Add index for JSONB queries
CREATE INDEX idx_tasks_completion_history ON tasks USING gin(completion_history);

-- Add comment for documentation
COMMENT ON COLUMN tasks.completion_history IS 'JSON object mapping YYYY-MM-DD date strings to completion status for daily tasks';

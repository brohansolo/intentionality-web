-- Migration: V6__add_time_left_and_today_tasks
-- Created: 2025-11-17
-- Description: Add time_left column to tasks and create today_tasks table

-- Add time_left column to tasks for focus mode tracking
ALTER TABLE tasks
ADD COLUMN time_left INTEGER;

-- Create today_tasks table for tracking tasks marked for today
CREATE TABLE IF NOT EXISTS today_tasks (
  task_id UUID PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for order
CREATE INDEX idx_today_tasks_order ON today_tasks("order");

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_today_tasks_updated_at
  BEFORE UPDATE ON today_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON COLUMN tasks.time_left IS 'Remaining time in seconds for focus mode timer';
COMMENT ON TABLE today_tasks IS 'Tasks that are marked for today with custom ordering';
COMMENT ON COLUMN today_tasks."order" IS 'Sort order for tasks in the today view';

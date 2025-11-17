-- Migration: 001_initial_schema
-- Created: 2025-09-30
-- Description: Initial database schema for tasks and projects

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  due_date TIMESTAMPTZ,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,
  is_daily BOOLEAN NOT NULL DEFAULT FALSE,
  time_period INTEGER, -- in minutes
  last_completed TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_is_daily ON tasks(is_daily);
CREATE INDEX idx_tasks_order ON tasks("order");
CREATE INDEX idx_projects_order ON projects("order");

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE projects IS 'Projects for organizing tasks';
COMMENT ON TABLE tasks IS 'Tasks that can be standalone (inbox) or belong to a project';
COMMENT ON COLUMN tasks.is_daily IS 'Whether this task is a recurring daily task';
COMMENT ON COLUMN tasks.time_period IS 'Estimated time to complete task in minutes';
COMMENT ON COLUMN tasks.last_completed IS 'Timestamp when daily task was last completed';
COMMENT ON COLUMN tasks."order" IS 'Sort order within the project or inbox';
COMMENT ON COLUMN projects."order" IS 'Sort order in the projects list';
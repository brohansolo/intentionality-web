-- Migration: 002_add_project_completed_description
-- Created: 2025-10-02
-- Description: Add completed and description fields to projects table

-- Add completed column to projects
ALTER TABLE projects
ADD COLUMN completed BOOLEAN NOT NULL DEFAULT FALSE;

-- Add description column to projects
ALTER TABLE projects
ADD COLUMN description TEXT;

-- Create index for completed status
CREATE INDEX idx_projects_completed ON projects(completed);

-- Add comments for documentation
COMMENT ON COLUMN projects.completed IS 'Whether the project is marked as completed';
COMMENT ON COLUMN projects.description IS 'Optional description for the project';

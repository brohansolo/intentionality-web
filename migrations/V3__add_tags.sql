-- Create tags table
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create task_tags junction table
CREATE TABLE task_tags (
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (task_id, tag_id)
);

-- Create project_tags junction table
CREATE TABLE project_tags (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (project_id, tag_id)
);

-- Add indexes
CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);
CREATE INDEX idx_project_tags_project_id ON project_tags(project_id);
CREATE INDEX idx_project_tags_tag_id ON project_tags(tag_id);
CREATE INDEX idx_tags_name ON tags(name);

-- Add trigger for updated_at on tags
CREATE TRIGGER update_tags_updated_at
  BEFORE UPDATE ON tags
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE tags IS 'Global tags that can be applied to tasks and projects';
COMMENT ON TABLE task_tags IS 'Junction table linking tasks to tags';
COMMENT ON TABLE project_tags IS 'Junction table linking projects to tags';

-- Create projects table for organizing program deployments
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cluster VARCHAR(20) NOT NULL DEFAULT 'devnet',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add unique constraint on user_id + name combination
CREATE UNIQUE INDEX idx_projects_user_name ON projects(user_id, name);

-- Create indexes for efficient queries
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_cluster ON projects(cluster);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add project_id column to programs table
ALTER TABLE programs ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index on project_id
CREATE INDEX idx_programs_project ON programs(project_id);

-- Add comments
COMMENT ON TABLE projects IS 'Projects are containers for organizing related program deployments';
COMMENT ON COLUMN projects.name IS 'User-defined project name, unique per user';
COMMENT ON COLUMN projects.cluster IS 'Solana cluster: devnet, testnet, or mainnet-beta';
COMMENT ON COLUMN programs.project_id IS 'Optional reference to parent project';

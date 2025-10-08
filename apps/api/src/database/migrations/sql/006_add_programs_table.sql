-- Create programs table for Solana program deployments
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_address VARCHAR(44) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cluster VARCHAR(20) NOT NULL DEFAULT 'devnet',
  status VARCHAR(20) DEFAULT 'pending',
  deployment_logs JSONB DEFAULT '[]',
  deployed_at TIMESTAMP,
  expires_at TIMESTAMP,
  claimed_at TIMESTAMP,
  claimed_by_authority VARCHAR(44),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_programs_user ON programs(user_id);
CREATE INDEX idx_programs_address ON programs(program_address);
CREATE INDEX idx_programs_cluster ON programs(cluster);
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_expires_at ON programs(expires_at);
CREATE INDEX idx_programs_created_at ON programs(created_at);

-- Add trigger for updated_at
CREATE TRIGGER update_programs_updated_at
  BEFORE UPDATE ON programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE programs IS 'Solana program deployments managed by the platform';
COMMENT ON COLUMN programs.program_address IS 'Deployed program address on Solana (base58)';
COMMENT ON COLUMN programs.cluster IS 'Solana cluster: devnet, testnet, or mainnet-beta';
COMMENT ON COLUMN programs.status IS 'Deployment status: pending, deployed, expired, claimed';
COMMENT ON COLUMN programs.deployment_logs IS 'Array of log entries from deployment process';
COMMENT ON COLUMN programs.expires_at IS 'Timestamp when unclaimed program will expire';
COMMENT ON COLUMN programs.claimed_by_authority IS 'Authority address that claimed the program';

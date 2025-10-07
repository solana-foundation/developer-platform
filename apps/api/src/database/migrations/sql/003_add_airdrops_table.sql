-- Create airdrops table for permanent blockchain transaction records
CREATE TABLE airdrops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  signature VARCHAR(88) NOT NULL UNIQUE,
  slot BIGINT NOT NULL,
  recipient VARCHAR(44) NOT NULL,
  amount DECIMAL(20, 9) NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX idx_airdrops_user ON airdrops(user_id);
CREATE INDEX idx_airdrops_signature ON airdrops(signature);
CREATE INDEX idx_airdrops_recipient ON airdrops(recipient);
CREATE INDEX idx_airdrops_created_at ON airdrops(created_at);

-- Add comments
COMMENT ON TABLE airdrops IS 'Permanent record of all SOL airdrop transactions';
COMMENT ON COLUMN airdrops.signature IS 'Solana transaction signature (base58)';
COMMENT ON COLUMN airdrops.slot IS 'Solana slot number when transaction was confirmed';
COMMENT ON COLUMN airdrops.recipient IS 'Recipient wallet address (base58)';
COMMENT ON COLUMN airdrops.amount IS 'Amount of SOL transferred';

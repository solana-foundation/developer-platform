-- Create airdrop_usage_daily table for historical airdrop analytics
CREATE TABLE airdrop_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL,
  total_airdrops BIGINT NOT NULL DEFAULT 0,
  total_volume DECIMAL(20, 9) NOT NULL DEFAULT 0,
  api_key_stats JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- Create indexes for efficient queries
CREATE INDEX idx_airdrop_usage_daily_user_id ON airdrop_usage_daily(user_id);
CREATE INDEX idx_airdrop_usage_daily_date ON airdrop_usage_daily(usage_date);
CREATE INDEX idx_airdrop_usage_daily_user_date ON airdrop_usage_daily(user_id, usage_date);

-- Add comments
COMMENT ON TABLE airdrop_usage_daily IS 'Historical daily airdrop usage statistics by user (archived from Redis)';
COMMENT ON COLUMN airdrop_usage_daily.user_id IS 'User who requested the airdrops';
COMMENT ON COLUMN airdrop_usage_daily.usage_date IS 'Date of usage (YYYY-MM-DD)';
COMMENT ON COLUMN airdrop_usage_daily.total_airdrops IS 'Total number of airdrop requests made on this date';
COMMENT ON COLUMN airdrop_usage_daily.total_volume IS 'Total SOL volume airdropped on this date';
COMMENT ON COLUMN airdrop_usage_daily.api_key_stats IS 'Per-API-key breakdown: {"key_hash": {"count": 10, "volume": 5.5}}';

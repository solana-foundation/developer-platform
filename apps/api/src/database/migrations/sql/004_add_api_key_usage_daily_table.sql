-- Create api_key_usage_daily table for historical usage analytics
CREATE TABLE api_key_usage_daily (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash VARCHAR(255) NOT NULL,
  usage_date DATE NOT NULL,
  total_requests BIGINT NOT NULL DEFAULT 0,
  endpoint_stats JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(key_hash, usage_date)
);

-- Create indexes for efficient queries
CREATE INDEX idx_api_key_usage_daily_key_hash ON api_key_usage_daily(key_hash);
CREATE INDEX idx_api_key_usage_daily_date ON api_key_usage_daily(usage_date);
CREATE INDEX idx_api_key_usage_daily_key_date ON api_key_usage_daily(key_hash, usage_date);

-- Add comments
COMMENT ON TABLE api_key_usage_daily IS 'Historical daily usage statistics for API keys (archived from Redis)';
COMMENT ON COLUMN api_key_usage_daily.key_hash IS 'Bcrypt hash of API key (matches api_keys.key_hash)';
COMMENT ON COLUMN api_key_usage_daily.usage_date IS 'Date of usage (YYYY-MM-DD)';
COMMENT ON COLUMN api_key_usage_daily.total_requests IS 'Total requests made on this date';
COMMENT ON COLUMN api_key_usage_daily.endpoint_stats IS 'JSON object with per-endpoint request counts {"GET /foo": 10, "POST /bar": 5}';

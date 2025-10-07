-- Add usage tracking columns to api_keys table
ALTER TABLE api_keys
ADD COLUMN total_requests BIGINT DEFAULT 0,
ADD COLUMN rate_limit_max INTEGER;

-- Create index for efficient queries on last_used_at
CREATE INDEX idx_api_keys_last_used ON api_keys(last_used_at);

-- Add comment explaining the columns
COMMENT ON COLUMN api_keys.total_requests IS 'Total number of requests made with this API key (synced periodically from Redis)';
COMMENT ON COLUMN api_keys.rate_limit_max IS 'Maximum requests per hour (NULL = unlimited)';

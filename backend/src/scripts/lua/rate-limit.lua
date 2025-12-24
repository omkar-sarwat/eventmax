-- Rate limiting script with sliding window
-- KEYS[1] = rate_limit_key (e.g., "rate_limit:user:USER_ID:endpoint")
-- ARGV[1] = window_size_seconds
-- ARGV[2] = max_requests
-- ARGV[3] = current_timestamp
-- ARGV[4] = request_identifier (optional)

local rate_limit_key = KEYS[1]
local window_size = tonumber(ARGV[1])
local max_requests = tonumber(ARGV[2])
local current_time = tonumber(ARGV[3])
local request_id = ARGV[4] or 'req'

-- Remove expired entries (older than window_size)
local expired_cutoff = current_time - window_size
redis.call('ZREMRANGEBYSCORE', rate_limit_key, '-inf', expired_cutoff)

-- Count current requests in the window
local current_requests = redis.call('ZCARD', rate_limit_key)

-- Check if limit is exceeded
if current_requests >= max_requests then
    -- Get the oldest request timestamp to calculate when limit resets
    local oldest_requests = redis.call('ZRANGE', rate_limit_key, 0, 0, 'WITHSCORES')
    local reset_time = 0
    
    if #oldest_requests > 0 then
        reset_time = tonumber(oldest_requests[2]) + window_size
    end
    
    return {
        allowed = false,
        current_requests = current_requests,
        max_requests = max_requests,
        window_size = window_size,
        reset_time = reset_time,
        retry_after = math.max(0, reset_time - current_time)
    }
end

-- Add current request
local request_entry = request_id .. ':' .. current_time
redis.call('ZADD', rate_limit_key, current_time, request_entry)

-- Set expiry for the key (window_size + buffer)
redis.call('EXPIRE', rate_limit_key, window_size + 60)

-- Calculate remaining requests
local remaining_requests = max_requests - (current_requests + 1)

return {
    allowed = true,
    current_requests = current_requests + 1,
    max_requests = max_requests,
    remaining_requests = remaining_requests,
    window_size = window_size,
    reset_time = current_time + window_size
}

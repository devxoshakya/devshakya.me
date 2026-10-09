local time = redis.call("TIME")

local now_ms = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)

local capacity = tonumber(ARGV[1])
local period_ms = tonumber(ARGV[2])
local cost = tonumber(ARGV[3])
local ttl_buffer_ms = tonumber(ARGV[4])

local state = redis.call("HMGET", KEYS[1], "tokens", "ts", "rem")

local tokens = tonumber(state[1])
local last_ms = tonumber(state[2])
local remainder = tonumber(state[3]) or 0

if not tokens or not last_ms then
    tokens = capacity
    last_ms = now_ms
    remainder = 0
end

local elapsed_ms = math.max(0, now_ms - last_ms)

-- Refill in milli-tokens:
-- 1000 milli-tokens per period_ms.
local numerator = elapsed_ms * 1000 + remainder
local added = math.floor(numerator / period_ms)

remainder = numerator - added * period_ms
tokens = math.min(capacity, tokens + added)

if tokens >= capacity then
    tokens = capacity
    remainder = 0
end

local allowed = 0
local retry_after_ms = 0

if tokens >= cost then
    tokens = tokens - cost
    allowed = 1
else
    local missing = (cost - tokens) * period_ms - remainder

    retry_after_ms = math.max(1, math.ceil(missing / 1000))
end

-- Persist even on denial: this preserves refill progress.
redis.call("HSET", KEYS[1], "tokens", tokens, "ts", now_ms, "rem", remainder)

-- Expire the key when it would be full again, plus a buffer.
local until_full = (capacity - tokens) * period_ms - remainder

local ttl_ms = math.ceil(math.max(0, until_full) / 1000) + ttl_buffer_ms

redis.call("PEXPIRE", KEYS[1], ttl_ms)

return {allowed, math.floor(tokens / 1000), retry_after_ms}

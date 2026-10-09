-- Only increment if the key exists to avoid treating a missing/evicted key as 0
if redis.call("EXISTS", KEYS[1]) == 1 then
    return redis.call("INCR", KEYS[1])
else
    return nil
end

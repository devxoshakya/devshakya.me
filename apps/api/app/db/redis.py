from redis.asyncio import Redis


def create_redis(redis_url: str) -> Redis:
    return Redis.from_url( # type: ignore
        redis_url,
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
        health_check_interval=0,
    )
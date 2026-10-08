from sqlalchemy.engine import make_url
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine
from sqlalchemy.pool import NullPool


def create_engine(database_url: str, *, echo: bool = False) -> AsyncEngine:
    url = make_url(database_url).set(drivername="postgresql+asyncpg")

    # asyncpg does not understand libpq's sslmode/channel_binding query params.
    query = dict(url.query)
    sslmode = query.pop("sslmode", None)
    query.pop("channel_binding", None)
    url = url.set(query=query)

    connect_args: dict = {  # type: ignore
        # PgBouncer transaction mode cannot handle prepared statements.
        "statement_cache_size": 0,
        "timeout": 5,            # connect timeout, seconds
        "command_timeout": 10,   # per-query timeout, keep below function max duration
    }
    if sslmode in {"require", "verify-ca", "verify-full"}:
        connect_args["ssl"] = True

    return create_async_engine(
        url,
        echo=echo,
        poolclass=NullPool,  # the external pooler does the pooling
        connect_args=connect_args,
    )
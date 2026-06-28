from typing import Annotated, AsyncGenerator

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()


class Base(DeclarativeBase):
    pass


def create_db_session(database_url: str):
    engine = create_async_engine(
        database_url,
        echo=bool(settings.SQL_ECHO),
    )

    session_factory = async_sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
    )

    async def get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_factory() as session:
            yield session

    async def close_engine() -> None:
        await engine.dispose()

    return engine, session_factory, get_db, close_engine


# PostgreSQL
pg_engine, pg, get_pg_db, close_pg_db_engine = create_db_session(
    str(settings.POSTGRES_DB)
)
"""
# MySQL
mysql_engine, mysql, get_mysql_db, close_mysql_db_engine = create_db_session(
    str(settings.MYSQL_DB)
)

# SQLite
sqlite_engine, sqlite, get_sqlite_db, close_sqlite_db_engine = create_db_session(
    str(settings.SQLITE_DB)
)
"""
PGDBSession = Annotated[AsyncSession, Depends(get_pg_db)]
# MYSQLDBSession = Annotated[AsyncSession, Depends(get_mysql_db)]
# SQLITEDBSession = Annotated[AsyncSession, Depends(get_sqlite_db)]

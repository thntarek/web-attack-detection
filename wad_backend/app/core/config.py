from functools import lru_cache
from typing import List

from pydantic import MySQLDsn, PostgresDsn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    POSTGRES_DB: PostgresDsn
    SQLITE_DB: str
    MYSQL_DB: MySQLDsn
    APP_NAME: str
    SQL_ECHO: bool
    GEMINI_API_KEY: str

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings():
    return Settings()

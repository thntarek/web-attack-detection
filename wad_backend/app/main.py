from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, close_pg_db_engine, pg_engine
from app.models.database import Evaluation, InstantTest, Product, TestingOutput, User
from app.routers.get_data import router as alldata
from app.routers.instanttest import router as instr


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with pg_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await close_pg_db_engine()


app = FastAPI(
    title="Your API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(instr)
app.include_router(alldata)


@app.get("/")
async def home():
    return 1

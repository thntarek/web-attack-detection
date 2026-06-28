from typing import List, Optional

from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import select

from app.core.database import PGDBSession
from app.models.database import Evaluation, InstantTest

router = APIRouter(prefix="/api/v1/data", tags=["data"])


# ---------- Pydantic response schemas ----------
class EvaluationOut(BaseModel):
    id: int
    payload: str
    original_label: int
    ml_pred: Optional[int] = None
    waf_pred: Optional[int] = None

    class Config:
        from_attributes = True


class InstantTestOut(BaseModel):
    id: int
    payload: str
    original_label: int
    ml_pred: Optional[int] = None
    waf_pred: Optional[int] = None

    class Config:
        from_attributes = True


# ---------- Endpoints ----------
@router.get("/evaluations", response_model=List[EvaluationOut])
async def get_all_evaluations(db: PGDBSession):
    """
    Retrieve all rows from the `evaluations` table.
    """
    result = await db.execute(select(Evaluation))
    evaluations = result.scalars().all()
    return evaluations


@router.get("/instant-tests", response_model=List[InstantTestOut])
async def get_all_instant_tests(db: PGDBSession):
    """
    Retrieve all rows from the `instant_test` table.
    """
    result = await db.execute(select(InstantTest))
    instant_tests = result.scalars().all()
    return instant_tests

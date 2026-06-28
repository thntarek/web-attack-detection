import asyncio
import logging

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.core.database import PGDBSession
from app.models.database import InstantTest
from app.services.llm import call_gemini
from app.services.waf_client import call_waf, waf_prediction
from ml_model.inference import predict

logger = logging.getLogger(__name__)


router = APIRouter(prefix="/instanttest", tags=["detection"])


class PredictRequest(BaseModel):

    payload: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="payload to analyse",
        examples=["1 OR 1=1 --"],
    )

    original_label: int


class PredictResponse(BaseModel):

    ml_prediction: int = Field(
        ..., description="DL model prediction (0=benign, 1=malicious)"
    )
    waf_prediction: int | None = Field(None, description="WAF prediction")
    llm_prediction: int | None = Field(None, description="WAF prediction")


async def run_ml_model(query: str):
    prediction = await asyncio.to_thread(predict, query)
    return prediction  # if predict returns just the int


@router.post("/predict", response_model=PredictResponse)
async def predict_payload(
    request: PredictRequest,
    db: PGDBSession,
):
    query = request.payload
    original_label = request.original_label

    # 1. Run ML model
    try:
        ml_prediction = await run_ml_model(query)
    except Exception as e:
        logger.exception("ML model failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"DL model error: {e}",
        )

    # 2. Run WAF (fail gracefully)
    waf_result = None
    try:
        waf_result = await call_waf(query)  # uses the new helper
    except Exception as e:
        logger.warning("WAF failed: %s", e)

    print(f"payload: {query}\nML_Pred: {ml_prediction}\nWAF_pred: {waf_result}")

    # 3. Run LLM (Gemini) prediction
    llm_result = None
    try:
        llm_result = await call_gemini(query)
    except Exception as e:
        logger.warning("LLM failed: %s", e)

    # 4. Save to DB
    instant_test = InstantTest(
        payload=query,
        original_label=original_label,
        llm_pred=llm_result,
        ml_pred=ml_prediction,
        waf_pred=waf_result,
    )
    db.add(instant_test)
    await db.commit()
    await db.refresh(instant_test)

    # 5. Return exactly the fields defined in PredictResponse
    return PredictResponse(
        ml_prediction=ml_prediction,
        waf_prediction=waf_result,
        llm_prediction=llm_result,
    )

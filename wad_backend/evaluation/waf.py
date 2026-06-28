import asyncio

import httpx
from sqlalchemy import select, update

from app.core.database import Base, pg, pg_engine
from app.models.database import Evaluation

WAF_URL = "http://192.168.122.109/submit"
TIMEOUT = 10  # seconds
CONCURRENT_REQUESTS = 20  # max simultaneous requests


async def create_tables_if_needed():
    async with pg_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def waf_prediction(session: httpx.AsyncClient, payload: str) -> int:
    """Return 1 if malicious (403), 0 if benign (200). Raises on other status codes."""
    try:
        response = await session.get(
            WAF_URL,
            params={"data": payload},
            timeout=TIMEOUT,
        )
        if response.status_code == 403:
            return 1
        elif response.status_code == 200:
            return 0
        else:
            # Unexpected status code – treat as benign but log warning
            print(
                f"Unexpected status {response.status_code} for payload: {payload[:50]}..."
            )
            return 0
    except httpx.RequestError as e:
        print(f"Request failed for payload {payload[:50]}...: {e}")
        return None  # indicate failure


async def process_row(session, eval_obj, semaphore):
    """Query WAF for one evaluation row and store result."""
    async with semaphore:
        prediction = await waf_prediction(session, eval_obj.payload)
        if prediction is not None:
            eval_obj.waf_pred = prediction
            return eval_obj
        else:
            return None


async def main():
    await create_tables_if_needed()

    # Fetch all evaluations where waf_pred IS NULL
    async with pg() as db_session:
        result = await db_session.execute(
            select(Evaluation).where(Evaluation.waf_pred.is_(None))
        )
        evaluations = result.scalars().all()

    if not evaluations:
        print("No evaluations to process.")
        return

    print(f"Found {len(evaluations)} evaluations with missing WAF predictions.")

    semaphore = asyncio.Semaphore(CONCURRENT_REQUESTS)
    updated_objects = []

    async with httpx.AsyncClient() as client:
        tasks = [process_row(client, eval_obj, semaphore) for eval_obj in evaluations]
        results = await asyncio.gather(*tasks)

        updated_objects = [obj for obj in results if obj is not None]

    # Batch update the database
    if updated_objects:
        async with pg() as db_session:
            async with db_session.begin():
                # merge into session and commit
                for obj in updated_objects:
                    db_session.add(obj)

        async with pg() as db_session:
            for obj in updated_objects:
                merged = await db_session.merge(obj)
            await db_session.commit()
        print(f"Updated {len(updated_objects)} evaluations with WAF predictions.")
    else:
        print("No successful WAF queries.")


if __name__ == "__main__":
    asyncio.run(main())

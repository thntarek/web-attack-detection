import asyncio

from sqlalchemy import select
from tqdm import tqdm

from app.core.database import Base, pg, pg_engine
from app.models.database import Evaluation
from ml_model.inference import predict

MAX_CONCURRENT = 1


async def predict_async(payload):
    result = await asyncio.to_thread(predict, payload)

    return result


async def main():
    async with pg() as session:
        result = await session.execute(
            select(Evaluation).where(Evaluation.ml_pred.is_(None))
        )
        evaluations = result.scalars().all()

    if not evaluations:
        print("No rows to process")

        return

    print(f"Processing {len(evaluations)} payloads")
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    updated = []
    progress = tqdm(total=len(evaluations), desc="DL prediction")

    async def process_one(row):
        async with semaphore:
            try:
                prediction = await predict_async(row.payload)
                row.ml_pred = prediction
                updated.append(row)

            except Exception as e:
                print("Failed:", row.id, e)

            finally:
                progress.update(1)

    tasks = [process_one(row) for row in evaluations]
    await asyncio.gather(*tasks)
    progress.close()

    # save results
    if updated:
        async with pg() as session:
            for row in updated:
                await session.merge(row)
            await session.commit()

        print(f"Updated {len(updated)} rows")

    else:
        print("Nothing updated")


if __name__ == "__main__":
    asyncio.run(main())

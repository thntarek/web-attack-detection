import asyncio
import csv
from pathlib import Path

from sqlalchemy import text

from app.core.database import Base, pg, pg_engine
from app.models.database import Evaluation


async def create_tables_if_needed():
    async with pg_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def insert_evaluation_data():
    # 1. Ensure the evaluations table exists
    await create_tables_if_needed()

    # 2. Locate the CSV file
    csv_path = (
        Path(__file__).resolve().parent.parent / "ml_model" / "clean_evaluate.csv"
    )
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV file not found at {csv_path}")

    # 3. Read CSV rows
    evaluations = []
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            payload = row["payload"]
            original_label = int(row["label"])
            evaluations.append(
                Evaluation(
                    payload=payload,
                    original_label=original_label,
                    # ml_pred, waf_pred are left as None (NULL)
                )
            )

    # 4. Insert all rows in one transaction
    async with pg() as session:
        session.add_all(evaluations)
        await session.commit()

    print(f"Inserted {len(evaluations)} rows into 'evaluations' table.")


if __name__ == "__main__":
    asyncio.run(insert_evaluation_data())

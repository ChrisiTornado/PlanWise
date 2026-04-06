from app.db.init_db import recreate_schema
from app.db.session import SessionLocal
from app.seed import seed_startup_mock_data


def fresh_seed() -> None:
    recreate_schema()
    with SessionLocal() as db:
        seed_startup_mock_data(db)


if __name__ == "__main__":
    fresh_seed()

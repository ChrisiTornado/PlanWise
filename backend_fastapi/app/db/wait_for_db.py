import time

from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.db.session import engine


def wait_for_db(attempts: int = 60, delay_seconds: float = 1.0) -> None:
    last_error: Exception | None = None
    for _ in range(attempts):
        try:
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            return
        except OperationalError as error:
            last_error = error
            time.sleep(delay_seconds)

    raise RuntimeError("Database did not become ready in time.") from last_error


if __name__ == "__main__":
    wait_for_db()

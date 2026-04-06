from sqlalchemy import text

from app.db.base import Base
from app.db.session import engine
from app import models  # noqa: F401  Ensures model metadata is registered.


def recreate_schema() -> None:
    if engine.dialect.name == "mysql":
        with engine.begin() as connection:
            connection.execute(text("SET FOREIGN_KEY_CHECKS=0"))
            Base.metadata.drop_all(bind=connection)
            connection.execute(text("SET FOREIGN_KEY_CHECKS=1"))
    else:
        Base.metadata.drop_all(bind=engine)

    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    recreate_schema()

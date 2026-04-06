from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "PlanWise API"
    app_env: str = "local"
    database_url: str = "mysql+pymysql://innolab:innolab@mariadb_database:3306/project_calculation"
    cors_origins: list[str] = ["http://127.0.0.1:4200", "http://localhost:4200"]
    project_root: Path = Path(__file__).resolve().parents[3]
    storage_public_path: Path = Path("/app_storage/public")
    api_base_url: str = "http://127.0.0.1:8080"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_prefix="PLANWISE_",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

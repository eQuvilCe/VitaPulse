from alembic.config import Config
from sqlalchemy import create_engine, inspect

from alembic import command
from app.config import settings


def test_upgrade_creates_every_table(tmp_path, monkeypatch):
    url = f"sqlite:///{tmp_path / 'm.db'}"
    monkeypatch.setattr(settings, "database_url", url)
    monkeypatch.setattr("app.db.engine", create_engine(url))
    cfg = Config("alembic.ini")
    command.upgrade(cfg, "head")
    tables = set(inspect(create_engine(url)).get_table_names())
    assert {"users", "sleep_logs", "daily_metrics", "meals", "habits", "goals"} <= tables

# VitaPulse

AI Health OS: sleep, water, steps, food, mood and weight in one place, with an AI coach and a daily dashboard.

- `backend/` — Python 3.11+, FastAPI, SQLAlchemy 2, Alembic
- `frontend/` — Next.js, TypeScript, Tailwind

## Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp ../.env.example .env        # adjust DATABASE_URL / SECRET_KEY
alembic upgrade head           # create or update the schema
uvicorn app.main:app --reload  # http://localhost:8000/docs
```

Checks: `ruff check .` and `pytest`.

SQLite is used by default for local development; point `DATABASE_URL` at PostgreSQL for anything real.
After changing a model, run `alembic revision --autogenerate -m "what changed"` and commit the new file.

## Frontend

```bash
cd frontend
npm install
npm run dev                    # http://localhost:3001
```

Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` if the API is not on `http://localhost:8000/api/v1`.

Checks: `npx tsc --noEmit` and `npm run lint`.

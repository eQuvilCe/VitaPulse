# VitaPulse

AI Health OS: sleep, water, steps, food, mood and weight in one place, with an AI coach and a daily dashboard.

- `backend/` — Python, FastAPI
- `frontend/` — Next.js, TypeScript, Tailwind

Work in progress.

## Reminders API

`/api/v1/reminders` lets a signed-in user schedule nudges (water, sleep, steps, meals, weight, mood or custom).
Days are weekday numbers, 0 = Monday through 6 = Sunday. `GET /api/v1/reminders/due?now=<local ISO time>`
returns the reminders that fired in the last five minutes, which bots and clients can poll.

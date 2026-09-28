# ORCA v1.0.0

Initial deployable release of the ORCA marine ecosystem intelligence dashboard.

## Included

- Flask web dashboard with marine conditions, geospatial search, chat, and mission routes.
- Optional CrewAI Planner -> Weather/Geospatial -> Judge mission pipeline.
- Production WSGI entrypoint with Gunicorn.
- Docker and Render deployment definitions.
- `/healthz` endpoint for deployment health checks.

## Configuration

Set `GROQ_API_KEY` to enable AI Mission Mode. Copernicus Marine and Fast2SMS credentials are optional; see `.env.example`.
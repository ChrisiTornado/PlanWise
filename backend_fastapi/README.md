# PlanWise FastAPI Backend

FastAPI backend for PlanWise.

## Local module layout

- `app/main.py`: FastAPI application factory and global middleware/static mounts.
- `app/api/router.py`: API router registry.
- `app/api/routes/`: Route modules for auth, lookups, admin and project endpoints.
- `app/core/`: Configuration and security helpers.
- `app/db/`: SQLAlchemy session, base model and future migration hooks.
- `app/models/`: SQLAlchemy database models.
- `app/schemas/`: Pydantic request/response schemas compatible with Angular.
- `app/services/`: Business logic for auth, admin, projects, exports and serialization.
- `app/seed/`: Startup mock data migration target.

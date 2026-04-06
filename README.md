# PlanWise

PlanWise is a project calculation tool with an Angular frontend, a FastAPI backend, and MariaDB.

## Local Development

Prerequisites:
- Git
- Docker Desktop or Docker Engine

Start the full stack:

```bash
docker compose up --build
```

Services:
- Frontend: http://127.0.0.1:4200
- Backend API: http://127.0.0.1:8080
- MariaDB: 127.0.0.1:3306

On backend startup, FastAPI waits for MariaDB, recreates the schema, seeds the mock data, and then starts Uvicorn.

## Login Data

Admin:

```text
admin@technikum-wien.at
123456
```

Faculty users:

```text
informatik@technikum-wien.at
industrial-engineering@technikum-wien.at
life-science@technikum-wien.at
electronic-engineering@technikum-wien.at
123456
```

## Backend

The backend is implemented with FastAPI. The previous backend implementation has been removed.

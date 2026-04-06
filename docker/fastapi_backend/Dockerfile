FROM python:3.12-slim

WORKDIR /backend_fastapi

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PLANWISE_STORAGE_PUBLIC_PATH=/app_storage/public

COPY backend_fastapi/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt

COPY backend_fastapi /backend_fastapi
COPY storage/app/public /app_storage/public

CMD ["sh", "-c", "python -m app.db.wait_for_db && python -m app.db.fresh_seed && uvicorn app.main:app --host 0.0.0.0 --port 80"]

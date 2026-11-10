FROM node:24-bookworm-slim AS frontend
WORKDIR /app/dashboard
COPY dashboard/package*.json ./
RUN npm ci --no-audit --no-fund
COPY dashboard/ ./
RUN npm run build

FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    CODEPULSE_DATA_DIR=/app/data \
    PORT=8000
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY poller/ ./poller/
COPY ml/ ./ml/
COPY --from=frontend /app/dashboard/dist/ ./dashboard/dist/
RUN groupadd --gid 10001 codepulse \
    && useradd --uid 10001 --gid codepulse --create-home --no-log-init codepulse \
    && mkdir -p /app/data \
    && chown codepulse:codepulse /app/data
USER codepulse
EXPOSE 8000
CMD ["sh", "-c", "exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

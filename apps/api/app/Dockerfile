FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_HOME=/app

WORKDIR $APP_HOME
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

# Fly will expose PORT; default to 8080
ENV PORT=8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]

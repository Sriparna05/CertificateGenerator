# Certificate Generator API

A modular, async-ready certificate generation service supporting PPTX, HTML, and image templates, with AI personalization and REST API.

## Features
- RESTful API (Flask)
- PPTX, HTML, and image template support
- Output to PDF, PNG, JPEG
- AI-powered personalized messages (Google Gemini API)
- Async job queue (Celery + Redis)
- Local and cloud storage support
- OpenAPI/Swagger docs
- Dockerized for easy deployment

## Quick Start

### 1. Local Development
```sh
python -m venv env
source env/bin/activate  # or .\env\Scripts\activate on Windows
pip install -r requirements.txt
redis-server  # start Redis
celery -A app.celery_worker.celery_app worker --loglevel=info
flask run
```

### 2. Docker Compose
```sh
docker-compose up --build
```

## API Endpoints
See `/apidocs` (Swagger UI) when running the app.

- `POST /api/v1/certificates/generate` - Generate certificate (sync)
- `POST /api/v1/certificates/generate_async` - Generate certificate (async)
- `GET /api/v1/jobs/<job_id>` - Check async job status
- `GET /api/v1/templates` - List available templates
- `GET /api/v1/health` - Health check

## Project Structure
```
app/
  __init__.py
  routes.py
  models.py
  services/
    certificate_service.py
    ai_service.py
  celery_worker.py
certificate_templates/
generated_certificates/
tests/
plan/
```

## Testing
```sh
pytest
```

## Deployment
- See `Dockerfile` and `docker-compose.yml`
- Use `deploy.sh` or `deploy.bat`

## License
MIT

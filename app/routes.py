

from app import app
from flask import jsonify, request

from app.models import CertificateRequestSchema
from app.services.certificate_service import list_templates, generate_certificate_async
from celery.result import AsyncResult
from app.celery_worker import celery_app
# Async certificate generation endpoint
@app.route("/api/v1/certificates/generate_async", methods=["POST"])
def generate_certificate_async_api():
    """
    Trigger async certificate generation (Celery).
    ---
    tags:
      - Certificates
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
    responses:
      202:
        description: Job accepted
    """
    data = request.get_json()
    task = generate_certificate_async.delay(data)
    return jsonify({"status": "accepted", "job_id": task.id}), 202

# Job status endpoint
@app.route("/api/v1/jobs/<job_id>", methods=["GET"])
def get_job_status(job_id):
    """
    Get status of an async certificate generation job.
    ---
    tags:
      - Jobs
    parameters:
      - in: path
        name: job_id
        required: true
        type: string
    responses:
      200:
        description: Job status
    """
    result = AsyncResult(job_id, app=celery_app)
    response = {
        "job_id": job_id,
        "state": result.state,
        "result": result.result if result.ready() else None
    }
    return jsonify(response), 200
# List available templates endpoint
@app.route("/api/v1/templates", methods=["GET"])
def get_templates():
    """
    List available certificate templates.
    ---
    tags:
      - Templates
    responses:
      200:
        description: List of templates
    """
    templates = list_templates()
    return jsonify({"templates": templates}), 200
from flask_httpauth import HTTPBasicAuth

auth = HTTPBasicAuth()

# Example user store (replace with DB or env config in production)
users = {
    "admin": "password123"
}

@auth.verify_password
def verify_password(username, password):
    if username in users and users[username] == password:
        return username
    return None

@app.route("/api/v1/health", methods=["GET"])
def health_check():
    """Basic health check endpoint."""
    return jsonify({"status": "ok"}), 200


# Example endpoint using Marshmallow validation


@app.route("/api/v1/certificates/generate", methods=["POST"])
@auth.login_required
def generate_certificate():
    """
    Generate one or more certificates.
    ---
    tags:
      - Certificates
    security:
      - basicAuth: []
    parameters:
      - in: body
        name: body
        required: true
        schema:
          id: CertificateRequest
          required:
            - template_id
            - output_format
            - recipients
          properties:
            template_id:
              type: string
            output_format:
              type: string
              enum: [pdf, png, jpeg]
            recipients:
              type: array
              items:
                type: object
            ai_options:
              type: object
    responses:
      200:
        description: Success
      400:
        description: Validation error
    """
    schema = CertificateRequestSchema()
    data = request.get_json()
    errors = schema.validate(data)
    if errors:
        return jsonify({"status": "error", "errors": errors}), 400
    # Placeholder for actual certificate generation logic
    return jsonify({"status": "success", "message": "Validation passed.", "user": auth.current_user()}), 200

from flask import jsonify, request, send_file
from flask_httpauth import HTTPBasicAuth
from celery.result import AsyncResult
import os

from app.models import CertificateRequestSchema
from app.services.certificate_service import (
    list_templates,
    generate_certificate_async,
    generate_certificate,
)
from app.celery_worker import celery_app

# Auth setup
auth = HTTPBasicAuth()

# Example user store (replace with DB or env config in production)
users = {"admin": "password123"}


@auth.verify_password
def verify_password(username, password):
    if username in users and users[username] == password:
        return username
    return None


def register_routes(app):
    """Register all routes with the Flask app."""

    # Health check endpoint
    @app.route("/api/v1/health", methods=["GET"])
    def health_check():
        """Basic health check endpoint."""
        return jsonify({"status": "ok"}), 200

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
            "result": result.result if result.ready() else None,
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

    # Synchronous certificate generation endpoint
    @app.route("/api/v1/certificates/generate", methods=["POST"])
    def generate_certificate_sync():
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

        try:
            # Generate certificates synchronously
            result = generate_certificate(
                data["template_id"],
                data["output_format"],
                data["recipients"],
                data.get("ai_options", {}),
            )
            return jsonify(result), 200
        except Exception as e:
            return jsonify(
                {
                    "status": "error",
                    "message": f"Certificate generation failed: {str(e)}",
                }
            ), 500

    # File download endpoint
    @app.route("/generated_certificates/<path:filename>", methods=["GET"])
    def download_certificate(filename):
        """
        Download a generated certificate file.
        ---
        tags:
          - Files
        parameters:
          - in: path
            name: filename
            required: true
            type: string
            description: The certificate filename to download
        responses:
          200:
            description: Certificate file
          404:
            description: File not found
        """
        try:
            # Use absolute path from project root
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            file_path = os.path.join(project_root, "generated_certificates", filename)
            if os.path.exists(file_path):
                return send_file(file_path, as_attachment=True, download_name=filename)
            else:
                return jsonify({"error": "File not found"}), 404
        except Exception as e:
            return jsonify({"error": f"Download failed: {str(e)}"}), 500

from flask import jsonify, request, send_file
from flask_httpauth import HTTPBasicAuth
from celery.result import AsyncResult
import os
import zipfile
import tempfile
from datetime import datetime
import logging

from app.models import CertificateRequestSchema
from app.services.certificate_service import (
    list_templates,
    generate_certificate_async,
    generate_certificate,
)
from app.celery_worker import celery_app

# Setup basic logging for debugging
logging.basicConfig(level=logging.DEBUG)

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

    @app.route("/api/v1/health", methods=["GET"])
    def health_check():
        """Basic health check endpoint."""
        return jsonify({"status": "ok"}), 200

    @app.route("/api/v1/certificates/generate_async", methods=["POST"])
    def generate_certificate_async_api():
        """Trigger async certificate generation (Celery)."""
        data = request.get_json()
        task = generate_certificate_async.delay(data)
        return jsonify({"status": "accepted", "job_id": task.id}), 202

    @app.route("/api/v1/jobs/<job_id>", methods=["GET"])
    def get_job_status(job_id):
        """Get status of an async certificate generation job."""
        result = AsyncResult(job_id, app=celery_app)
        response = {
            "job_id": job_id,
            "state": result.state,
            "result": result.result if result.ready() else None,
        }
        return jsonify(response), 200

    @app.route("/api/v1/templates", methods=["GET"])
    def get_templates():
        """List available certificate templates."""
        templates = list_templates()
        return jsonify({"templates": templates}), 200

    @app.route("/api/v1/templates/<path:template_id>/content", methods=["GET"])
    def get_template_content(template_id):
        """Get the HTML content of a specific template."""
        # This assumes HTML templates are in the 'html' subfolder
        template_path = os.path.join(
            app.root_path, "..", "certificate_templates", "html", template_id
        )
        if not os.path.exists(template_path):
            return jsonify({"error": "Template not found"}), 404
        with open(template_path, "r", encoding="utf-8") as f:
            content = f.read()
        return content, 200, {"Content-Type": "text/html"}

    @app.route("/api/v1/certificates/generate", methods=["POST"])
    def generate_certificate_sync():
        """Generate one or more certificates."""
        schema = CertificateRequestSchema()
        data = request.get_json()
        errors = schema.validate(data)
        if errors:
            return jsonify({"status": "error", "errors": errors}), 400

        try:
            result = generate_certificate(
                data["template_id"],
                data["output_format"],
                data["recipients"],
                data.get("ai_options", {}),
            )
            return jsonify(result), 200
        except Exception as e:
            logging.error(f"Certificate generation failed: {e}", exc_info=True)
            return jsonify(
                {
                    "status": "error",
                    "message": f"Certificate generation failed: {str(e)}",
                }
            ), 500

    @app.route("/generated_certificates/<path:filename>", methods=["GET"])
    def download_certificate(filename):
        """Download a single generated certificate file."""
        logging.debug(f"Download request for filename: {filename}")
        try:
            # The generated certificates are stored in app/generated_certificates
            # Since this file is in app/routes.py, we need to go up one level to app directory
            app_dir = os.path.dirname(os.path.abspath(__file__))
            file_path = os.path.join(app_dir, "generated_certificates", filename)
            
            logging.debug(f"Attempting to serve file from absolute path: {file_path}")

            if os.path.exists(file_path):
                logging.debug(f"File found: {file_path}. Sending file.")
                return send_file(file_path, as_attachment=True)
            else:
                logging.warning(f"File NOT found at path: {file_path}")
                return jsonify({"error": "File not found"}), 404
        except Exception as e:
            logging.error(f"Download failed for {filename}: {e}", exc_info=True)
            return jsonify({"error": f"Download failed: {str(e)}"}), 500

    @app.route("/api/v1/certificates/download_zip", methods=["POST"])
    def download_certificates_zip():
        """Create and download a ZIP file containing multiple certificates."""
        logging.debug("ZIP download request received.")
        try:
            data = request.get_json()
            if not data or "file_paths" not in data:
                logging.error(f"Missing file_paths in request data: {data}")
                return jsonify({"error": "file_paths required"}), 400

            file_paths = data["file_paths"]
            zip_name = data.get("zip_name", f"certificates_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip")
            
            if not file_paths:
                logging.warning("No file paths provided in the request.")
                return jsonify({"error": "No file paths provided"}), 400

            # Get the app directory (where this routes.py file is located)
            app_dir = os.path.dirname(os.path.abspath(__file__))
            temp_zip_file = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
            
            files_added_count = 0
            with zipfile.ZipFile(temp_zip_file.name, "w", zipfile.ZIP_DEFLATED) as zipf:
                for relative_path in file_paths:
                    if not isinstance(relative_path, str):
                        continue
                    
                    # If the path starts with 'app/', use it as is from project root
                    # Otherwise assume it's relative to app directory
                    if relative_path.startswith('app/'):
                        project_root = os.path.dirname(app_dir)
                        absolute_path = os.path.join(project_root, relative_path)
                    else:
                        absolute_path = os.path.join(app_dir, relative_path)
                    
                    if os.path.exists(absolute_path):
                        archive_name = os.path.basename(relative_path)
                        zipf.write(absolute_path, archive_name)
                        files_added_count += 1
                    else:
                        logging.warning(f"File not found, cannot add to ZIP: {absolute_path}")
            
            temp_zip_file.close()

            if files_added_count == 0:
                logging.error("ZIP creation failed, no valid files found.")
                os.unlink(temp_zip_file.name)
                return jsonify({"error": "No valid files found to create a ZIP"}), 404

            return send_file(
                temp_zip_file.name,
                as_attachment=True,
                download_name=zip_name,
                mimetype="application/zip",
            )
        except Exception as e:
            logging.error(f"ZIP creation failed: {e}", exc_info=True)
            return jsonify({"error": f"ZIP creation failed: {str(e)}"}), 500
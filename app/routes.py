

from app import app
from flask import jsonify, request

from app.models import CertificateRequestSchema
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
    schema = CertificateRequestSchema()
    data = request.get_json()
    errors = schema.validate(data)
    if errors:
        return jsonify({"status": "error", "errors": errors}), 400
    # Placeholder for actual certificate generation logic
    return jsonify({"status": "success", "message": "Validation passed.", "user": auth.current_user()}), 200


from app import app
from flask import jsonify

@app.route("/api/v1/health", methods=["GET"])
def health_check():
    """Basic health check endpoint."""
    return jsonify({"status": "ok"}), 200

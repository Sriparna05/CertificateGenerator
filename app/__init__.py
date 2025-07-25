import os
from flask import Flask
from flask_cors import CORS
from flasgger import Swagger
from config import config


def create_app(config_name=None):
    """Application factory pattern."""
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "default")

    app = Flask(__name__)
    app.config.from_object(config[config_name])

    CORS(app)
    app.swagger = Swagger(app)  # Store swagger instance on app

    # Register routes
    from app.routes import register_routes

    register_routes(app)

    return app


# For backward compatibility
app = create_app()

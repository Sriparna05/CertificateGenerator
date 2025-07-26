import os
from flask import Flask
from flask_cors import CORS
from flasgger import Swagger
from config import config


def create_app(config_name=None):
    """Application factory pattern."""
    if config_name is None:
        config_name = os.getenv("FLASK_ENV", "production" if os.getenv("RENDER") else "default")

    # Serve static files from the built frontend
    app = Flask(__name__, static_folder='static', static_url_path='')
    app.config.from_object(config[config_name])

    CORS(app)
    app.swagger = Swagger(app)  # Store swagger instance on app

    # Register routes
    from app.routes import register_routes

    register_routes(app)
    
    # Serve frontend for all non-API routes
    @app.route('/')
    @app.route('/<path:path>')
    def serve_frontend(path=''):
        if path.startswith('api/'):
            # Let API routes handle themselves
            return app.send_static_file('index.html')
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return app.send_static_file(path)
        return app.send_static_file('index.html')

    return app


# For backward compatibility
app = create_app()

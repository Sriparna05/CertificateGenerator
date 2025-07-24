from flask_cors import CORS
from flask import Flask
from flasgger import Swagger

app = Flask(__name__)
CORS(app)
swagger = Swagger(app)

# Import routes to register endpoints
from app import routes

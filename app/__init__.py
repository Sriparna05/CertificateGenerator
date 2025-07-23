
from flask import Flask
from flasgger import Swagger

app = Flask(__name__)
swagger = Swagger(app)

# Import routes to register endpoints
from app import routes

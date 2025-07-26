"""Configuration settings for the Certificate Generator API."""

import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration class."""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv(
        "CELERY_RESULT_BACKEND", "redis://localhost:6379/0"
    )
    GOOGLE_GEMINI_API_KEY = os.getenv("GOOGLE_GEMINI_API_KEY")

    # Storage settings
    STORAGE_TYPE = os.getenv("STORAGE_TYPE", "local")  # 'local' or 'cloud'
    LOCAL_STORAGE_PATH = os.getenv("LOCAL_STORAGE_PATH", "generated_certificates")

    # Template settings
    TEMPLATE_BASE_DIR = os.getenv("TEMPLATE_BASE_DIR", "certificate_templates")


class DevelopmentConfig(Config):
    """Development configuration."""

    DEBUG = True
    TESTING = False


class ProductionConfig(Config):
    """Production configuration."""

    DEBUG = False
    TESTING = False
    SECRET_KEY = os.getenv("SECRET_KEY", "production-secret-key-change-me")
    
    # Use environment variables for production
    CELERY_BROKER_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("REDIS_URL", "redis://localhost:6379/0")


class TestingConfig(Config):
    """Testing configuration."""

    DEBUG = True
    TESTING = True
    CELERY_TASK_ALWAYS_EAGER = True


# Configuration mapping
config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
    "default": DevelopmentConfig,
}

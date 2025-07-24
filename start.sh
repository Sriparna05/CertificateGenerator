#!/bin/bash
"""
Certificate Generator Application Startup Script
This script starts all required services for the application.
"""

echo "Starting Certificate Generator Application..."
echo "=" * 50

# Check if Redis is running
echo "Checking Redis connection..."
redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Redis is running"
else
    echo "✗ Redis is not running. Please start Redis server:"
    echo "  sudo systemctl start redis"
    echo "  or: redis-server"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

# Start Celery worker in background
echo "Starting Celery worker..."
celery -A app.celery_worker.celery_app worker --loglevel=info --detach

# Wait a moment for Celery to start
sleep 2

echo "Starting Flask application..."
python run.py

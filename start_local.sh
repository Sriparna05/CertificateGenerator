#!/bin/bash

echo "🚀 Starting Certificate Generator locally..."

# Check if we want production mode
if [ "$1" = "prod" ]; then
    echo "📦 Building frontend..."
    chmod +x build_simple.sh
    ./build_simple.sh
    
    if [ $? -ne 0 ]; then
        echo "❌ Build failed, exiting..."
        exit 1
    fi
    
    echo "🔧 Setting production environment..."
    export FLASK_ENV=production
    export RENDER=true
    
    echo "🌐 Starting with Gunicorn..."
    gunicorn --bind 127.0.0.1:5000 --reload run:app
else
    echo "🔧 Setting development environment..."
    export FLASK_ENV=development
    
    echo "🌐 Starting Flask development server..."
    python run.py
fi
#!/bin/bash

# Build script for Render deployment

set -e  # Exit on any error

echo "🔧 Render Build Script Starting..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Build frontend
echo "🏗️ Building frontend..."
cd frontend

# Install Node dependencies
echo "📦 Installing Node dependencies..."
npm ci --only=production

# Build frontend (ignore TypeScript errors)
echo "🔨 Building React app..."
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Frontend build failed - no dist directory"
    exit 1
fi

cd ..

# Setup static directory for Flask
echo "📁 Setting up Flask static files..."
rm -rf app/static
mkdir -p app/static

# Copy built frontend to Flask static directory
cp -r frontend/dist/* app/static/

echo "✅ Build completed successfully!"
echo "📊 Static files:"
ls -la app/static/
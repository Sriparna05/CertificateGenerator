#!/bin/bash

echo "🔨 Simple build for local development..."

cd frontend
echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building frontend (ignoring TypeScript errors)..."
npm run build

if [ $? -eq 0 ]; then
    cd ..
    echo "📁 Setting up static directory..."
    rm -rf app/static
    mkdir -p app/static
    
    if [ -d "frontend/dist" ]; then
        cp -r frontend/dist/* app/static/
        echo "✅ Build successful! Frontend copied to app/static/"
    else
        echo "❌ No dist directory found"
        exit 1
    fi
else
    echo "❌ Frontend build failed"
    exit 1
fi
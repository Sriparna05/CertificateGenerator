#!/bin/bash

# Build script for Render deployment

echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "Moving built frontend to Flask static directory..."
rm -rf app/static
mkdir -p app/static
cp -r frontend/dist/* app/static/

echo "Build complete!"
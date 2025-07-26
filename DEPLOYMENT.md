# 🚀 Deployment Guide

## Local Development

### Option 1: Production-like (Built Frontend + Flask)
```bash
chmod +x start_local.sh
./start_local.sh prod
```
Access at: `http://127.0.0.1:5000`

### Option 2: Development Mode (Separate Servers)
```bash
# Terminal 1: Backend
./start_local.sh

# Terminal 2: Frontend  
cd frontend
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend: `http://127.0.0.1:5000`

## Render Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Connect to Render
1. Go to [render.com](https://render.com)
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will auto-detect `render.yaml`

### 3. Set Environment Variables
In Render Dashboard, set:
- `GOOGLE_GEMINI_API_KEY` - Your Gemini API key
- `SECRET_KEY` - Auto-generated
- `FLASK_ENV` - Set to "production"

### 4. Deploy
- Render will automatically build using `build.sh`
- Build process:
  1. Install Python dependencies
  2. Install Node.js dependencies  
  3. Build React frontend
  4. Copy built files to Flask static directory
  5. Start with Gunicorn

### 5. Access Your App
Your app will be available at: `https://your-app-name.onrender.com`

## Build Process Details

### Local Build
```bash
chmod +x build_simple.sh
./build_simple.sh
```

### Render Build
- Uses `build.sh` script
- Installs both Python and Node.js dependencies
- Builds React app with `npm run build`
- Copies to Flask static directory
- Serves everything through Flask

## Troubleshooting

### Build Fails
- Check Node.js version (should be 18+)
- Check Python version (should be 3.11+)
- Ensure all dependencies are in requirements.txt

### Frontend Not Loading
- Check if `app/static/` directory exists
- Verify build.sh completed successfully
- Check Flask static file serving configuration

### API Calls Failing
- Verify environment variables are set
- Check CORS configuration
- Ensure API endpoints are accessible
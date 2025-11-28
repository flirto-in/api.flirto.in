# Render Deployment Guide

## Overview

This guide explains how to deploy the WhispChat API server to Render.

## Why Render?

✅ **WebSocket Support** - Unlike Vercel, Render fully supports WebSocket connections which are essential for Socket.IO  
✅ **Always Running** - Your server stays running instead of cold starts with serverless  
✅ **Free Tier Available** - Test your app before upgrading to paid plans  
✅ **Easy Configuration** - Simple YAML-based configuration

## Prerequisites

1. A [Render account](https://render.com/) (free tier available)
2. Your GitHub repository connected to Render
3. Environment variables ready (MongoDB URI, JWT Secret, etc.)

## Quick Start

### Option 1: Using render.yaml (Recommended)

1. **The `render.yaml` file is already created** in your server directory
2. **Push your code to GitHub**
3. **In Render Dashboard:**
   - Click "New" → "Blueprint"
   - Connect your repository
   - Select the `server` directory if not root
   - Render will automatically detect `render.yaml`
4. **Configure Environment Variables** (see below)
5. **Deploy!**

### Option 2: Manual Setup

1. **In Render Dashboard:**
   - Click "New" → "Web Service"
   - Connect your repository
2. **Configure settings:**
   - **Name:** `whispchat-api`
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `server` (if not root)
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
3. **Configure Environment Variables** (see below)
4. **Create Web Service**

## Environment Variables

You **must** set these in the Render Dashboard (Environment tab):

### Required Variables

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### Optional Variables (if using Firebase/Cloudinary)

```env
FIREBASE_SERVICE_ACCOUNT=your_firebase_service_account_json
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### How to Add Environment Variables in Render

1. Go to your service in Render Dashboard
2. Click "Environment" in the left sidebar
3. Click "Add Environment Variable"
4. Enter key and value
5. Click "Save Changes"
6. Service will automatically redeploy

## Important: Update Client Configuration

After deploying to Render, update your **client** `.env` file with your new Render URL:

```env
# Update these with your Render URL
EXPO_PUBLIC_API_URL=https://your-service-name.onrender.com
EXPO_PUBLIC_SOCKET_URL=https://your-service-name.onrender.com
```

**Note:** Replace `your-service-name` with your actual Render service name.

## Health Check Endpoint

Render can ping a health check endpoint to ensure your service is running. Add this to your Express app:

```javascript
// In src/app.js
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
```

## Troubleshooting

### Issue: "Cannot find module '/opt/render/project/src/index.js'"

**Solution:** This error occurs when the start command is incorrect. Make sure:
- Your `package.json` has `"start": "node src/index.js"`
- Render's start command is `npm start` (not `node index.js`)

### Issue: WebSocket connection fails

**Solution:** 
- Ensure your client is connecting to `https://` (not `http://`)
- Check CORS settings in your server
- Verify Socket.IO is properly initialized

### Issue: Service keeps restarting

**Solution:**
- Check the "Logs" tab in Render Dashboard
- Verify all environment variables are set correctly
- Ensure MongoDB connection is successful
- Check for any uncaught errors in your code

### Issue: Free tier goes to sleep

**Solution:**
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep will be slow (cold start)
- Upgrade to Starter plan ($7/month) for always-on service
- Or use a ping service (cron-job.org) to keep it awake

## Deployment Workflow

1. **Make code changes locally**
2. **Test locally:** `npm run dev`
3. **Commit and push to GitHub**
4. **Render auto-deploys** (if auto-deploy enabled)
5. **Check logs** in Render Dashboard to ensure successful deployment
6. **Update client** if API URLs changed

## Monitoring

- **Logs:** Render Dashboard → Your Service → Logs
- **Metrics:** Render Dashboard → Your Service → Metrics
- **Events:** Render Dashboard → Your Service → Events

## Costs

- **Free Tier:** 750 hours/month, sleeps after 15 min inactivity
- **Starter:** $7/month, always on, better performance
- **Standard:** $25/month, more resources

## Next Steps

After deployment:

1. ✅ Update client `.env` with Render URL
2. ✅ Test all API endpoints
3. ✅ Test Socket.IO connections
4. ✅ Configure custom domain (optional)
5. ✅ Set up monitoring/alerts

## Migration from Vercel

Changes made:
- ✅ Removed `vercel.json` (Vercel doesn't support WebSockets well)
- ✅ Created `render.yaml` for Render deployment
- ✅ Using `npm start` command which runs `node src/index.js`

## Resources

- [Render Documentation](https://docs.render.com/)
- [Render Node.js Guide](https://docs.render.com/deploy-node-express-app)
- [Render Environment Variables](https://docs.render.com/environment-variables)
- [Render Pricing](https://render.com/pricing)

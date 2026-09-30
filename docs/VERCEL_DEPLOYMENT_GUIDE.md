# Step-by-Step Vercel Deployment Guide for NAWI System

This guide walks you through deploying the **NAWI Testing & OIML R-76 Legal Metrology Platform** to production.

---

## 1. Architecture Overview

A modern full-stack web application with **React (Vite) + Python (FastAPI)** is hosted using the industry standard split-stack deployment:

```
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│         FRONTEND (React + Vite)      │       │         BACKEND (FastAPI + Python)   │
│         Hosted on: VERCEL            │ ────> │         Hosted on: RENDER / RAILWAY  │
│   https://your-nawi-app.vercel.app   │ REST  │   https://your-nawi-api.onrender.com │
└──────────────────────────────────────┘       └──────────────────────────────────────┘
```

* **Vercel** provides an ultra-fast global Edge CDN, automatic SSL certificates, and zero-downtime CI/CD for the React frontend.
* **Render** (or Railway / Fly.io / Koyeb) runs the Python FastAPI service, SQLAlchemy database, and ReportLab PDF generator with free hosting.

---

## 2. Deploying the Backend (Takes ~2 Minutes)

Before deploying the frontend on Vercel, deploy your FastAPI backend so you have its live URL.

### Option A: Free Hosting on Render.com (Recommended)
1. Sign up or log in at **[render.com](https://render.com)**.
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository (`NAWI-System`).
4. Configure the service settings:
   * **Name**: `nawi-backend`
   * **Region**: Choose the closest region (e.g. Oregon, Frankfurt, Singapore)
   * **Root Directory**: `backend`
   * **Runtime**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type**: **Free**
5. (Optional) Under **Environment Variables**, add:
   * `SECRET_KEY` = `your-super-secret-key-for-jwt`
   * `BACKEND_CORS_ORIGINS` = `["https://*.vercel.app"]`
6. Click **Deploy Web Service**.
7. Once deployed, copy your backend URL (e.g., `https://nawi-backend.onrender.com`).

---

## 3. Deploying the Frontend on Vercel

### Step 1: Import Project into Vercel
1. Log in to your **[Vercel Dashboard](https://vercel.com/dashboard)**.
2. Click **Add New...** ➔ **Project**.
3. Select your GitHub repository (`NAWI-System`) and click **Import**.

### Step 2: Configure Project Settings
In the Vercel project configuration screen:
1. **Root Directory**:
   * Click **Edit** next to Root Directory.
   * Select or type `frontend` and click **Continue**.
2. **Framework Preset**:
   * Vercel will automatically detect **Vite**.
3. **Build and Output Settings** (Pre-filled):
   * Build Command: `npm run build`
   * Output Directory: `dist`
   * Install Command: `npm install`
4. **Environment Variables**:
   * Expand the **Environment Variables** section.
   * Add a new variable:
     * **Key**: `VITE_API_URL`
     * **Value**: `https://your-backend-name.onrender.com/api` *(replace with your real backend URL from Section 2)*

### Step 3: Deploy!
* Click the blue **Deploy** button.
* Vercel will run `npm install`, compile TypeScript, build the Vite production bundle, and deploy to a global URL like:
  ```
  https://nawi-system-xxxx.vercel.app
  ```

---

## 4. Deploying Directly via Vercel CLI (No GitHub Required)

If you have the Vercel CLI installed on your machine, you can deploy directly from your terminal:

```powershell
# 1. Navigate to the frontend directory
cd D:\NAWI-System\frontend

# 2. Run Vercel CLI deployment
npx vercel

# 3. Follow the terminal prompts:
#   ? Set up and deploy? -> Yes (Y)
#   ? Which scope? -> [Your Account]
#   ? Link to existing project? -> No (N)
#   ? What's your project's name? -> nawi-system
#   ? In which directory is your code located? -> ./
#   ? Want to modify these settings? -> No (N)

# 4. For final production deployment:
npx vercel --prod
```

---

## 5. Important Settings Already Configured in the Repository

We have already configured your project repository with all necessary Vercel files:

1. **`frontend/vercel.json` (SPA Client-Side Routing)**:
   * Fixes the common React Router issue where refreshing `/dashboard` or `/testing/1` causes a 404 on Vercel.
   * Automatically redirects all route requests to `/index.html`.

2. **`backend/app/main.py` (CORS Protection)**:
   * Pre-configured with `allow_origin_regex=r"^https:\/\/.*\.vercel\.app$"` so your backend automatically accepts API requests from any Vercel deployment preview or production domain.

3. **`backend/Procfile`**:
   * Standard web process definition for cloud hosts (`web: uvicorn app.main:app --host 0.0.0.0 --port $PORT`).

4. **Production Build Verified**:
   * Tested and passed `npm run build` with zero TypeScript errors.

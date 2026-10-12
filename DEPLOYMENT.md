# 🚀 Deployment Guide: Deploying NHAI Dashboard to Render

This guide outlines the exact, step-by-step process to deploy your **NHAI CCMS Street Light Performance Dashboard** to **[Render](https://render.com)** for free.

---

## 📋 Prerequisites
1. A **GitHub account** ([github.com](https://github.com))
2. A **Render account** ([render.com](https://render.com) - you can sign in directly with GitHub)
3. Git installed on your computer

---

## Method 1: Deploying via GitHub (Recommended - 3 Minutes)

### Step 1: Initialize Git and Push to GitHub

Open PowerShell or your terminal in this project folder (`c:\Users\Vinoth\Desktop\NHAI-WEBSITE`):

```powershell
# 1. Initialize git repository
git init

# 2. Add all files
git add .

# 3. Create your initial commit
git commit -m "Initial commit of NHAI CCMS Performance Dashboard"

# 4. Create a new repository on GitHub (e.g., nhai-lamp-dashboard)
# 5. Link your local repo and push to GitHub (replace with your repo URL):
git remote add origin https://github.com/YOUR_USERNAME/nhai-lamp-dashboard.git
git branch -M main
git push -u origin main
```

---

### Step 2: Create Web Service on Render

1. Go to your [Render Dashboard](https://dashboard.render.com).
2. Click the **"New +"** button in the top right corner and select **"Web Service"**.
3. Under **"Connect a repository"**, select your repository (`nhai-lamp-dashboard`).
4. Fill in the service configuration details:

| Field | Value to Enter |
|---|---|
| **Name** | `nhai-lamp-failure-dashboard` (or any custom name) |
| **Region** | Select the region closest to you (e.g., `Singapore` or `Frankfurt`) |
| **Branch** | `main` |
| **Root Directory** | *(Leave blank)* |
| **Runtime** | `Python` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | **Free** ($0/month) |

---

### Step 3: Add Environment Variables (Optional)

In the **Environment Variables** section on Render, you can specify:
- `PYTHON_VERSION`: `3.11.9` (Render provides optimized pre-built wheels for Python 3.11)

---

### Step 4: Click "Deploy Web Service"

- Click **"Create Web Service"**.
- Render will start building the project:
  1. Clones your GitHub repository
  2. Runs `pip install -r requirements.txt`
  3. Launches `uvicorn app:app --host 0.0.0.0 --port $PORT`
- In approximately **1 to 2 minutes**, you will see:
  ```
  ==> Your service is live 🎉
  ```
- Your live dashboard URL will look like:
  `https://nhai-lamp-failure-dashboard.onrender.com`

---

## Method 2: 1-Click Blueprint Deployment (Using `render.yaml`)

Because this project already includes a production-ready `render.yaml` Blueprint file:

1. Push your repository to GitHub.
2. In Render, click **"New +"** -> **"Blueprint"**.
3. Select your repository. Render will automatically read `render.yaml` and configure:
   - Build command (`pip install -r requirements.txt`)
   - Start command (`uvicorn app:app --host 0.0.0.0 --port $PORT`)
   - Free tier plan
4. Click **"Apply"** and your site will be live immediately!

---

## 💻 Running Locally on Your Machine

To test or develop locally before deploying:

```powershell
# Install requirements
pip install -r requirements.txt

# Run the server
python app.py
```

Then open your browser and visit:
👉 **`http://localhost:8000`**

---

## ⚙️ Key Technical Features Configured for Render

1. **Dynamic Port Binding**:
   Render automatically assigns an internal `$PORT` environment variable. Both `app.py` and `Procfile` are configured to listen on `$PORT`.
2. **Persistent Telemetry**:
   The dashboard ships with `NHAI-LAMP-FAILURE-DASHBOARD.xlsx` as default live baseline data.
3. **Live File Upload**:
   Users can upload updated Excel sheets directly via the web UI at any time without redeploying.
4. **Zero External CSS/JS Dependencies**:
   Uses standard lightweight CDN Chart.js and native responsive CSS, ensuring fast page load times and 100% SLA uptime.

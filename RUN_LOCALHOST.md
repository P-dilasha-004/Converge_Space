# 🚀 How to Run Converge Space on Localhost

## Quick Start (Easiest Method)

### Option 1: Using the Start Script
```bash
cd /Users/dilashapant/Documents/ConvergeSpace
./start.sh
```

### Option 2: Manual Start

#### Terminal 1 - Backend Server
```bash
cd /Users/dilashapant/Documents/ConvergeSpace/backend
npm run dev
```

#### Terminal 2 - Frontend Server
```bash
cd /Users/dilashapant/Documents/ConvergeSpace/frontend/vite-project
npm run dev
```

---

## 📋 Step-by-Step Instructions

### 1. Start Backend Server

Open Terminal and run:
```bash
cd /Users/dilashapant/Documents/ConvergeSpace/backend
npm run dev
```

**Expected Output:**
```
[SERVER] Server running on port 5001
[SERVER] Connected to MongoDB successfully
```

**Backend will be available at:** `http://localhost:5001`

---

### 2. Start Frontend Server

Open a **new Terminal window** and run:
```bash
cd /Users/dilashapant/Documents/ConvergeSpace/frontend/vite-project
npm run dev
```

**Expected Output:**
```
  VITE v6.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Frontend will be available at:** `http://localhost:5173`

---

## 🌐 Access the Application

1. Open your web browser
2. Navigate to: **http://localhost:5173**
3. You should see the Converge Space homepage

---

## 🛑 Stop the Servers

### Option 1: Using the Stop Script
```bash
cd /Users/dilashapant/Documents/ConvergeSpace
./stop.sh
```

### Option 2: Manual Stop

In each terminal window, press:
- **Ctrl + C** (or **Cmd + C** on Mac)

Or kill all processes:
```bash
pkill -f "nodemon|vite|react-router"
```

---

## 🔧 Troubleshooting

### Port Already in Use

If you get "port already in use" error:

**Backend (port 5001):**
```bash
lsof -ti:5001 | xargs kill -9
```

**Frontend (port 5173 or 5174):**
```bash
lsof -ti:5173 | xargs kill -9
# or
lsof -ti:5174 | xargs kill -9
```

### MongoDB Connection Issues

Make sure MongoDB is running:
```bash
# Check if MongoDB is running
mongosh
```

Or update the connection string in `backend/.env`:
```env
MONGODB_URI=your-mongodb-connection-string
```

### Dependencies Not Installed

If you get module errors, install dependencies:

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend/vite-project
npm install
```

---

## 📝 Environment Setup

### Backend `.env` File

Create `backend/.env` with:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/converge-space
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
OPENAI_API_KEY=your-openai-api-key (optional)
```

### Frontend

No environment file needed - it's configured to use `http://localhost:5001` for the API.

---

## ✅ Verify Everything is Working

1. **Backend Health Check:**
   ```bash
   curl http://localhost:5001/api/workspaces
   ```
   Should return: `{"message":"No token provided"}` (this is expected)

2. **Frontend Check:**
   - Open http://localhost:5173
   - You should see the Converge Space homepage

3. **Full Flow Test:**
   - Sign up for a new account
   - Create a workspace
   - Create a project
   - Create a task
   - Everything should work!

---

## 🎯 Quick Commands Reference

```bash
# Start everything
./start.sh

# Stop everything
./stop.sh

# Check if servers are running
lsof -ti:5001 && echo "Backend running" || echo "Backend not running"
lsof -ti:5173 && echo "Frontend running" || echo "Frontend not running"

# View backend logs
tail -f backend.log

# View frontend logs
tail -f frontend.log
```

---

## 🚨 Common Issues

### "Cannot find module" errors
→ Run `npm install` in both backend and frontend directories

### "Port 5001 already in use"
→ Kill the process: `lsof -ti:5001 | xargs kill -9`

### "Failed to connect to server"
→ Make sure backend is running on port 5001
→ Check that frontend is using `http://localhost:5001` (not 5002)

### "MongoDB connection error"
→ Make sure MongoDB is running
→ Check your `MONGODB_URI` in `backend/.env`

---

That's it! Your application should now be running on localhost! 🎉


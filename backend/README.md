# Converge Space Backend

Backend API for the Converge Space application using Node.js, Express, TypeScript, and MongoDB.

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/converge-space

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Start MongoDB

Make sure MongoDB is running on your system:

**On macOS:**
```bash
brew services start mongodb-community
```

**On Linux:**
```bash
sudo systemctl start mongod
```

**Or use Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 4. Run the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:5000`

## Database Schema

### User
- `name`: String (required)
- `email`: String (required, unique, lowercase)
- `password`: String (required, min 6 characters)
- `emailVerified`: Boolean (default: false)
- `twoFactorEnabled`: Boolean (default: false)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### Workspace
- `name`: String (required)
- `description`: String (optional)
- `userId`: ObjectId (references User)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### Project
- `name`: String (required)
- `description`: String (optional)
- `workspaceId`: ObjectId (references Workspace)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

### Task
- `title`: String (required)
- `description`: String (optional)
- `status`: Enum ['todo', 'in-progress', 'done'] (default: 'todo')
- `projectId`: ObjectId (references Project)
- `createdAt`: Date (auto)
- `updatedAt`: Date (auto)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Workspaces (Protected - requires JWT)
- `GET /api/workspaces` - Get all workspaces for current user
- `POST /api/workspaces` - Create a new workspace

### Projects (Protected - requires JWT)
- `GET /api/workspaces/:workspaceId/projects` - Get all projects in a workspace
- `POST /api/workspaces/:workspaceId/projects` - Create a new project

### Tasks (Protected - requires JWT)
- `GET /api/workspaces/:workspaceId/projects/:projectId/tasks` - Get all tasks in a project
- `POST /api/workspaces/:workspaceId/projects/:projectId/tasks` - Create a new task

## Authentication

All workspace, project, and task endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Changes from Previous Version

✅ **Database Integration Complete**
- Removed hardcoded in-memory storage
- All data now persists in MongoDB
- Proper user authentication with JWT
- User-specific workspace access control

✅ **Models Created**
- Workspace model with user association
- Project model with workspace association  
- Task model with project association

✅ **Authentication Middleware**
- JWT verification middleware for protected routes
- User context attached to requests


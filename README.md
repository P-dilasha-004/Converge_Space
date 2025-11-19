# Converge Space

A full-stack project management web application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Project Overview

Converge Space is designed to help student project teams manage workspaces, projects, and tasks effectively. It provides a secure, collaborative environment with user authentication, multi-workspace architecture, and comprehensive task management features.

## Tech Stack

### Frontend
- **React Router v7** - Modern routing framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - High-quality React components
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **TypeScript** - Type-safe development

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
OPENAI_API_KEY=your-openai-api-key (optional, for AI summaries)
```

**Note:** The AI summarization feature works with or without an OpenAI API key. If no key is provided, the system will generate basic summaries based on task statistics.

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000` (or the port specified in your .env file)

**Note:** Make sure your backend port matches the frontend API calls. The frontend is configured to use `http://localhost:5001` by default. You can either:
- Change the backend port to 5001 in your `.env` file, or
- Update the API URLs in the frontend code

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend/vite-project
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5174` (or another port if 5173 is in use)

## Project Structure

```
junior_seminar/
├── backend/
│   ├── src/
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   └── server.ts      # Server entry point
│   ├── .env               # Environment variables
│   └── package.json
└── frontend/
    └── vite-project/
        ├── app/
        │   ├── routes/     # React Router routes
        │   ├── components/ # React components
        │   └── lib/        # Utility functions
        └── package.json
```

## Features Implemented

### Core Features ✅
- [x] Backend server setup with Express.js
- [x] MongoDB database connection
- [x] User model with authentication fields
- [x] Frontend structure with React Router
- [x] Sign in and Sign up pages
- [x] Shadcn UI components integration
- [x] Complete user authentication API
- [x] JWT token management
- [x] Protected routes middleware
- [x] Workspace Management
- [x] Project Management
- [x] Task Management

### Enhanced Features ✨
- [x] **Team Members Management** - Add team members to workspaces
- [x] **Task Assignment** - Assign tasks to team members
- [x] **AI-Powered Summaries** - Get AI-generated summaries of each team member's workload, progress, and focus areas
- [x] **Enhanced UI** - Modern, gradient-based design with smooth animations and transitions
- [x] **Team Dashboard** - Dedicated view for team members with detailed statistics and AI insights

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### Workspaces
- `GET /api/workspaces` - Get all workspaces for current user
- `POST /api/workspaces` - Create a new workspace
- `GET /api/workspaces/:workspaceId/projects` - Get projects in a workspace
- `POST /api/workspaces/:workspaceId/projects` - Create a project
- `GET /api/workspaces/:workspaceId/projects/:projectId/tasks` - Get tasks in a project
- `POST /api/workspaces/:workspaceId/projects/:projectId/tasks` - Create a task

### Team Management
- `GET /api/team/:workspaceId/members` - Get all team members in a workspace
- `POST /api/team/:workspaceId/members` - Add a team member to workspace
- `GET /api/team/:workspaceId/members/:memberId/summary` - Get detailed summary of a team member
- `POST /api/team/:workspaceId/ai-summary` - Generate AI summaries for all team members

## Environment Variables

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
```

## Development

### Running the Development Servers

Start backend:
```bash
cd backend && npm run dev
```

Start frontend:
```bash
cd frontend/vite-project && npm run dev
```

## Testing

Navigate to `http://localhost:5174` in your browser to access the application.

- Click "Sign Up" to create a new account
- Click "Sign In" to login to an existing account

## License

This project is created for educational purposes as part of CSCI-310.


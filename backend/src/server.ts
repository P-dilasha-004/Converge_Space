import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspaces';
import teamRoutes from './routes/team';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/converge-space';

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('[SERVER] Connected to MongoDB successfully');
  })
  .catch((error) => {
    console.error('[SERVER] MongoDB connection error:', error);
    console.log('[SERVER] Server will continue without database connection');
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/team', teamRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`[SERVER] Server running on port ${PORT}`);
});


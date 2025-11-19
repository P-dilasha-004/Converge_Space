import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { z } from 'zod';
import { sendVerificationCode } from '../utils/email';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const requestPasswordResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const verifyCodeSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().length(6, 'Verification code must be 6 digits'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// Register route
router.post('/register', async (req, res, next) => {
  try {
    console.log('[AUTH] Register attempt:', { email: req.body.email });
    
    // Validate input
    const validatedData = registerSchema.parse(req.body);
    
    // Check if user already exists in database
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    
    // Create user in database
    const user = await User.create({
      name: validatedData.name,
      email: validatedData.email,
      password: hashedPassword,
    });
    
    console.log('[AUTH] User created:', { id: user._id, email: user.email });
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    next(error);
  }
});

// Login route
router.post('/login', async (req, res, next) => {
  try {
    console.log('[AUTH] Login attempt:', { email: req.body.email });
    
    // Validate input
    const validatedData = loginSchema.parse(req.body);
    
    // Find user in database
    const user = await User.findOne({ email: validatedData.email });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log('[AUTH] Login successful:', { id: user._id, email: user.email });
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    next(error);
  }
});

// Generate 6-digit verification code
const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request password reset - sends verification code to email
router.post('/forgot-password', async (req, res, next) => {
  try {
    console.log('[AUTH] Password reset request:', { email: req.body.email });
    
    const validatedData = requestPasswordResetSchema.parse(req.body);
    
    // Find user
    const user = await User.findOne({ email: validatedData.email.toLowerCase() });
    
    // Always return success to prevent email enumeration
    if (!user) {
      console.log('[AUTH] User not found for password reset:', validatedData.email);
      return res.json({ 
        message: 'If an account exists with this email, a verification code has been sent.' 
      });
    }
    
    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    
    // Store reset token and expiry (10 minutes)
    user.resetToken = verificationCode;
    user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();
    
    // Send verification code via email
    const emailSent = await sendVerificationCode(user.email, verificationCode);
    
    if (!emailSent && process.env.NODE_ENV === 'production') {
      return res.status(500).json({ message: 'Failed to send verification code. Please try again.' });
    }
    
    console.log('[AUTH] Verification code generated for:', user.email);
    
    res.json({ 
      message: 'If an account exists with this email, a verification code has been sent.',
      // In development, include the code for testing
      ...(process.env.NODE_ENV === 'development' && { code: verificationCode })
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    next(error);
  }
});

// Verify code - checks if the verification code is valid
router.post('/verify-reset-code', async (req, res, next) => {
  try {
    console.log('[AUTH] Verifying reset code');
    
    const validatedData = verifyCodeSchema.parse(req.body);
    
    // Find user with matching code
    const user = await User.findOne({ 
      email: validatedData.email.toLowerCase(),
      resetToken: validatedData.code,
      resetTokenExpiry: { $gt: new Date() }, // Check if not expired
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    
    res.json({ 
      message: 'Verification code is valid',
      verified: true 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    next(error);
  }
});

// Reset password - verifies code and sets new password
router.post('/reset-password', async (req, res, next) => {
  try {
    console.log('[AUTH] Resetting password');
    
    const validatedData = resetPasswordSchema.parse(req.body);
    
    // Find user with matching code
    const user = await User.findOne({ 
      email: validatedData.email.toLowerCase(),
      resetToken: validatedData.code,
      resetTokenExpiry: { $gt: new Date() }, // Check if not expired
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);
    
    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    
    console.log('[AUTH] Password reset successful for:', user.email);
    
    // Generate JWT for automatic login
    const token = jwt.sign(
      { userId: user._id.toString() },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
    
    res.json({
      message: 'Password reset successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0].message });
    }
    next(error);
  }
});

export default router;


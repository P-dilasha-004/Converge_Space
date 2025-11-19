# 🔐 Password Reset Feature Guide

## Overview

The password reset feature allows users to securely reset their password using email verification codes. The flow is seamless and automatically logs users in after successful password reset.

## Features

✅ **Email Verification Codes** - 6-digit codes sent to user's email  
✅ **10-Minute Expiry** - Codes expire after 10 minutes for security  
✅ **Seamless Sign-In** - Users are automatically logged in after password reset  
✅ **Development Mode** - Codes are logged to console when email is not configured  
✅ **Security** - Prevents email enumeration attacks  

---

## 🔄 Password Reset Flow

### Step 1: Request Password Reset
1. User clicks "Forgot your password?" on sign-in page
2. User enters their email address
3. System generates a 6-digit verification code
4. Code is sent to user's email (or logged in development mode)
5. Code expires in 10 minutes

### Step 2: Verify Code
1. User enters the 6-digit code received via email
2. System validates the code
3. If valid, user proceeds to reset password page

### Step 3: Set New Password
1. User enters new password (minimum 6 characters)
2. User confirms new password
3. System updates password and clears reset token
4. **User is automatically logged in** (seamless!)
5. User is redirected to dashboard

---

## 📧 Email Configuration

### Development Mode (Default)
In development, verification codes are logged to the console. No email configuration needed!

**Backend Console Output:**
```
[EMAIL] Development mode - Verification code for user@example.com : 123456
```

### Production Mode - Gmail Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account → Security → 2-Step Verification
   - Click "App passwords"
   - Generate a new app password for "Mail"
3. **Add to `.env`:**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=noreply@convergespace.com
   ```

### Production Mode - Custom SMTP

Add to `backend/.env`:
```env
EMAIL_HOST=smtp.your-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@convergespace.com
```

---

## 🛠️ API Endpoints

### 1. Request Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "If an account exists with this email, a verification code has been sent.",
  "code": "123456"  // Only in development mode
}
```

### 2. Verify Code
```http
POST /api/auth/verify-reset-code
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "message": "Verification code is valid",
  "verified": true
}
```

### 3. Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "newpassword123"
}
```

**Response:**
```json
{
  "message": "Password reset successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@example.com"
  }
}
```

---

## 🎨 Frontend Routes

- `/forgot-password` - Request password reset
- `/verify-code?email=user@example.com` - Enter verification code
- `/reset-password?email=user@example.com&code=123456` - Set new password

---

## 🔒 Security Features

1. **Email Enumeration Prevention** - Always returns success message even if email doesn't exist
2. **Code Expiry** - Codes expire after 10 minutes
3. **Single Use** - Codes are cleared after successful password reset
4. **Secure Storage** - Reset tokens are hashed and stored securely
5. **Automatic Login** - Users are logged in after reset (seamless UX)

---

## 🧪 Testing

### Test Password Reset Flow

1. **Start the application:**
   ```bash
   ./start.sh
   ```

2. **Go to sign-in page:**
   - Navigate to http://localhost:5173/signin
   - Click "Forgot your password?"

3. **Request reset:**
   - Enter your email
   - Check backend console for verification code (development mode)

4. **Verify code:**
   - Enter the 6-digit code from console
   - Or use the code shown on screen (development mode)

5. **Set new password:**
   - Enter new password
   - Confirm password
   - You'll be automatically logged in!

---

## 📝 User Model Updates

The User model now includes:
```typescript
resetToken?: string;        // 6-digit verification code
resetTokenExpiry?: Date;    // Expiry timestamp (10 minutes)
```

---

## 🚀 Quick Start

1. **No email config needed for development!**
   - Codes are logged to console
   - Check backend terminal for verification codes

2. **For production:**
   - Configure email in `backend/.env`
   - Use Gmail App Password or custom SMTP
   - Test email sending before deploying

---

## 💡 Tips

- **Development:** Always check backend console for verification codes
- **Production:** Test email delivery before going live
- **Security:** Never log codes in production mode
- **UX:** The seamless auto-login provides great user experience!

---

That's it! Your password reset feature is ready to use! 🎉


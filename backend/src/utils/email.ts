import nodemailer from 'nodemailer';

const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || 'gmail';
  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;

  // If using custom SMTP
  if (emailHost && emailPort && emailUser && emailPassword) {
    return nodemailer.createTransport({
      host: emailHost,
      port: parseInt(emailPort),
      secure: emailPort === '465',
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  console.log('[EMAIL] No email configuration found. In development mode, codes will be logged to console.');
  return null as any;
};

export const sendVerificationCode = async (email: string, code: string): Promise<boolean> => {
  try {
    const transporter = createTransporter();
  
    if (!transporter) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[EMAIL] Development mode - Verification code for', email, ':', code);
        console.log('[EMAIL] To enable email sending, configure EMAIL_USER and EMAIL_PASSWORD in .env');
        return true; // Return true so the flow continues
      }
      return false;
    }
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@convergespace.com',
      to: email,
      subject: 'Password Reset Verification Code - Converge Space',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Converge Space</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              You requested to reset your password. Use the verification code below to proceed:
            </p>
            <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              This code will expire in 10 minutes. If you didn't request this, please ignore this email.
            </p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 10px;">
              For security reasons, never share this code with anyone.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Converge Space. All rights reserved.</p>
          </div>
        </div>
      `,
      text: `
        Password Reset Verification Code - Converge Space
        
        You requested to reset your password. Use the verification code below:
        
        ${code}
        
        This code will expire in 10 minutes.
        
        If you didn't request this, please ignore this email.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[EMAIL] Verification code sent:', info.messageId);
    
    if (process.env.NODE_ENV === 'development' && info.messageId) {
      console.log('[EMAIL] Preview URL:', nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending verification code:', error);
    if (process.env.NODE_ENV === 'development') {
      console.log('[EMAIL] Development mode: Email sending failed, but continuing...');
      console.log('[EMAIL] Verification code for', email, ':', code);
      return true;
    }
    return false;
  }
};


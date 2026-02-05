// src/services/email.service.ts
import nodemailer from 'nodemailer';
import logger from '../utils/logger';

export class EmailService {
  private transporter;
  private isConfigured: boolean;

  constructor() {
    // Проверка конфигурации
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    this.isConfigured = !!(smtpHost && smtpUser && smtpPass);

    if (this.isConfigured) {
      // Реальная конфигурация SMTP
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    } else {
      // Транспортер для разработки (Ethereal Email)
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: 'test@ethereal.email',
          pass: 'test123', // Замените на реальные данные если нужно
        },
      });
      logger.warn('Using development email configuration (Ethereal)');
    }
  }

  async sendEmail(to: string, subject: string, text: string, html?: string) {
    try {
      // В режиме разработки просто логируем
      if (process.env.NODE_ENV === 'development' && !this.isConfigured) {
        logger.info(`[DEV EMAIL] To: ${to}, Subject: ${subject}`);
        logger.info(`[DEV EMAIL] Content: ${text.substring(0, 100)}...`);
        return {
          success: true,
          message: 'Email logged in development mode',
          previewUrl: 'https://ethereal.email/message',
        };
      }

      const info = await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"WorkFinder" <noreply@workfinder.com>',
        to,
        subject,
        text,
        html: html || text,
      });

      logger.info(`Email sent to ${to}: ${info.messageId}`);
      
      // Для Ethereal показываем ссылку на preview
      if (info.messageId.includes('ethereal')) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        logger.info(`Preview email at: ${previewUrl}`);
        return { 
          success: true, 
          messageId: info.messageId,
          previewUrl 
        };
      }

      return { success: true, messageId: info.messageId };
    } catch (error: any) {
      logger.error('Email send error:', error.message);
      return { 
        success: false, 
        error: error.message,
        details: 'Check SMTP configuration in .env file'
      };
    }
  }

  // Отправка верификации email
  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    return this.sendEmail(
      email,
      'Verify Your Email Address - WorkFinder',
      `Please verify your email by clicking the link: ${verificationUrl}`,
      `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
              .button { 
                display: inline-block; 
                background: #4F46E5; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0; 
              }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>WorkFinder</h1>
              </div>
              <h2>Verify Your Email Address</h2>
              <p>Thank you for registering with WorkFinder! Please verify your email address to complete your registration.</p>
              
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
              
              <p>Or copy and paste this link in your browser:</p>
              <p><code>${verificationUrl}</code></p>
              
              <p>This link will expire in 24 hours.</p>
              
              <div class="footer">
                <p>If you didn't create an account with WorkFinder, you can safely ignore this email.</p>
                <p>&copy; ${new Date().getFullYear()} WorkFinder. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `
    );
  }

  // Отправка уведомления о новом биде
  async sendBidNotification(email: string, projectTitle: string, bidAmount: number, bidderName: string) {
    return this.sendEmail(
      email,
      `New Bid Received: ${projectTitle}`,
      `You have received a new bid on your project "${projectTitle}" from ${bidderName} for $${bidAmount}.`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">New Bid Received!</h2>
          <p>Your project <strong>"${projectTitle}"</strong> has received a new bid.</p>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Bidder:</strong> ${bidderName}</p>
            <p><strong>Amount:</strong> $${bidAmount}</p>
          </div>
          
          <p>Log in to your WorkFinder account to review the bid and communicate with the bidder.</p>
          
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/projects" 
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Bid
          </a>
        </div>
      `
    );
  }

  // Отправка уведомления о сбросе пароля
  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    return this.sendEmail(
      email,
      'Reset Your Password - WorkFinder',
      `To reset your password, click the link: ${resetUrl}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Reset Your Password</h2>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          
          <a href="${resetUrl}" 
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 20px 0;">
            Reset Password
          </a>
          
          <p>Or copy this link:</p>
          <p style="background: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${resetUrl}
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't request a password reset, you can ignore this email. This link will expire in 1 hour.
          </p>
        </div>
      `
    );
  }

  // Отправка уведомления о сообщении
  async sendMessageNotification(email: string, senderName: string, messagePreview: string) {
    return this.sendEmail(
      email,
      `New Message from ${senderName}`,
      `You have received a new message from ${senderName}: "${messagePreview}"`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">New Message</h2>
          <p><strong>From:</strong> ${senderName}</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4F46E5;">
            <p>${messagePreview}</p>
          </div>
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/messages" 
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Message
          </a>
        </div>
      `
    );
  }

  // Отправка уведомления о завершении проекта
  async sendProjectCompletedEmail(email: string, projectTitle: string, freelancerName: string) {
    return this.sendEmail(
      email,
      `Project Completed: ${projectTitle}`,
      `Your project "${projectTitle}" has been completed by ${freelancerName}. Please leave a review.`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4F46E5;">Project Completed!</h2>
          <p>Your project <strong>"${projectTitle}"</strong> has been completed by <strong>${freelancerName}</strong>.</p>
          <p>Please take a moment to leave a review for the freelancer. Your feedback helps improve the WorkFinder community.</p>
          
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/dashboard/reviews" 
             style="background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 15px 0;">
            Leave a Review
          </a>
        </div>
      `
    );
  }

  // Проверка конфигурации
  async testConnection() {
    try {
      await this.transporter.verify();
      return { 
        success: true, 
        message: 'Email server is ready to send messages',
        isConfigured: this.isConfigured 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message,
        isConfigured: this.isConfigured,
        suggestion: this.isConfigured 
          ? 'Check your SMTP settings in .env file' 
          : 'Using development mode. For production, set SMTP_HOST, SMTP_USER, SMTP_PASS in .env'
      };
    }
  }
}

// Экспорт синглтона
export default new EmailService();
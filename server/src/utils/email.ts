import nodemailer from 'nodemailer';
import logger from './logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  try {
    const mailOptions = {
      from: `"WorkFinder" <${process.env.EMAIL_FROM}>`,
      ...options,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error('Error sending email:', error);
    throw error;
  }
};

// Шаблоны писем
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Добро пожаловать в WorkFinder!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Добро пожаловать в WorkFinder, ${name}!</h1>
        <p>Благодарим вас за регистрацию на нашей платформе. Теперь вы можете:</p>
        <ul>
          <li>Находить интересные проекты</li>
          <li>Создавать портфолио</li>
          <li>Общаться с клиентами</li>
          <li>Получать безопасные выплаты</li>
        </ul>
        <p>Если у вас есть вопросы, не стесняйтесь обращаться в нашу поддержку.</p>
        <p>С наилучшими пожеланиями,<br>Команда WorkFinder</p>
      </div>
    `,
  }),

  verifyEmail: (name: string, token: string) => ({
    subject: 'Подтвердите ваш email',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Подтвердите ваш email</h1>
        <p>Привет, ${name}!</p>
        <p>Для завершения регистрации на WorkFinder подтвердите ваш email адрес.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/verify-email?token=${token}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Подтвердить Email
          </a>
        </div>
        <p>Если вы не регистрировались на WorkFinder, проигнорируйте это письмо.</p>
        <p>Ссылка действительна в течение 24 часов.</p>
      </div>
    `,
  }),

  resetPassword: (name: string, token: string) => ({
    subject: 'Сброс пароля',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Сброс пароля</h1>
        <p>Привет, ${name}!</p>
        <p>Мы получили запрос на сброс пароля для вашего аккаунта.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/reset-password?token=${token}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Сбросить пароль
          </a>
        </div>
        <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
        <p>Ссылка действительна в течение 1 часа.</p>
      </div>
    `,
  }),

  projectPublished: (projectTitle: string, clientName: string) => ({
    subject: 'Ваш проект опубликован',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Проект опубликован!</h1>
        <p>Ваш проект "<strong>${projectTitle}</strong>" успешно опубликован на платформе.</p>
        <p>Теперь фрилансеры могут просматривать его и отправлять предложения.</p>
        <p>Мы уведомим вас, когда появятся первые предложения.</p>
        <p>С наилучшими пожеланиями,<br>Команда WorkFinder</p>
      </div>
    `,
  }),

  newBid: (projectTitle: string, freelancerName: string, amount: number) => ({
    subject: 'Новое предложение на ваш проект',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Новое предложение!</h1>
        <p>На ваш проект "<strong>${projectTitle}</strong>" поступило новое предложение.</p>
        <p><strong>Фрилансер:</strong> ${freelancerName}</p>
        <p><strong>Предложение:</strong> ${amount.toLocaleString()} ₽</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL}/dashboard/projects/${projectTitle}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 5px; font-weight: bold;">
            Посмотреть предложение
          </a>
        </div>
      </div>
    `,
  }),
};
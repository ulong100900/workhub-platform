import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  from: string = 'WorkFinder <noreply@workfinder.ru>'
) {
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html
    })

    if (error) {
      console.error('Email error:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Email sending failed:', error)
    return false
  }
}

// Шаблоны писем
export const emailTemplates = {
  welcome: (name: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Добро пожаловать в WorkFinder!</h2>
      <p>Здравствуйте, ${name}!</p>
      <p>Спасибо за регистрацию на нашей платформе. Теперь вы можете:</p>
      <ul>
        <li>Находить клиентов и заказы</li>
        <li>Управлять своим расписанием</li>
        <li>Получать безопасные платежи</li>
        <li>Строить репутацию через отзывы</li>
      </ul>
      <p>Если у вас есть вопросы, отвечайте на это письмо.</p>
      <p>С уважением,<br>Команда WorkFinder</p>
    </div>
  `,

  orderCreated: (orderId: string, service: string, customerName: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Новый заказ!</h2>
      <p>У вас новый заказ #${orderId}</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Услуга:</strong> ${service}</p>
        <p><strong>Клиент:</strong> ${customerName}</p>
      </div>
      <p>Перейдите в личный кабинет для просмотра деталей и подтверждения заказа.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/orders/${orderId}" 
         style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
        Перейти к заказу
      </a>
    </div>
  `,

  paymentReceived: (amount: number, orderId: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Получен платеж!</h2>
      <p>На ваш счет поступила оплата:</p>
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3 style="margin: 0; color: #059669;">${amount.toLocaleString()} ₽</h3>
        <p style="margin: 5px 0 0 0;">Заказ #${orderId}</p>
      </div>
      <p>Средства будут доступны для вывода после завершения работы.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/finance" 
         style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
        Перейти к финансам
      </a>
    </div>
  `,

  resetPassword: (resetLink: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #3b82f6;">Восстановление пароля</h2>
      <p>Вы запросили восстановление пароля для аккаунта WorkFinder.</p>
      <p>Для установки нового пароля перейдите по ссылке:</p>
      <a href="${resetLink}" 
         style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
        Восстановить пароль
      </a>
      <p>Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
      <p>Ссылка действительна в течение 1 часа.</p>
    </div>
  `
}
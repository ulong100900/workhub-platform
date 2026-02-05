
/**
 * Утилиты для редиректов аутентификации
 * Работают как на клиенте, так и на сервере
 */

// Глобальная переменная для отслеживания редиректов (только клиент)
let isRedirecting = false

/**
 * Клиентский редирект с защитой от повторных вызовов
 */
export const safeRedirect = (path: string) => {
  // Только на клиенте
  if (typeof window === 'undefined') return
  
  if (isRedirecting) {
    console.log('⚠️ Редирект уже выполняется, пропускаем')
    return
  }
  
  console.log(`🚀 Выполняем редирект на: ${path}`)
  isRedirecting = true
  
  // Используем window.location для гарантированного редиректа
  window.location.href = path
  
  // Сбрасываем флаг через секунду на случай ошибки
  setTimeout(() => {
    isRedirecting = false
  }, 1000)
}

/**
 * Проверяет, находится ли пользователь на странице авторизации
 */
export const isAuthPage = (pathname: string): boolean => {
  return ['/login', '/register', '/forgot-password', '/reset-password'].some(
    path => pathname.startsWith(path)
  )
}

/**
 * Проверяет, находится ли пользователь на защищенной странице
 */
export const isProtectedPage = (pathname: string): boolean => {
  return ['/dashboard', '/profile', '/settings', '/admin'].some(
    path => pathname.startsWith(path)
  )
}

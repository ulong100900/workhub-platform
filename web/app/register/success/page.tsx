import Link from 'next/link'

export default function RegisterSuccess({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  const email = searchParams.email || ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold">Регистрация успешна!</h1>
        
        <div className="space-y-4">
          <p className="text-gray-600">
            На адрес <span className="font-semibold text-blue-600">{decodeURIComponent(email)}</span> 
            отправлено письмо с подтверждением.
          </p>
          <p className="text-sm text-gray-500">
            Пожалуйста, проверьте вашу почту и перейдите по ссылке в письме.
          </p>
        </div>
        
        <div className="pt-4 space-y-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            Перейти к входу
          </Link>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
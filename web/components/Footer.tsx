// components/Footer.tsx
export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center text-gray-500">
          <p className="text-sm">© {new Date().getFullYear()} WorkFinder. Все права защищены.</p>
          <p className="mt-1 text-sm">Платформа для фрилансеров и заказчиков</p>
        </div>
      </div>
    </footer>
  )
}
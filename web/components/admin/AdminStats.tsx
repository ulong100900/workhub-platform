'use client'

interface StatCard {
  title: string
  value: string | number
  change?: string
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple'
}

export function AdminStats({ stats }: { stats: StatCard[] }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    red: 'bg-red-50 border-red-200 text-red-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`rounded-lg border p-6 ${colors[stat.color || 'blue']}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{stat.title}</p>
              <p className="text-2xl font-bold mt-2">{stat.value}</p>
              {stat.change && (
                <p className="text-sm mt-1">
                  <span className={stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                    {stat.change}
                  </span>{' '}
                  с прошлого месяца
                </p>
              )}
            </div>
            {stat.icon && (
              <div className="p-3 rounded-full bg-white">
                {stat.icon}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
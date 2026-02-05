'use client'

import { Card, CardContent } from '@/components/ui/card'
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  HelpCircle
} from 'lucide-react'

interface MetricsCardProps {
  title: string
  value: string | number
  change?: number
  prefix?: string
  suffix?: string
  icon?: React.ReactNode
  isLoading?: boolean
  helpText?: string
  format?: 'currency' | 'number' | 'percent' | 'time'
}

export default function MetricsCard({ 
  title, 
  value, 
  change, 
  prefix = '', 
  suffix = '',
  icon,
  isLoading = false,
  helpText,
  format = 'number'
}: MetricsCardProps) {
  
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      switch (format) {
        case 'currency':
          return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
          }).format(val)
        case 'percent':
          return `${val.toFixed(1)}%`
        case 'time':
          return `${val.toFixed(1)} ч`
        default:
          return val.toLocaleString('ru-RU')
      }
    }
    return val
  }

  const getChangeColor = (changeValue?: number) => {
    if (changeValue === undefined) return 'text-gray-500'
    if (changeValue > 0) return 'text-green-600'
    if (changeValue < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const getChangeIcon = (changeValue?: number) => {
    if (changeValue === undefined) return null
    if (changeValue > 0) return <TrendingUp className="h-4 w-4" />
    if (changeValue < 0) return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const formattedValue = formatValue(value)

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-sm font-medium text-gray-600">{title}</h3>
              {helpText && (
                <div className="group relative">
                  <HelpCircle className="h-3 w-3 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block">
                    <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                      {helpText}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-gray-900">
                {prefix}{formattedValue}{suffix}
              </div>
              {icon && (
                <div className="ml-2">
                  {icon}
                </div>
              )}
            </div>
            
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-2 text-sm ${getChangeColor(change)}`}>
                {getChangeIcon(change)}
                <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
                <span className="text-gray-500">vs прош. период</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
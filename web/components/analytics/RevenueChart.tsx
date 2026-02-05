'use client'

import { useState, useEffect } from 'react'
import { RevenueAnalytics } from '@/lib/analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TrendingUp, BarChart3, PieChart, Calendar } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface RevenueChartProps {
  data: RevenueAnalytics
  isLoading?: boolean
  onPeriodChange?: (period: 'week' | 'month' | 'quarter' | 'year') => void
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4']

export default function RevenueChart({ data, isLoading, onPeriodChange }: RevenueChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line')
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    if (onPeriodChange) {
      onPeriodChange(period)
    }
  }, [period, onPeriodChange])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(value)
  }

  const categoryData = Object.entries(data.current.byCategory).map(([name, value]) => ({
    name,
    value
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse h-6 bg-gray-200 rounded w-1/3"></div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-[300px] bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Динамика доходов
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Tabs value={chartType} onValueChange={(v: any) => setChartType(v)}>
              <TabsList>
                <TabsTrigger value="line">
                  <BarChart3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="bar">
                  <BarChart3 className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="pie">
                  <PieChart className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
              <SelectTrigger className="w-[120px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="quarter">Квартал</SelectItem>
                <SelectItem value="year">Год</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Краткая статистика */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-sm text-gray-600">Общий доход</p>
            <p className="text-lg font-bold">{formatCurrency(data.current.total)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Изменение</p>
            <p className={`text-lg font-bold ${data.growth.total > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.growth.total > 0 ? '+' : ''}{data.growth.total.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Средний чек</p>
            <p className="text-lg font-bold">{formatCurrency(data.current.averageOrderValue)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Заказов</p>
            <p className="text-lg font-bold">{Math.round(data.current.total / data.current.averageOrderValue)}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[300px]">
          {chartType === 'line' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.current.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                  }}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value).replace('₽', '')}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Доход"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.current.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date"
                  tickFormatter={(value) => {
                    const date = new Date(value)
                    return date.toLocaleDateString('ru-RU', { day: 'numeric' })
                  }}
                />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value).replace('₽', '')}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="amount" 
                  name="Доход" 
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 'pie' && categoryData.length > 0 && (
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </RechartsPieChart>
            </ResponsiveContainer>
          )}
          
          {chartType === 'pie' && categoryData.length === 0 && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Нет данных по категориям</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Легенда для категорий (если не pie chart) */}
        {chartType !== 'pie' && categoryData.length > 0 && (
          <div className="mt-6">
            <h4 className="font-medium mb-3">Распределение по категориям</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {categoryData.map((category, index) => (
                <div key={category.name} className="flex items-center gap-2">
                  <div 
                    className="h-3 w-3 rounded-sm" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm truncate">{category.name}</span>
                  <span className="text-sm font-medium ml-auto">
                    {formatCurrency(category.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
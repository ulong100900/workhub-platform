// components/calendar/CalendarView.tsx
'use client'

import { useState, useEffect } from 'react'
import { Calendar as BigCalendar, momentLocalizer, View, SlotInfo } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  User, 
  Briefcase,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Settings,
  Filter
} from 'lucide-react'
import { CalendarService, CalendarEvent } from '@/lib/calendar'

// Настройка локализации
moment.locale('ru', {
  months: 'января_февраля_марта_апреля_мая_июня_июля_августа_сентября_октября_ноября_декабря'.split('_'),
  monthsShort: 'янв_фев_мар_апр_май_июн_июл_авг_сен_окт_ноя_дек'.split('_'),
  weekdays: 'воскресенье_понедельник_вторник_среда_четверг_пятница_суббота'.split('_'),
  weekdaysShort: 'вс_пн_вт_ср_чт_пт_сб'.split('_'),
  weekdaysMin: 'вс_пн_вт_ср_чт_пт_сб'.split('_'),
  week: {
    dow: 1, // Понедельник - первый день недели
  }
})

const localizer = momentLocalizer(moment)

// Русская локализация
const messages = {
  today: 'Сегодня',
  previous: 'Назад',
  next: 'Вперед',
  month: 'Месяц',
  week: 'Неделя',
  day: 'День',
  agenda: 'Повестка дня',
  date: 'Дата',
  time: 'Время',
  event: 'Событие',
  showMore: (count: number) => `+${count} еще`,
  allDay: 'Весь день',
  work_week: 'Рабочая неделя',
  yesterday: 'Вчера',
  tomorrow: 'Завтра',
  noEventsInRange: 'Нет событий в этом диапазоне'
}

export default function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentView, setCurrentView] = useState<View>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [filterType, setFilterType] = useState<string>('all')
  
  // Загрузка событий
  useEffect(() => {
    loadEvents()
  }, [currentDate, currentView])
  
  const loadEvents = async () => {
    setIsLoading(true)
    try {
      // Загружаем тестовые события
      const mockEvents = CalendarService.generateMockEvents(currentDate)
      
      // Фильтрация по типу
      let filteredEvents = mockEvents
      if (filterType !== 'all') {
        filteredEvents = mockEvents.filter(event => event.type === filterType)
      }
      
      setEvents(filteredEvents)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Обработчик выбора даты/времени
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    console.log('Selected slot:', slotInfo)
    // Здесь можно открыть форму создания события
  }
  
  // Обработчик выбора события
  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event)
  }
  
  // Форматирование события для календаря
  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = event.color || CalendarService.getEventColor(event.type)
    const borderColor = backgroundColor
    
    const style = {
      backgroundColor,
      border: `2px solid ${borderColor}`,
      borderRadius: '6px',
      opacity: 0.9,
      color: 'white',
      fontWeight: '500',
      fontSize: '13px',
      padding: '2px 5px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }
    
    return { style }
  }
  
  // Кастомный рендерер событий
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    return (
      <div className="flex flex-col h-full p-1">
        <div className="flex items-center gap-1">
          <span className="text-xs opacity-90">
            {moment(event.start).format('HH:mm')}
          </span>
          {event.type === 'order' && <Briefcase className="w-3 h-3" />}
          {event.type === 'meeting' && <User className="w-3 h-3" />}
        </div>
        <div className="flex-1 font-medium text-sm truncate">
          {event.title}
        </div>
      </div>
    )
  }
  
  // Навигация
  const navigate = (action: 'PREV' | 'NEXT' | 'TODAY') => {
    switch (action) {
      case 'PREV':
        setCurrentDate(moment(currentDate).subtract(1, currentView === 'day' ? 'day' : currentView).toDate())
        break
      case 'NEXT':
        setCurrentDate(moment(currentDate).add(1, currentView === 'day' ? 'day' : currentView).toDate())
        break
      case 'TODAY':
        setCurrentDate(new Date())
        break
    }
  }
  
  // Статистика
  const stats = {
    total: events.length,
    completed: events.filter(e => e.status === 'completed').length,
    planned: events.filter(e => e.status === 'confirmed').length,
    pending: events.filter(e => e.status === 'pending').length,
    cancelled: events.filter(e => e.status === 'cancelled').length,
    totalHours: events.reduce((sum, event) => {
      const duration = moment(event.end).diff(moment(event.start), 'hours', true)
      return sum + duration
    }, 0).toFixed(1)
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Календарь</h1>
          <p className="text-gray-600 mt-2">
            Управление расписанием и бронированиями
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white rounded-lg border p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('TODAY')}
              className="text-gray-700"
            >
              Сегодня
            </Button>
            
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('PREV')}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('NEXT')}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <h2 className="px-3 font-medium text-gray-900 min-w-[180px] text-center">
              {moment(currentDate).format('MMMM YYYY')}
            </h2>
          </div>
          
          <Select
            value={currentView}
            onValueChange={(value: View) => setCurrentView(value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Месяц</SelectItem>
              <SelectItem value="week">Неделя</SelectItem>
              <SelectItem value="day">День</SelectItem>
              <SelectItem value="agenda">Повестка</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={filterType}
            onValueChange={(value) => {
              setFilterType(value)
              setTimeout(() => loadEvents(), 0)
            }}
          >
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Фильтр" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все события</SelectItem>
              <SelectItem value="order">Заказы</SelectItem>
              <SelectItem value="meeting">Встречи</SelectItem>
              <SelectItem value="block">Блокировки</SelectItem>
              <SelectItem value="personal">Личные</SelectItem>
            </SelectContent>
          </Select>
          
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Добавить
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Основной календарь */}
        <div className="lg:col-span-2">
          <Card className="border shadow-lg">
            <CardContent className="pt-6">
              <div className="h-[600px] rounded-lg overflow-hidden">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
                      <p className="text-gray-600">Загрузка календаря...</p>
                    </div>
                  </div>
                ) : (
                  <BigCalendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    view={currentView}
                    onView={(view) => setCurrentView(view)}
                    date={currentDate}
                    onNavigate={(date) => setCurrentDate(date)}
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    messages={messages}
                    selectable
                    popup
                    components={{
                      event: EventComponent
                    }}
                    formats={{
                      dayFormat: 'D',
                      weekdayFormat: 'dddd',
                      monthHeaderFormat: 'MMMM YYYY',
                      dayHeaderFormat: 'dddd, D MMMM',
                      dayRangeHeaderFormat: ({ start, end }) =>
                        `${moment(start).format('D MMMM')} - ${moment(end).format('D MMMM')}`,
                      timeGutterFormat: 'HH:mm',
                      eventTimeRangeFormat: ({ start, end }) =>
                        `${moment(start).format('HH:mm')} - ${moment(end).format('HH:mm')}`
                    }}
                    // Настройки отображения
                    step={60}
                    timeslots={4}
                    min={new Date(0, 0, 0, 8, 0, 0)}
                    max={new Date(0, 0, 0, 20, 0, 0)}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Правая панель */}
        <div className="space-y-6">
          {/* Статистика */}
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Статистика месяца
              </CardTitle>
              <CardDescription>Обзор вашей активности</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <div className="text-sm text-gray-600">Всего событий</div>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                  <div className="text-sm text-gray-600">Завершено</div>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">{stats.planned}</div>
                  <div className="text-sm text-gray-600">Запланировано</div>
                </div>
                <div className="bg-white p-3 rounded-lg border">
                  <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
                  <div className="text-sm text-gray-600">Отменено</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Прогресс месяца</span>
                  <span className="font-medium">
                    {Math.round((stats.completed / Math.max(stats.total, 1)) * 100)}%
                  </span>
                </div>
                <Progress 
                  value={(stats.completed / Math.max(stats.total, 1)) * 100} 
                  className="h-2"
                />
              </div>
              
              <div className="pt-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Общее время работы</span>
                  <span className="font-medium text-gray-900">{stats.totalHours} ч</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Детали события */}
          {selectedEvent ? (
            <Card className="border shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Детали события</CardTitle>
                  <Badge 
                    variant="outline"
                    className={`${
                      selectedEvent.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                      selectedEvent.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      selectedEvent.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {CalendarService.getStatusText(selectedEvent.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: selectedEvent.color }}
                    />
                    <h3 className="font-semibold text-lg">{selectedEvent.title}</h3>
                  </div>
                  {selectedEvent.description && (
                    <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {selectedEvent.description}
                    </p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium">{moment(selectedEvent.start).format('dddd, D MMMM YYYY')}</div>
                      <div className="text-sm text-gray-500">
                        {moment(selectedEvent.start).format('HH:mm')} - {moment(selectedEvent.end).format('HH:mm')}
                      </div>
                    </div>
                  </div>
                  
                  {selectedEvent.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <div className="text-sm">{selectedEvent.location}</div>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <Briefcase className="h-4 w-4 text-gray-400" />
                    <div className="text-sm">
                      Тип: <span className="font-medium">{CalendarService.getTypeText(selectedEvent.type)}</span>
                    </div>
                  </div>
                  
                  {selectedEvent.orderId && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Заказ #{selectedEvent.orderId}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 pt-4 border-t">
                  <Button variant="outline" className="flex-1">
                    Редактировать
                  </Button>
                  <Button variant="destructive" className="flex-1">
                    Отменить
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border border-dashed">
              <CardContent className="py-8 text-center">
                <CalendarIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-medium text-gray-700 mb-1">Выберите событие</h3>
                <p className="text-gray-500 text-sm">
                  Нажмите на событие в календаре чтобы увидеть детали
                </p>
              </CardContent>
            </Card>
          )}
          
          {/* Быстрые действия */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Быстрые действия
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start h-10">
                <Plus className="h-4 w-4 mr-2" />
                Добавить рабочий день
              </Button>
              <Button variant="outline" className="w-full justify-start h-10">
                <AlertCircle className="h-4 w-4 mr-2" />
                Заблокировать время
              </Button>
              <Button variant="outline" className="w-full justify-start h-10">
                <Download className="h-4 w-4 mr-2" />
                Экспорт расписания
              </Button>
              <Button variant="outline" className="w-full justify-start h-10">
                <Settings className="h-4 w-4 mr-2" />
                Настройки календаря
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
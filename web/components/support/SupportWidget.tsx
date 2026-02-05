'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  MessageSquare,
  X,
  Search,
  HelpCircle,
  FileText,
  Paperclip,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'tickets' | 'knowledge' | 'faq'>('chat')
  const [message, setMessage] = useState('')
  const [tickets, setTickets] = useState([])
  const [faq, setFaq] = useState([])
  const [knowledge, setKnowledge] = useState([])
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    priority: 'normal',
    category: 'general'
  })
  
  const widgetRef = useRef<HTMLDivElement>(null)

  // Загрузка данных поддержки
  const loadSupportData = async () => {
    try {
      const [ticketsRes, faqRes, knowledgeRes] = await Promise.all([
        fetch('/api/support/tickets'),
        fetch('/api/support/faq'),
        fetch('/api/support/knowledge')
      ])

      if (ticketsRes.ok) setTickets(await ticketsRes.json())
      if (faqRes.ok) setFaq(await faqRes.json())
      if (knowledgeRes.ok) setKnowledge(await knowledgeRes.json())
    } catch (error) {
      console.error('Error loading support data:', error)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadSupportData()
    }
  }, [isOpen])

  // Отправка сообщения
  const sendMessage = async () => {
    if (!message.trim()) return

    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() })
      })

      if (response.ok) {
        setMessage('')
        // Обновляем чат
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Создание тикета
  const createTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) return

    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      })

      if (response.ok) {
        setNewTicket({ subject: '', message: '', priority: 'normal', category: 'general' })
        setActiveTab('tickets')
        loadSupportData()
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
    }
  }

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    normal: 'bg-blue-100 text-blue-800',
    high: 'bg-yellow-100 text-yellow-800',
    urgent: 'bg-red-100 text-red-800'
  }

  return (
    <>
      {/* Кнопка открытия виджета */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      {/* Виджет поддержки */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border overflow-hidden z-50">
          {/* Заголовок */}
          <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span className="font-semibold">Поддержка WorkFinder</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-blue-700"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Контент */}
          <div className="flex flex-col h-[calc(100%-56px)]">
            {/* Табы */}
            <div className="border-b">
              <div className="flex">
                <button
                  className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === 'chat' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('chat')}
                >
                  Чат
                </button>
                <button
                  className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === 'tickets' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('tickets')}
                >
                  Мои тикеты
                </button>
                <button
                  className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === 'knowledge' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('knowledge')}
                >
                  База знаний
                </button>
                <button
                  className={`flex-1 py-3 text-center text-sm font-medium ${activeTab === 'faq' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
                  onClick={() => setActiveTab('faq')}
                >
                  FAQ
                </button>
              </div>
            </div>

            {/* Контент табов */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'chat' && (
                <div className="space-y-4">
                  <div className="text-center text-gray-600 text-sm">
                    Чат с поддержкой
                  </div>
                  <div className="space-y-3">
                    {/* Сообщения чата */}
                  </div>
                </div>
              )}

              {activeTab === 'tickets' && (
                <div className="space-y-4">
                  <Button
                    className="w-full"
                    onClick={() => setActiveTab('new-ticket')}
                  >
                    Создать новый тикет
                  </Button>
                  
                  {tickets.map((ticket: any) => (
                    <Card key={ticket.id} className="cursor-pointer hover:bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="font-medium">{ticket.subject}</div>
                          <Badge className={priorityColors[ticket.priority]}>
                            {ticket.priority === 'urgent' ? 'Срочно' :
                             ticket.priority === 'high' ? 'Высокий' :
                             ticket.priority === 'normal' ? 'Обычный' : 'Низкий'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {ticket.message}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            {ticket.status === 'resolved' ? (
                              <CheckCircle className="h-3 w-3 text-green-600" />
                            ) : ticket.status === 'in_progress' ? (
                              <Clock className="h-3 w-3 text-blue-600" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-yellow-600" />
                            )}
                            <span>
                              {ticket.status === 'open' ? 'Открыт' :
                               ticket.status === 'in_progress' ? 'В работе' :
                               ticket.status === 'resolved' ? 'Решен' : 'Закрыт'}
                            </span>
                          </div>
                          <span>
                            {format(new Date(ticket.created_at), 'dd.MM.yy')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {activeTab === 'new-ticket' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Создание тикета</h3>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Тема</label>
                    <Input
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket(prev => ({
                        ...prev,
                        subject: e.target.value
                      }))}
                      placeholder="Кратко опишите проблему"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Категория</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket(prev => ({
                        ...prev,
                        category: e.target.value
                      }))}
                      className="w-full p-2 border rounded"
                    >
                      <option value="general">Общий вопрос</option>
                      <option value="technical">Техническая проблема</option>
                      <option value="billing">Оплата и счета</option>
                      <option value="account">Аккаунт и безопасность</option>
                      <option value="project">Вопрос по проекту</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Приоритет</label>
                    <div className="flex gap-2">
                      {['low', 'normal', 'high', 'urgent'].map((priority) => (
                        <button
                          key={priority}
                          type="button"
                          onClick={() => setNewTicket(prev => ({
                            ...prev,
                            priority
                          }))}
                          className={`flex-1 py-2 text-center text-sm rounded ${
                            newTicket.priority === priority
                              ? priorityColors[priority]
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {priority === 'urgent' ? 'Срочно' :
                           priority === 'high' ? 'Высокий' :
                           priority === 'normal' ? 'Обычный' : 'Низкий'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Подробное описание</label>
                    <Textarea
                      value={newTicket.message}
                      onChange={(e) => setNewTicket(prev => ({
                        ...prev,
                        message: e.target.value
                      }))}
                      placeholder="Опишите проблему максимально подробно..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setActiveTab('tickets')}
                    >
                      Отмена
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={createTicket}
                      disabled={!newTicket.subject.trim() || !newTicket.message.trim()}
                    >
                      Отправить
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'knowledge' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Поиск в базе знаний..."
                      className="pl-9"
                    />
                  </div>

                  {knowledge.map((article: any) => (
                    <Card key={article.id} className="cursor-pointer hover:bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div className="flex-1">
                            <div className="font-medium mb-1">
                              {article.title}
                            </div>
                            <div className="text-sm text-gray-600 line-clamp-2 mb-3">
                              {article.content}
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-4">
                                <span>{article.category}</span>
                                <span>{article.views} просмотров</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button className="flex items-center gap-1">
                                  <ThumbsUp className="h-3 w-3" />
                                  <span>{article.helpful}</span>
                                </button>
                                <button className="flex items-center gap-1">
                                  <ThumbsDown className="h-3 w-3" />
                                  <span>{article.not_helpful}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {activeTab === 'faq' && (
                <div className="space-y-4">
                  {faq.map((item: any) => (
                    <div key={item.id} className="border rounded-lg overflow-hidden">
                      <button
                        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                        onClick={() => {
                          // Логика раскрытия/скрытия ответа
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <HelpCircle className="h-5 w-5 text-gray-400" />
                          <span className="font-medium">{item.question}</span>
                        </div>
                        <span>▼</span>
                      </button>
                      <div className="p-4 pt-0 border-t">
                        <p className="text-gray-600">{item.answer}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <button className="flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            <span>Полезно ({item.helpful})</span>
                          </button>
                          <button className="flex items-center gap-1">
                            <ThumbsDown className="h-3 w-3" />
                            <span>Не полезно</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Поле ввода для чата */}
            {activeTab === 'chat' && (
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Введите сообщение..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button onClick={sendMessage} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
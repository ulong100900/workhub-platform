'use client'

import { useState, useEffect } from 'react'
import { ChatService, ChatPreview } from '@/lib/chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  MessageSquare, 
  User,
  Briefcase,
  Clock,
  Archive,
  Plus
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface ChatListProps {
  userId: string
  onSelectChat: (chatId: string) => void
  activeChatId?: string
}

export default function ChatList({ userId, onSelectChat, activeChatId }: ChatListProps) {
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [filteredChats, setFilteredChats] = useState<ChatPreview[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadChats()
    
    // Обновляем список чатов каждые 30 секунд
    const interval = setInterval(loadChats, 30000)
    return () => clearInterval(interval)
  }, [userId])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChats(chats)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = chats.filter(chat =>
        chat.otherUser.fullName.toLowerCase().includes(query) ||
        chat.lastMessage?.text.toLowerCase().includes(query) ||
        (chat.orderId && chat.orderId.toLowerCase().includes(query))
      )
      setFilteredChats(filtered)
    }
  }, [chats, searchQuery])

  const loadChats = async () => {
    try {
      const chatsData = await ChatService.getUserChats(userId)
      setChats(chatsData)
      setFilteredChats(chatsData)
    } catch (error) {
      console.error('Error loading chats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return format(date, 'HH:mm', { locale: ru })
    } else if (diffDays === 1) {
      return 'Вчера'
    } else if (diffDays < 7) {
      return format(date, 'EEE', { locale: ru })
    } else {
      return format(date, 'dd.MM.yy', { locale: ru })
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'executor':
        return <Briefcase className="h-3 w-3 text-blue-500" />
      case 'customer':
        return <User className="h-3 w-3 text-green-500" />
      default:
        return <User className="h-3 w-3 text-gray-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 border-b animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gray-200"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col border-r bg-white">
      {/* Заголовок и поиск */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Чаты</h2>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск чатов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Список чатов */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Чатов пока нет</h3>
            <p className="text-gray-500 mt-2">
              {searchQuery ? 'По вашему запросу чаты не найдены' : 'Начните общение с исполнителем или заказчиком'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {(Array.isArray(filteredChats) ? filteredChats : []).map((chat) => (
              <div
                key={chat.id}
                className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                  activeChatId === chat.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <div className="flex items-start gap-3">
                  {/* Аватар */}
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
                      {chat.otherUser.avatarUrl ? (
                        <img
                          src={chat.otherUser.avatarUrl}
                          alt={chat.otherUser.fullName}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <MessageSquare className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    {chat.otherUser.isOnline && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                    )}
                  </div>

                  {/* Информация о чате */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate">
                          {chat.otherUser.fullName}
                        </h4>
                        {getRoleIcon(chat.otherUser.role)}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {chat.unreadCount > 0 && (
                          <Badge className="bg-blue-500 text-white">
                            {chat.unreadCount}
                          </Badge>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTime(chat.updatedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Последнее сообщение */}
                    {chat.lastMessage ? (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 truncate">
                          {chat.lastMessage.text}
                        </p>
                        {!chat.lastMessage.isRead && chat.lastMessage.senderId !== userId && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 ml-2 flex-shrink-0"></div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Нет сообщений
                      </p>
                    )}

                    {/* Дополнительная информация */}
                    <div className="flex items-center gap-3 mt-2">
                      {chat.orderId && (
                        <Badge variant="outline" className="text-xs">
                          Заказ #{chat.orderId.slice(0, 8)}
                        </Badge>
                      )}
                      
                      {chat.otherUser.isOnline && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                          онлайн
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Футер */}
      <div className="p-4 border-t">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Всего чатов: {chats.length}
          </span>
          <Button variant="ghost" size="sm">
            <Archive className="h-4 w-4 mr-2" />
            Архив
          </Button>
        </div>
      </div>
    </div>
  )
}
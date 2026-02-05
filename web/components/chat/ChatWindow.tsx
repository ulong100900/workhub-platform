'use client'

import { useState, useEffect, useRef, FormEvent } from 'react'
import { MessageSquare } from 'lucide-react'
import { ChatService, Chat, ChatMessage } from '@/lib/chat'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Send,
  Paperclip,
  Smile,
  MoreVertical,
  Image as ImageIcon,
  File,
  X,
  Edit2,
  Trash2,
  User,
  Clock,
  Check,
  CheckCheck
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface ChatWindowProps {
  chatId: string
  userId: string
  onBack?: () => void
}

export default function ChatWindow({ chatId, userId, onBack }: ChatWindowProps) {
  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (chatId) {
      loadChat()
      loadMessages()
    }
  }, [chatId, userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadChat = async () => {
    try {
      const chatData = await ChatService.getChatById(chatId, userId)
      setChat(chatData)
    } catch (error) {
      console.error('Error loading chat:', error)
    }
  }

  const loadMessages = async (loadMore: boolean = false) => {
    if (!loadMore) {
      setIsLoading(true)
      setPage(1)
    }
    
    try {
      const { messages: newMessages, hasMore: more } = await ChatService.getChatMessages(
        chatId,
        userId,
        loadMore ? page + 1 : 1
      )
      
      if (loadMore) {
        setMessages(prev => [...newMessages, ...prev])
        setPage(prev => prev + 1)
      } else {
        setMessages(newMessages)
      }
      
      setHasMore(more)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || isSending || !chat) return
    
    setIsSending(true)
    
    try {
      const message = await ChatService.sendMessage(
        chatId,
        userId,
        newMessage.trim()
      )
      
      setMessages(prev => [...prev, message])
      setNewMessage('')
      
      // Обновляем информацию о чате
      loadChat()
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Ошибка при отправке сообщения')
    } finally {
      setIsSending(false)
    }
  }

  const handleEditMessage = async (messageId: string, newText: string) => {
    try {
      const updatedMessage = await ChatService.editMessage(messageId, userId, newText)
      
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? updatedMessage : msg
      ))
      
      setEditingMessageId(null)
    } catch (error) {
      console.error('Error editing message:', error)
      alert('Ошибка при редактировании сообщения')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Удалить это сообщение?')) return
    
    try {
      await ChatService.deleteMessage(messageId, userId)
      
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, message: 'Сообщение удалено', isDeleted: true } : msg
      ))
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('Ошибка при удалении сообщения')
    }
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !chat) return
    
    // Здесь будет загрузка файлов в хранилище
    console.log('Uploading files:', files)
    
    // После загрузки отправляем сообщение с файлами
    // const attachments = uploadedFiles.map(file => ({
    //   type: file.type,
    //   url: file.url,
    //   name: file.name,
    //   size: file.size
    // }))
    
    // await ChatService.sendMessage(chatId, userId, 'Файл', 'file', attachments)
    
    e.target.value = '' // Сбрасываем input
  }

  const getOtherParticipant = () => {
    if (!chat || !chat.participantsData) return null
    return chat.participantsData.find(p => p.id !== userId)
  }

  const formatMessageTime = (date: Date) => {
    return format(date, 'HH:mm', { locale: ru })
  }

  const formatMessageDate = (date: Date) => {
    return format(date, 'd MMMM yyyy', { locale: ru })
  }

  const isSameDay = (date1: Date, date2: Date) => {
    return format(date1, 'yyyy-MM-dd') === format(date2, 'yyyy-MM-dd')
  }

  const isSameSender = (msg1: ChatMessage, msg2?: ChatMessage) => {
    if (!msg2) return false
    return msg1.senderId === msg2.senderId && 
           !isSameDay(msg1.createdAt, msg2.createdAt)
  }

  const renderMessage = (message: ChatMessage, index: number) => {
    const isOwnMessage = message.senderId === userId
    const prevMessage = messages[index - 1]
    const nextMessage = messages[index + 1]
    const showDate = !prevMessage || !isSameDay(message.createdAt, prevMessage.createdAt)
    const showSender = !prevMessage || prevMessage.senderId !== message.senderId
    const showTime = !nextMessage || nextMessage.senderId !== message.senderId

    return (
      <div key={message.id}>
        {/* Дата */}
        {showDate && (
          <div className="flex justify-center my-4">
            <Badge variant="outline" className="bg-gray-100">
              {formatMessageDate(message.createdAt)}
            </Badge>
          </div>
        )}

        <div className={`flex gap-3 px-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
          {/* Аватар отправителя (только для чужих сообщений и если показываем отправителя) */}
          {!isOwnMessage && showSender && (
            <Avatar className="h-8 w-8 mt-1">
              {chat?.participantsData?.find(p => p.id === message.senderId)?.avatarUrl ? (
                <AvatarImage src={chat.participantsData.find(p => p.id === message.senderId)?.avatarUrl} />
              ) : (
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              )}
            </Avatar>
          )}

          {/* Сообщение */}
          <div className={`max-w-[70%] ${!isOwnMessage && !showSender ? 'ml-11' : ''}`}>
            {/* Имя отправителя (только для чужих сообщений и если показываем отправителя) */}
            {!isOwnMessage && showSender && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-gray-700">
                  {message.sender?.fullName || 'Пользователь'}
                </span>
                {message.sender?.role === 'executor' && (
                  <Badge variant="outline" className="text-xs">
                    Исполнитель
                  </Badge>
                )}
              </div>
            )}

            {/* Текст сообщения */}
            <div className={`relative group rounded-lg p-3 ${
              isOwnMessage 
                ? 'bg-blue-500 text-white rounded-br-none' 
                : message.type === 'system'
                ? 'bg-gray-100 text-gray-600'
                : 'bg-gray-100 text-gray-900 rounded-bl-none'
            }`}>
              {/* Системное сообщение */}
              {message.type === 'system' && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{message.message}</span>
                </div>
              )}

              {/* Обычное сообщение */}
              {message.type === 'text' && (
                <>
                  <p className="break-words">{message.message}</p>
                  
                  {/* Информация о сообщении */}
                  <div className={`flex items-center justify-end gap-2 mt-2 ${
                    isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {message.isEdited && (
                      <span className="text-xs">ред.</span>
                    )}
                    <span className="text-xs">{formatMessageTime(message.createdAt)}</span>
                    {isOwnMessage && (
                      <>
                        {message.readBy.length > 1 ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Check className="h-3 w-3" />
                        )}
                      </>
                    )}
                  </div>
                </>
              )}

              {/* Вложения */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment, idx) => (
                    <div key={idx} className="p-2 bg-white/10 rounded">
                      <div className="flex items-center gap-2">
                        {attachment.type.startsWith('image/') ? (
                          <ImageIcon className="h-4 w-4" />
                        ) : (
                          <File className="h-4 w-4" />
                        )}
                        <a 
                          href={attachment.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm hover:underline"
                        >
                          {attachment.name}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Кнопки действий для своих сообщений */}
              {isOwnMessage && message.type === 'text' && !message.isDeleted && (
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white/20 hover:bg-white/30"
                      onClick={() => setEditingMessageId(message.id)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white/20 hover:bg-white/30"
                      onClick={() => handleDeleteMessage(message.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Время (если показываем отдельно) */}
            {showTime && (
              <div className={`text-xs text-gray-500 mt-1 ${
                isOwnMessage ? 'text-right' : 'text-left'
              }`}>
                {formatMessageTime(message.createdAt)}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Выберите чат</h3>
          <p className="text-gray-500 mt-2">Выберите чат из списка для начала общения</p>
        </div>
      </div>
    )
  }

  const otherParticipant = getOtherParticipant()

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Заголовок чата */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
              <X className="h-5 w-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            <Avatar>
              {otherParticipant?.avatarUrl ? (
                <AvatarImage src={otherParticipant.avatarUrl} />
              ) : (
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              )}
            </Avatar>
            
            <div>
              <h3 className="font-semibold">{otherParticipant?.fullName}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                {otherParticipant?.isOnline ? (
                  <>
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <span>онлайн</span>
                  </>
                ) : (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>
                      {otherParticipant?.lastSeen 
                        ? `был(а) ${format(otherParticipant.lastSeen, 'dd.MM HH:mm', { locale: ru })}`
                        : 'не в сети'}
                    </span>
                  </>
                )}
                {otherParticipant?.role === 'executor' && (
                  <Badge variant="outline" className="text-xs">
                    Исполнитель
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {chat.orderId && (
            <Badge variant="outline">
              Заказ #{chat.orderId.slice(0, 8)}
            </Badge>
          )}
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Сообщения */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
        onScroll={(e) => {
          const container = e.currentTarget
          if (container.scrollTop === 0 && hasMore && !isLoading) {
            loadMessages(true)
          }
        }}
      >
        {isLoading && page === 1 ? (
          <div className="flex items-center justify-center h-full">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Нет сообщений</h3>
            <p className="text-gray-500 mt-2">
              Начните общение с {otherParticipant?.fullName || 'пользователем'}
            </p>
          </div>
        ) : (
          <>
            {hasMore && (
              <div className="flex justify-center mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => loadMessages(true)}
                  disabled={isLoading}
                >
                  {isLoading ? 'Загрузка...' : 'Загрузить предыдущие сообщения'}
                </Button>
              </div>
            )}
            
            {messages.map((message, index) => renderMessage(message, index))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Форма отправки сообщения */}
      {!chat.isBlocked ? (
        <form onSubmit={handleSendMessage} className="p-4 border-t">
          {/* Редактирование сообщения */}
          {editingMessageId && (
            <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-blue-800">Редактирование сообщения</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingMessageId(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите новый текст сообщения..."
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const messageToEdit = messages.find(m => m.id === editingMessageId)
                    if (messageToEdit) {
                      handleEditMessage(editingMessageId, newMessage)
                    }
                  }}
                >
                  Сохранить
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMessageId(null)}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleFileUpload}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              onChange={handleFileChange}
            />
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Введите сообщение..."
              className="flex-1"
              disabled={isSending}
            />
            
            <Button
              type="button"
              variant="outline"
              size="icon"
            >
              <Smile className="h-5 w-5" />
            </Button>
            
            <Button 
              type="submit" 
              size="icon"
              disabled={!newMessage.trim() || isSending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="mt-2 text-xs text-gray-500">
            Нажмите Enter для отправки, Shift+Enter для новой строки
          </div>
        </form>
      ) : (
        <div className="p-4 border-t text-center">
          <p className="text-gray-500">Чат заблокирован</p>
          {chat.blockedBy === userId && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => ChatService.unblockChat(chatId, userId)}
            >
              Разблокировать чат
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
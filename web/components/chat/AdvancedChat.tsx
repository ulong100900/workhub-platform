'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { 
  Send, 
  Paperclip, 
  Mic, 
  Image as ImageIcon,
  Smile,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Video,
  Phone,
  Archive,
  BellOff,
  Search,
  Pin,
  Trash2,
  Download,
  Play,
  Pause,
  ThumbsUp,
  Heart,
  Laugh,
  Wow,
  Sad,
  Angry
} from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import EmojiPicker from 'emoji-picker-react'

interface ChatMessage {
  id: string
  sender_id: string
  receiver_id: string
  message_type: 'text' | 'image' | 'file' | 'voice'
  message?: string
  file_url?: string
  file_name?: string
  file_size?: number
  file_type?: string
  voice_duration?: number
  is_read: boolean
  read_at?: string
  reactions: Record<string, string[]> // { '👍': ['user1', 'user2'] }
  created_at: string
  sender?: {
    id: string
    full_name: string
    avatar_url?: string
  }
}

interface ChatRoom {
  id: string
  user1_id: string
  user2_id: string
  project_id?: string
  last_message?: ChatMessage
  unread_count: number
  is_archived: boolean
  is_muted: boolean
  other_user: {
    id: string
    full_name: string
    avatar_url?: string
    online?: boolean
  }
}

export default function AdvancedChat() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [recording, setRecording] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [voiceNote, setVoiceNote] = useState<Blob | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  // Загрузка чат-комнат
  const loadChatRooms = async () => {
    try {
      const response = await fetch('/api/chat/rooms')
      if (response.ok) {
        const data = await response.json()
        setRooms(data.rooms || [])
      }
    } catch (error) {
      console.error('Error loading chat rooms:', error)
    }
  }

  // Загрузка сообщений комнаты
  const loadMessages = async (roomId: string) => {
    try {
      const response = await fetch(`/api/chat/rooms/${roomId}/messages`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
        scrollToBottom()
        
        // Помечаем сообщения как прочитанные
        markMessagesAsRead(roomId)
      }
    } catch (error) {
      console.error('Error loading messages:', error)
    }
  }

  // Отправка сообщения
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom) return

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: activeRoom,
          message: newMessage.trim(),
          message_type: 'text'
        })
      })

      if (response.ok) {
        const newMsg = await response.json()
        setMessages(prev => [...prev, newMsg])
        setNewMessage('')
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  // Отправка файла
  const sendFile = async (file: File) => {
    if (!activeRoom) return

    setUploadingFile(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('room_id', activeRoom)
    formData.append('message_type', file.type.startsWith('image/') ? 'image' : 'file')

    try {
      const response = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const newMsg = await response.json()
        setMessages(prev => [...prev, newMsg])
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error sending file:', error)
    } finally {
      setUploadingFile(false)
    }
  }

  // Запись голосового сообщения
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const audioChunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
        setVoiceNote(audioBlob)
        sendVoiceMessage(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()
      setRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop()
      setRecording(false)
    }
  }

  const sendVoiceMessage = async (audioBlob: Blob) => {
    if (!activeRoom) return

    const formData = new FormData()
    formData.append('audio', audioBlob, 'voice.webm')
    formData.append('room_id', activeRoom)

    try {
      const response = await fetch('/api/chat/voice', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const newMsg = await response.json()
        setMessages(prev => [...prev, newMsg])
        scrollToBottom()
      }
    } catch (error) {
      console.error('Error sending voice message:', error)
    }
  }

  // Реакции на сообщения
  const addReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/chat/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      })

      if (response.ok) {
        const updatedMessage = await response.json()
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? updatedMessage : msg
        ))
      }
    } catch (error) {
      console.error('Error adding reaction:', error)
    }
  }

  // Отслеживание печати
  const handleTyping = useCallback(() => {
    if (!activeRoom) return

    // Отправляем статус печати
    fetch(`/api/chat/rooms/${activeRoom}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_typing: true })
    })

    // Сбрасываем таймер
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      fetch(`/api/chat/rooms/${activeRoom}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_typing: false })
      })
    }, 2000)
  }, [activeRoom])

  // Пометить сообщения как прочитанные
  const markMessagesAsRead = async (roomId: string) => {
    try {
      await fetch(`/api/chat/rooms/${roomId}/read`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  // Прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Эмодзи
  const handleEmojiClick = (emoji: any) => {
    setNewMessage(prev => prev + emoji.emoji)
  }

  // WebSocket для реального времени
  useEffect(() => {
    if (!activeRoom) return

    const ws = new WebSocket(`ws://localhost:3000/api/chat/ws?room=${activeRoom}`)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'new_message':
          setMessages(prev => [...prev, data.message])
          scrollToBottom()
          break
        case 'typing':
          setTypingUsers(data.users)
          break
        case 'message_read':
          setMessages(prev => prev.map(msg => 
            msg.id === data.message_id ? { ...msg, is_read: true, read_at: data.read_at } : msg
          ))
          break
      }
    }

    return () => ws.close()
  }, [activeRoom])

  // Инициализация
  useEffect(() => {
    loadChatRooms()
  }, [])

  const activeRoomData = rooms.find(r => r.id === activeRoom)
  const filteredMessages = messages.filter(msg =>
    msg.message?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const emojiReactions = [
    { emoji: '👍', icon: ThumbsUp },
    { emoji: '❤️', icon: Heart },
    { emoji: '😂', icon: Laugh },
    { emoji: '😮', icon: Wow },
    { emoji: '😢', icon: Sad },
    { emoji: '😠', icon: Angry }
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Список чатов */}
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Сообщения</h2>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Поиск сообщений..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-120px)]">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                activeRoom === room.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => {
                setActiveRoom(room.id)
                loadMessages(room.id)
              }}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={room.other_user.avatar_url} />
                  <AvatarFallback>
                    {room.other_user.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold truncate">
                      {room.other_user.full_name}
                    </div>
                    {room.last_message && (
                      <div className="text-xs text-gray-500">
                        {format(new Date(room.last_message.created_at), 'HH:mm')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 truncate">
                      {room.last_message?.message_type === 'image' ? '📷 Изображение' :
                       room.last_message?.message_type === 'file' ? '📎 Файл' :
                       room.last_message?.message_type === 'voice' ? '🎤 Голосовое' :
                       room.last_message?.message}
                    </div>
                    {room.unread_count > 0 && (
                      <Badge className="bg-blue-600 text-white">
                        {room.unread_count}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Чат */}
      <div className="flex-1 flex flex-col">
        {activeRoomData ? (
          <>
            {/* Заголовок чата */}
            <div className="p-4 border-b bg-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={activeRoomData.other_user.avatar_url} />
                  <AvatarFallback>
                    {activeRoomData.other_user.full_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">
                    {activeRoomData.other_user.full_name}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    {typingUsers.length > 0 ? (
                      <span className="text-blue-600">печатает...</span>
                    ) : activeRoomData.other_user.online ? (
                      <span className="text-green-600">online</span>
                    ) : (
                      <span>был(а) недавно</span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Сообщения */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-lg ${msg.sender_id === user?.id ? 'bg-blue-100' : 'bg-white'} rounded-2xl p-3 shadow-sm`}>
                    {/* Отправитель */}
                    {msg.sender_id !== user?.id && (
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={msg.sender?.avatar_url} />
                          <AvatarFallback>
                            {msg.sender?.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {msg.sender?.full_name}
                        </span>
                      </div>
                    )}

                    {/* Текст сообщения */}
                    {msg.message_type === 'text' && (
                      <div className="whitespace-pre-wrap">{msg.message}</div>
                    )}

                    {/* Изображение */}
                    {msg.message_type === 'image' && msg.file_url && (
                      <img
                        src={msg.file_url}
                        alt="Изображение"
                        className="rounded-lg max-w-full max-h-96 object-cover cursor-pointer"
                        onClick={() => window.open(msg.file_url, '_blank')}
                      />
                    )}

                    {/* Файл */}
                    {msg.message_type === 'file' && msg.file_url && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          <Paperclip className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium truncate">
                            {msg.file_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {(msg.file_size || 0) / 1024 > 1024
                              ? `${((msg.file_size || 0) / 1024 / 1024).toFixed(1)} MB`
                              : `${Math.round((msg.file_size || 0) / 1024)} KB`}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(msg.file_url, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    )}

                    {/* Голосовое сообщение */}
                    {msg.message_type === 'voice' && msg.file_url && (
                      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        <Button variant="ghost" size="icon">
                          <Play className="h-5 w-5" />
                        </Button>
                        <div className="flex-1">
                          <div className="font-medium">
                            Голосовое сообщение
                          </div>
                          <div className="text-sm text-gray-500">
                            {msg.voice_duration} сек
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Статус и время */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="text-xs text-gray-500">
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </div>
                      <div className="flex items-center gap-1">
                        {msg.is_read ? (
                          <CheckCheck className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Check className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Реакции */}
                    {Object.keys(msg.reactions).length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {Object.entries(msg.reactions).map(([emoji, users]) => (
                          <Badge
                            key={emoji}
                            variant="outline"
                            className="text-xs cursor-pointer hover:bg-gray-100"
                            onClick={() => addReaction(msg.id, emoji)}
                          >
                            {emoji} {users.length}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Кнопки реакций */}
                    <div className="flex gap-1 mt-2">
                      {emojiReactions.map(({ emoji, icon: Icon }) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => addReaction(msg.id, emoji)}
                        >
                          <Icon className="h-3 w-3" />
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Инпут для сообщений */}
            <div className="p-4 border-t bg-white">
              {/* Быстрые реакции */}
              <div className="flex gap-2 mb-3">
                {emojiReactions.map(({ emoji }) => (
                  <Button
                    key={emoji}
                    variant="outline"
                    size="sm"
                    className="text-lg"
                    onClick={() => addReaction(messages[messages.length - 1]?.id, emoji)}
                  >
                    {emoji}
                  </Button>
                ))}
              </div>

              {/* Поле ввода */}
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <Textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value)
                      handleTyping()
                    }}
                    placeholder="Введите сообщение..."
                    className="min-h-[60px] max-h-[120px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  
                  {/* Эмодзи палитра */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full mb-2">
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}
                </div>

                {/* Кнопки действий */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  >
                    <Smile className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingFile}
                  >
                    {uploadingFile ? (
                      <Clock className="h-5 w-5 animate-spin" />
                    ) : (
                      <Paperclip className="h-5 w-5" />
                    )}
                  </Button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) sendFile(file)
                    }}
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={recording ? 'bg-red-100 text-red-600' : ''}
                  >
                    <Mic className="h-5 w-5" />
                  </Button>

                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    size="icon"
                  >
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Выберите чат
              </h3>
              <p className="text-gray-600">
                Начните общение, выбрав диалог из списка
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
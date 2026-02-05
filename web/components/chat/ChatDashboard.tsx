'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MessageSquare, 
  Users, 
  Archive,
  Plus,
  Search
} from 'lucide-react'
import ChatList from './ChatList'
import ChatWindow from './ChatWindow'

export default function ChatDashboard() {
  const [activeChatId, setActiveChatId] = useState<string>()
  const [activeTab, setActiveTab] = useState('active')
  
  // В реальном приложении userId из контекста/сессии
  const userId = 'user-id'

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId)
  }

  const handleBack = () => {
    setActiveChatId(undefined)
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Заголовок */}
      <div className="p-6 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Сообщения</h1>
            <p className="text-gray-500 mt-2">
              Общайтесь с исполнителями и заказчиками
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Новый чат
            </Button>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full grid grid-cols-1 lg:grid-cols-3">
          {/* Список чатов (скрывается на мобильных при открытом чате) */}
          <div className={`h-full ${activeChatId ? 'hidden lg:block' : 'block'}`}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
              <div className="p-4 border-b">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="active">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Активные
                  </TabsTrigger>
                  <TabsTrigger value="unread">
                    <Users className="h-4 w-4 mr-2" />
                    Непрочитанные
                  </TabsTrigger>
                  <TabsTrigger value="archived">
                    <Archive className="h-4 w-4 mr-2" />
                    Архив
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="active" className="h-[calc(100%-73px)] m-0">
                <ChatList 
                  userId={userId}
                  onSelectChat={handleSelectChat}
                  activeChatId={activeChatId}
                />
              </TabsContent>
              
              <TabsContent value="unread" className="h-[calc(100%-73px)] m-0">
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Нет непрочитанных</h3>
                    <p className="text-gray-500 mt-2">
                      Все сообщения прочитаны
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="archived" className="h-[calc(100%-73px)] m-0">
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Archive className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">Архив пуст</h3>
                    <p className="text-gray-500 mt-2">
                      Здесь будут архивированные чаты
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Окно чата */}
          <div className={`h-full ${activeChatId ? 'block lg:col-span-2' : 'hidden lg:block lg:col-span-2'}`}>
            {activeChatId ? (
              <ChatWindow 
                chatId={activeChatId}
                userId={userId}
                onBack={handleBack}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Выберите чат</h3>
                  <p className="text-gray-500 mt-2">
                    Выберите чат из списка для начала общения
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
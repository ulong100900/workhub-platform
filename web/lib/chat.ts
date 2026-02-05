import { createClient } from './supabase/client'
const getSupabaseBrowserClient = createClient

export const chatService = {
  // Получение списка чатов пользователя
  async getUserChats(userId: string) {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id,
          created_at,
          updated_at,
          last_message,
          participants:chat_participants!inner(
            user:profiles!inner(
              id,
              name,
              avatar,
              rating
            )
          )
        `)
        .eq('participants.user_id', userId)
        .order('updated_at', { ascending: false })
      
      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error getting user chats:', error)
      return { data: null, error: error.message }
    }
  },

  // Получение сообщений чата
  async getChatMessages(chatId: string, limit = 50) {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender:profiles!inner(
            id,
            name,
            avatar
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      return { data: data?.reverse() || [], error: null }
    } catch (error: any) {
      console.error('Error getting chat messages:', error)
      return { data: [], error: error.message }
    }
  },

  // Отправка сообщения
  async sendMessage(chatId: string, senderId: string, content: string) {
    try {
      const supabase = getSupabaseBrowserClient()
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error: any) {
      console.error('Error sending message:', error)
      return { data: null, error: error.message }
    }
  },

  // Создание нового чата
  async createChat(userId1: string, userId2: string) {
    try {
      const supabase = getSupabaseBrowserClient()
      
      // Создаем чат
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({})
        .select()
        .single()
      
      if (chatError) throw chatError
      
      // Добавляем участников
      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert([
          { chat_id: chat.id, user_id: userId1 },
          { chat_id: chat.id, user_id: userId2 }
        ])
      
      if (participantsError) throw participantsError
      
      return { data: chat, error: null }
    } catch (error: any) {
      console.error('Error creating chat:', error)
      return { data: null, error: error.message }
    }
  }
}
export const ChatService = chatService
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bidId = params.id
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('bid_messages')
      .select(`
        *,
        sender:profiles(*)
      `)
      .eq('bid_id', bidId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    return NextResponse.json({ messages: data })
  } catch (error: any) {
    console.error('Error fetching bid messages:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении сообщений' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bidId = params.id
    const { content, senderId } = await request.json()
    
    if (!content || !senderId) {
      return NextResponse.json(
        { error: 'Отсутствует содержание или отправитель' },
        { status: 400 }
      )
    }
    
    const supabase = createServerClient()
    
    const { data, error } = await supabase
      .from('bid_messages')
      .insert({
        bid_id: bidId,
        content,
        sender_id: senderId,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return NextResponse.json({ message: data })
  } catch (error: any) {
    console.error('Error creating bid message:', error)
    return NextResponse.json(
      { error: 'Ошибка при отправке сообщения' },
      { status: 500 }
    )
  }
}
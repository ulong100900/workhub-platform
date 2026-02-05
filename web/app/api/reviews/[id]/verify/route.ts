import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Проверяем права (только админ или участник проекта)
    const { data: review } = await supabase
      .from('reviews')
      .select('*, project:projects(*)')
      .eq('id', params.id)
      .single()

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Проверяем, завершен ли проект
    if (review.project.status !== 'completed') {
      return NextResponse.json(
        { error: 'Проект не завершен' },
        { status: 400 }
      )
    }

    // Проверяем, участвовал ли пользователь в проекте
    const isParticipant = 
      review.reviewer_id === user.id || 
      review.reviewee_id === user.id ||
      review.project.user_id === user.id

    if (!isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Верифицируем отзыв
    const { error } = await supabase
      .from('reviews')
      .update({
        is_verified: true,
        verification_data: {
          verified_by: user.id,
          verified_at: new Date().toISOString(),
          verification_method: 'manual'
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)

    if (error) throw error

    // Отправляем уведомление
    await supabase.from('notifications').insert({
      user_id: review.reviewer_id,
      type: 'review_verified',
      title: 'Ваш отзыв верифицирован',
      message: `Ваш отзыв на проект "${review.project.title}" прошел верификацию`,
      is_read: false,
      created_at: new Date().toISOString()
    })

    return NextResponse.json({ 
      success: true, 
      message: 'Отзыв верифицирован' 
    })
  } catch (error) {
    console.error('Error verifying review:', error)
    return NextResponse.json(
      { error: 'Failed to verify review' },
      { status: 500 }
    )
  }
}
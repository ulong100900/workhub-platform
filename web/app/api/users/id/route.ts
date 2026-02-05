// /web/app/api/user/id/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Not authenticated' 
        },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: session.user.id
      }
    })

  } catch (error) {
    console.error('Error getting user ID:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    )
  }
}
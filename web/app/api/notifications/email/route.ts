import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Временно возвращаем успех без реальной отправки
    return NextResponse.json({ 
      success: true,
      message: 'Email sent (simulated)' 
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Email service is temporarily unavailable' },
      { status: 503 }
    )
  }
}
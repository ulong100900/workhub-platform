import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    success: true,
    stats: {
      totalUsers: 100,
      totalProjects: 50,
      totalRevenue: 250000,
      activeFreelancers: 30
    }
  })
}
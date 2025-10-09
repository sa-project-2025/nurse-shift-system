import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Fetch all work reports for this user
    const { data: reports, error } = await supabaseAdmin
      .from('work_reports')
      .select('*')
      .eq('user_id', userId)
      .order('report_month', { ascending: false })

    if (error) {
      console.error('Error fetching work reports:', error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    return NextResponse.json({
      reports: reports || []
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { scheduleIds, userId } = body

    if (!scheduleIds || !Array.isArray(scheduleIds) || scheduleIds.length === 0) {
      return NextResponse.json({ error: 'Schedule IDs are required' }, { status: 400 })
    }

    // Verify that user is head nurse and owns these schedules
    const { data: schedules, error: verifyError } = await supabaseAdmin
      .from('schedules')
      .select('schedules_id, created_by, status')
      .in('schedules_id', scheduleIds)
      .eq('created_by', userId)
      .eq('status', 'draft')

    if (verifyError) {
      console.error('Error verifying schedules:', verifyError)
      return NextResponse.json({ error: 'Failed to verify schedules' }, { status: 500 })
    }

    if (!schedules || schedules.length !== scheduleIds.length) {
      return NextResponse.json({ error: 'Invalid schedule IDs or insufficient permissions' }, { status: 403 })
    }

    // Update schedules to published status
    const { error: updateError } = await supabaseAdmin
      .from('schedules')
      .update({
        status: 'published',
        published_date: new Date().toISOString()
      })
      .in('schedules_id', scheduleIds)

    if (updateError) {
      console.error('Error publishing schedules:', updateError)
      return NextResponse.json({ error: 'Failed to publish schedules' }, { status: 500 })
    }

    // TODO: Send notifications to affected nurses

    return NextResponse.json({
      message: 'ประกาศตารางเวรสำเร็จ',
      publishedCount: scheduleIds.length
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
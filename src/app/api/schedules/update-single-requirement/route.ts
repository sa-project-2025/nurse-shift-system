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

    const { scheduleId, requiredNurse, userId } = body

    if (!scheduleId || !requiredNurse || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update single schedule
    const { data, error } = await supabaseAdmin
      .from('schedules')
      .update({ required_nurse: requiredNurse })
      .eq('schedules_id', scheduleId)
      .eq('status', 'draft') // Only update draft schedules
      .select()
      .single()

    if (error) {
      console.error('Error updating schedule requirement:', error)
      return NextResponse.json({ error: 'Failed to update requirement' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Schedule not found or not a draft' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'อัปเดตจำนวนพยาบาลสำเร็จ',
      schedule: data
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
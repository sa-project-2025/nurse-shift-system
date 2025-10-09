import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, monthYear, schedules, stats } = body

    if (!userId || !monthYear || !schedules || !stats) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if work report already exists for this month
    const { data: existingReport } = await supabaseAdmin
      .from('work_reports')
      .select('report_id')
      .eq('user_id', userId)
      .eq('report_month', monthYear)
      .maybeSingle()

    if (existingReport) {
      return NextResponse.json({
        error: 'รายงานเวรเดือนนี้ถูกบันทึกแล้ว'
      }, { status: 400 })
    }

    // Insert work report
    const { data: report, error: insertError } = await supabaseAdmin
      .from('work_reports')
      .insert({
        user_id: userId,
        report_month: monthYear,
        work_days_count: stats.workDays,
        shifts_count: stats.totalShifts,
        total_hours: stats.totalHours,
        morning_shifts: stats.morningShifts,
        afternoon_shifts: stats.afternoonShifts,
        night_shifts: stats.nightShifts,
        rest_days: stats.restDays,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting work report:', insertError)
      return NextResponse.json({
        error: 'ไม่สามารถบันทึกรายงานได้'
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'บันทึกรายงานเวรสำเร็จ',
      report
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

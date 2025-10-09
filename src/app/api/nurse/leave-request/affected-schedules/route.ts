import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, startDate, endDate } = await request.json()

    if (!userId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    // ดึงเวรของพยาบาลในช่วงวันที่ลา
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('shift_assignments')
      .select('schedules_id')
      .eq('user_id', userId)

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return NextResponse.json(
        { error: 'ไม่สามารถดึงข้อมูลเวรได้' },
        { status: 500 }
      )
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ schedules: [] })
    }

    const scheduleIds = assignments.map((a: any) => a.schedules_id)

    // ดึงข้อมูล schedules ที่อยู่ในช่วงวันที่ลา
    const { data: schedules, error } = await supabaseAdmin
      .from('schedules')
      .select('schedules_id, date, shift_type, status')
      .in('schedules_id', scheduleIds)
      .gte('date', startDate)
      .lte('date', endDate)
      .eq('status', 'published')
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching schedules:', error)
      return NextResponse.json(
        { error: 'ไม่สามารถดึงข้อมูลเวรได้' },
        { status: 500 }
      )
    }

    const affectedSchedules = schedules || []

    return NextResponse.json({
      schedules: affectedSchedules
    })
  } catch (error) {
    console.error('Error in affected-schedules API:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    )
  }
}

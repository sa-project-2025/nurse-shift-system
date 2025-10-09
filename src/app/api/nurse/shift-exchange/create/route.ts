import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requesterId, targetUserId, originalScheduleId, targetScheduleId, reason } = body

    // Validate required fields
    if (!requesterId || !targetUserId || !originalScheduleId || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if there's already a pending request for this schedule
    const { data: existingRequest, error: checkError } = await supabaseAdmin
      .from('shift_exchange_requests')
      .select('*')
      .eq('status', 'pending')
      .or(`and(requester_id.eq.${requesterId},original_schedule_id.eq.${originalScheduleId}),and(target_user_id.eq.${requesterId},original_schedule_id.eq.${originalScheduleId})`)

    if (checkError) {
      console.error('Error checking existing requests:', checkError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingRequest && existingRequest.length > 0) {
      return NextResponse.json(
        { error: 'คุณมีคำขอแลกเวรที่รอการอนุมัติอยู่แล้วสำหรับเวรนี้' },
        { status: 400 }
      )
    }

    // Get the dates of both shifts
    const { data: originalSchedule, error: originalError } = await supabaseAdmin
      .from('schedules')
      .select('date, shift_type')
      .eq('schedules_id', originalScheduleId)
      .single()

    if (originalError || !originalSchedule) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลเวรต้นทาง' }, { status: 400 })
    }

    const { data: targetSchedule, error: targetError } = await supabaseAdmin
      .from('schedules')
      .select('date, shift_type')
      .eq('schedules_id', targetScheduleId)
      .single()

    if (targetError || !targetSchedule) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลเวรปลายทาง' }, { status: 400 })
    }

    // Check if requester already has the SAME shift type on the target date
    const { data: requesterConflict } = await supabaseAdmin
      .from('shift_assignments')
      .select(`
        assignment_id,
        schedules:schedules!shift_assignment_schedules_id_fkey (
          date,
          shift_type
        )
      `)
      .eq('user_id', requesterId)

    const requesterHasSameShift = requesterConflict?.some((assignment: any) => {
      return assignment.schedules?.date === targetSchedule.date &&
             assignment.schedules?.shift_type === targetSchedule.shift_type
    })

    if (requesterHasSameShift) {
      return NextResponse.json(
        { error: `คุณมีเวรกะ${targetSchedule.shift_type}อยู่แล้วในวันที่ ${targetSchedule.date} ไม่สามารถแลกเวรได้` },
        { status: 400 }
      )
    }

    // Check if target user already has the SAME shift type on the original date
    const { data: targetConflict } = await supabaseAdmin
      .from('shift_assignments')
      .select(`
        assignment_id,
        schedules:schedules!shift_assignment_schedules_id_fkey (
          date,
          shift_type
        )
      `)
      .eq('user_id', targetUserId)

    const targetHasSameShift = targetConflict?.some((assignment: any) => {
      return assignment.schedules?.date === originalSchedule.date &&
             assignment.schedules?.shift_type === originalSchedule.shift_type
    })

    if (targetHasSameShift) {
      return NextResponse.json(
        { error: `พยาบาลที่คุณเลือกมีเวรกะ${originalSchedule.shift_type}อยู่แล้วในวันที่ ${originalSchedule.date} ไม่สามารถแลกเวรได้` },
        { status: 400 }
      )
    }

    // Create shift exchange request with Thailand timezone (GMT+7)
    const thaiDate = new Date(new Date().getTime() + (7 * 60 * 60 * 1000))

    const { error: insertError } = await supabaseAdmin
      .from('shift_exchange_requests')
      .insert({
        requester_id: requesterId,
        target_user_id: targetUserId,
        original_schedule_id: originalScheduleId,
        target_schedule_id: targetScheduleId,
        request_date: thaiDate.toISOString(),
        reason,
        status: 'pending'
      })

    if (insertError) {
      console.error('Error creating shift exchange request:', insertError)
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 })
    }

    return NextResponse.json(
      { message: 'ส่งคำขอแลกเวรสำเร็จ' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error creating shift exchange request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

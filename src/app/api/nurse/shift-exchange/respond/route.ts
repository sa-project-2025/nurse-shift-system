import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { exchangeId, response } = body // response: 'approved' or 'rejected'

    if (!exchangeId || !response) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (response !== 'approved' && response !== 'rejected') {
      return NextResponse.json(
        { error: 'Invalid response value' },
        { status: 400 }
      )
    }

    // Get the exchange request details
    const { data: exchangeRequest, error: fetchError } = await supabaseAdmin
      .from('shift_exchange_requests')
      .select('*')
      .eq('exchange_id', exchangeId)
      .single()

    if (fetchError || !exchangeRequest) {
      return NextResponse.json(
        { error: 'Exchange request not found' },
        { status: 404 }
      )
    }

    // Update the request status
    const { error: updateError } = await supabaseAdmin
      .from('shift_exchange_requests')
      .update({ status: response })
      .eq('exchange_id', exchangeId)

    if (updateError) {
      console.error('Error updating request status:', updateError)
      return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
    }

    // If approved, swap the shift assignments and delete work reports
    if (response === 'approved') {
      const requesterId = exchangeRequest.requester_id
      const targetUserId = exchangeRequest.target_user_id
      const originalScheduleId = exchangeRequest.original_schedule_id
      const targetScheduleId = exchangeRequest.target_schedule_id

      // Get the assignment IDs
      const { data: requesterAssignment } = await supabaseAdmin
        .from('shift_assignments')
        .select('assignment_id')
        .eq('user_id', requesterId)
        .eq('schedules_id', originalScheduleId)
        .single()

      const { data: targetAssignment } = await supabaseAdmin
        .from('shift_assignments')
        .select('assignment_id')
        .eq('user_id', targetUserId)
        .eq('schedules_id', targetScheduleId)
        .single()

      if (requesterAssignment && targetAssignment) {
        // Swap the user_id in shift_assignments
        await supabaseAdmin
          .from('shift_assignments')
          .update({ user_id: targetUserId })
          .eq('assignment_id', requesterAssignment.assignment_id)

        await supabaseAdmin
          .from('shift_assignments')
          .update({ user_id: requesterId })
          .eq('assignment_id', targetAssignment.assignment_id)
      }

      // Get the month of the affected schedules to delete work reports
      const { data: scheduleInfo } = await supabaseAdmin
        .from('schedules')
        .select('date')
        .eq('schedules_id', originalScheduleId)
        .single()

      if (scheduleInfo) {
        // Extract year-month from date (e.g., "2025-10-15" -> "2025-10")
        const reportMonth = scheduleInfo.date.substring(0, 7)

        // Delete work reports for both users for that month
        await supabaseAdmin
          .from('work_reports')
          .delete()
          .eq('user_id', requesterId)
          .eq('report_month', reportMonth)

        await supabaseAdmin
          .from('work_reports')
          .delete()
          .eq('user_id', targetUserId)
          .eq('report_month', reportMonth)
      }
    }

    return NextResponse.json(
      {
        message: response === 'approved'
          ? 'อนุมัติคำขอแลกเวรสำเร็จ ระบบได้ลบรายงานการทำงานของทั้งสองฝ่ายแล้ว กรุณากดบันทึกการทำงานใหม่'
          : 'ปฏิเสธคำขอแลกเวรแล้ว'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error responding to shift exchange request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

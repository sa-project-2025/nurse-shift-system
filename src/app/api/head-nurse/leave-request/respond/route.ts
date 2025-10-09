import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { leaveId, response, approvedBy, reasonReject } = await request.json()

    if (!leaveId || !response || !approvedBy) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    if (response !== 'approved' && response !== 'rejected') {
      return NextResponse.json(
        { error: 'การตอบรับไม่ถูกต้อง' },
        { status: 400 }
      )
    }

    // ดึงข้อมูลคำขอลา
    const { data: leaveRequest, error: fetchError } = await supabaseAdmin
      .from('leave_requests')
      .select('*')
      .eq('leave_id', leaveId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !leaveRequest) {
      return NextResponse.json(
        { error: 'ไม่พบคำขอลางานหรือคำขอถูกตอบรับไปแล้ว' },
        { status: 404 }
      )
    }

    // สร้างเวลาไทย (GMT+7)
    const thailandTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000))

    if (response === 'approved') {
      // กรณีอนุมัติ: อัปเดตสถานะและลบเวร

      // 1. อัปเดตสถานะคำขอ
      const { error: updateError } = await supabaseAdmin
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_by: approvedBy,
          response_date: thailandTime.toISOString()
        })
        .eq('leave_id', leaveId)

      if (updateError) {
        console.error('Error updating leave request:', updateError)
        return NextResponse.json(
          { error: 'ไม่สามารถอัปเดตสถานะคำขอได้' },
          { status: 500 }
        )
      }

      // 2. ดึง schedules_id ของเวรที่ต้องลบ
      const { data: assignments } = await supabaseAdmin
        .from('shift_assignments')
        .select('schedules_id, assignment_id')
        .eq('user_id', leaveRequest.user_id)

      if (assignments && assignments.length > 0) {
        const scheduleIds = assignments.map((a: any) => a.schedules_id)

        // ดึงเวรที่อยู่ในช่วงวันที่ลา
        const { data: schedulesToDelete } = await supabaseAdmin
          .from('schedules')
          .select('schedules_id')
          .in('schedules_id', scheduleIds)
          .gte('date', leaveRequest.start_date)
          .lte('date', leaveRequest.end_date)
          .eq('status', 'published')

        if (schedulesToDelete && schedulesToDelete.length > 0) {
          const scheduleIdsToDelete = schedulesToDelete.map((s: any) => s.schedules_id)

          // 3. ลบ shift_assignments ของเวรที่ลา
          const { error: deleteError } = await supabaseAdmin
            .from('shift_assignments')
            .delete()
            .eq('user_id', leaveRequest.user_id)
            .in('schedules_id', scheduleIdsToDelete)

          if (deleteError) {
            console.error('Error deleting shift assignments:', deleteError)
            return NextResponse.json(
              { error: 'ไม่สามารถลบเวรได้' },
              { status: 500 }
            )
          }
        }
      }

      return NextResponse.json({
        message: 'อนุมัติคำขอลางานเรียบร้อยแล้ว และลบเวรที่เกี่ยวข้องแล้ว'
      })
    } else {
      // กรณีปฏิเสธ: อัปเดตสถานะเท่านั้น

      if (!reasonReject || !reasonReject.trim()) {
        return NextResponse.json(
          { error: 'กรุณากรอกเหตุผลที่ปฏิเสธ' },
          { status: 400 }
        )
      }

      const { error: updateError } = await supabaseAdmin
        .from('leave_requests')
        .update({
          status: 'rejected',
          approved_by: approvedBy,
          response_date: thailandTime.toISOString(),
          reason_reject: reasonReject.trim()
        })
        .eq('leave_id', leaveId)

      if (updateError) {
        console.error('Error updating leave request:', updateError)
        return NextResponse.json(
          { error: 'ไม่สามารถอัปเดตสถานะคำขอได้' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'ปฏิเสธคำขอลางานเรียบร้อยแล้ว'
      })
    }
  } catch (error) {
    console.error('Error in respond API:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    )
  }
}

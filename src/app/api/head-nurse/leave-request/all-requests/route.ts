import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { departmentId } = await request.json()

    if (!departmentId) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลแผนก' },
        { status: 400 }
      )
    }

    // ดึงคำขอลางานทั้งหมดของพยาบาลในแผนก พร้อมข้อมูลเวรที่จะถูกลบ
    const { data: requests, error } = await supabaseAdmin
      .from('leave_requests')
      .select(`
        leave_id,
        user_id,
        start_date,
        end_date,
        leave_days,
        leave_type,
        reason,
        reason_reject,
        status,
        request_date,
        response_date,
        approved_by,
        users!leave_requests_user_id_fkey (
          user_id,
          name,
          email,
          department_id
        )
      `)
      .eq('users.department_id', departmentId)
      .order('request_date', { ascending: false })

    if (error) {
      console.error('Error fetching leave requests:', error)
      return NextResponse.json(
        { error: 'ไม่สามารถดึงข้อมูลคำขอลางานได้' },
        { status: 500 }
      )
    }

    // สำหรับแต่ละคำขอ ดึงเวรที่จะถูกลบ
    const requestsWithSchedules = await Promise.all(
      (requests || []).map(async (request: any) => {
        // ดึง shift_assignments ของผู้ขอ
        const { data: assignments } = await supabaseAdmin
          .from('shift_assignments')
          .select('schedules_id')
          .eq('user_id', request.user_id)

        if (assignments && assignments.length > 0) {
          const scheduleIds = assignments.map((a: any) => a.schedules_id)

          // ดึงเวรที่อยู่ในช่วงวันที่ลา
          const { data: schedules } = await supabaseAdmin
            .from('schedules')
            .select('schedules_id, date, shift_type')
            .in('schedules_id', scheduleIds)
            .gte('date', request.start_date)
            .lte('date', request.end_date)
            .eq('status', 'published')
            .order('date', { ascending: true })

          return {
            leave_id: request.leave_id,
            user_id: request.user_id,
            user_name: request.users.name,
            user_email: request.users.email,
            start_date: request.start_date,
            end_date: request.end_date,
            leave_days: request.leave_days,
            leave_type: request.leave_type,
            reason: request.reason,
            reason_reject: request.reason_reject,
            status: request.status,
            request_date: request.request_date,
            response_date: request.response_date,
            approved_by: request.approved_by,
            affected_schedules: schedules || []
          }
        }

        return {
          leave_id: request.leave_id,
          user_id: request.user_id,
          user_name: request.users.name,
          user_email: request.users.email,
          start_date: request.start_date,
          end_date: request.end_date,
          leave_days: request.leave_days,
          leave_type: request.leave_type,
          reason: request.reason,
          reason_reject: request.reason_reject,
          status: request.status,
          request_date: request.request_date,
          response_date: request.response_date,
          approved_by: request.approved_by,
          affected_schedules: []
        }
      })
    )

    return NextResponse.json({
      requests: requestsWithSchedules
    })
  } catch (error) {
    console.error('Error in all-requests API:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    )
  }
}

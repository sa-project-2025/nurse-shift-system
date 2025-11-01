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

    // ขั้นตอนที่ 1: ดึง user_id ของพยาบาลในแผนกนี้
    const { data: nursesInDept, error: nursesError } = await supabaseAdmin
      .from('users')
      .select('user_id')
      .eq('department_id', departmentId)
      .eq('role', 'nurse')

    if (nursesError) {
      console.error('Error fetching nurses in department:', nursesError)
      return NextResponse.json(
        { error: 'ไม่สามารถดึงข้อมูลพยาบาลในแผนกได้' },
        { status: 500 }
      )
    }

    if (!nursesInDept || nursesInDept.length === 0) {
      return NextResponse.json({ requests: [] })
    }

    const nurseIds = nursesInDept.map((n: { user_id: number }) => n.user_id)

    // ขั้นตอนที่ 2: ดึงคำขอลางานของพยาบาลเหล่านั้น
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
      .in('user_id', nurseIds)
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
      (requests || []).map(async (request: {
        leave_id: number
        user_id: number
        start_date: string
        end_date: string
        leave_days: number
        leave_type: string
        reason: string
        reason_reject: string | null
        status: string
        request_date: string
        response_date: string | null
        approved_by: number | null
        users: { user_id: number; name: string; email: string; department_id: number } | null
      }) => {
        // ดึง shift_assignments ของผู้ขอ
        const { data: assignments } = await supabaseAdmin
          .from('shift_assignments')
          .select('schedules_id')
          .eq('user_id', request.user_id)

        if (assignments && assignments.length > 0) {
          const scheduleIds = assignments.map((a: { schedules_id: string }) => a.schedules_id)

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
            user_name: request.users?.name || 'Unknown',
            user_email: request.users?.email || '',
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
          user_name: request.users?.name || 'Unknown',
          user_email: request.users?.email || '',
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

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'ไม่พบข้อมูลผู้ใช้' },
        { status: 400 }
      )
    }

    // ดึงคำขอลางานทั้งหมดของพยาบาล พร้อมข้อมูลผู้อนุมัติ
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
        approver:users!leave_requests_approved_by_fkey (
          user_id,
          name,
          email
        )
      `)
      .eq('user_id', userId)
      .order('request_date', { ascending: false })

    if (error) {
      console.error('Error fetching leave requests:', error)
      return NextResponse.json(
        { error: 'ไม่สามารถดึงข้อมูลคำขอลางานได้' },
        { status: 500 }
      )
    }

    // Transform data to include approver name
    const transformedRequests = requests?.map((request: any) => ({
      leave_id: request.leave_id,
      user_id: request.user_id,
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
      approver_name: request.approver?.name || null
    })) || []

    return NextResponse.json({
      requests: transformedRequests
    })
  } catch (error) {
    console.error('Error in my-requests API:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    )
  }
}

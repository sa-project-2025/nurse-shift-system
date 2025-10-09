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

    // นับคำขอลางานที่รอการอนุมัติ
    const { data: requests, error } = await supabaseAdmin
      .from('leave_requests')
      .select(`
        leave_id,
        users!leave_requests_user_id_fkey (
          department_id
        )
      `)
      .eq('status', 'pending')
      .eq('users.department_id', departmentId)

    if (error) {
      console.error('Error fetching pending leave count:', error)
      return NextResponse.json(
        { error: 'ไม่สามารถดึงข้อมูลได้' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      count: requests?.length || 0
    })
  } catch (error) {
    console.error('Error in pending-count API:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    )
  }
}

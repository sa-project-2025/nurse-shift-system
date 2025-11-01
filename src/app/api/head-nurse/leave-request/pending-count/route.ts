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
      return NextResponse.json({ count: 0 })
    }

    const nurseIds = nursesInDept.map((n: { user_id: number }) => n.user_id)

    // ขั้นตอนที่ 2: นับคำขอลางานที่รอการอนุมัติของพยาบาลเหล่านั้น
    const { data: requests, error } = await supabaseAdmin
      .from('leave_requests')
      .select('leave_id')
      .eq('status', 'pending')
      .in('user_id', nurseIds)

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

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, startDate, endDate, leaveDays, leaveType, reason } = await request.json()

    if (!userId || !startDate || !endDate || !leaveDays || !leaveType || !reason) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      )
    }

    // Validate leave type (allow custom types for 'other')
    const standardLeaveTypes = ['sick', 'personal', 'vacation', 'other']
    const isStandardType = standardLeaveTypes.includes(leaveType)

    // If not a standard type, it must be a custom type (max 50 chars)
    if (!isStandardType && leaveType.length > 50) {
      return NextResponse.json(
        { error: 'ประเภทการลาต้องไม่เกิน 50 ตัวอักษร' },
        { status: 400 }
      )
    }

    // ตรวจสอบว่ามีคำขอที่ซ้อนทับกันหรือไม่
    // ช่วงเวลาซ้อนทับเมื่อ: start_date <= endDate AND end_date >= startDate
    const { data: existingRequests, error: checkError } = await supabaseAdmin
      .from('leave_requests')
      .select('leave_id, start_date, end_date')
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (checkError) {
      console.error('Error checking existing requests:', checkError)
      return NextResponse.json(
        { error: 'ไม่สามารถตรวจสอบคำขอเดิมได้' },
        { status: 500 }
      )
    }

    // ตรวจสอบว่ามีคำขอซ้อนทับหรือไม่ใน JavaScript
    const hasOverlap = existingRequests?.some((req: any) => {
      const reqStart = new Date(req.start_date)
      const reqEnd = new Date(req.end_date)
      const newStart = new Date(startDate)
      const newEnd = new Date(endDate)

      // ช่วงเวลาซ้อนทับเมื่อ: reqStart <= newEnd AND reqEnd >= newStart
      return reqStart <= newEnd && reqEnd >= newStart
    })

    if (hasOverlap) {
      return NextResponse.json(
        { error: 'คุณมีคำขอลางานที่รอการอนุมัติในช่วงเวลานี้อยู่แล้ว' },
        { status: 400 }
      )
    }

    // สร้างเวลาไทย (GMT+7)
    const thailandTime = new Date(new Date().getTime() + (7 * 60 * 60 * 1000))

    // สร้างคำขอลางาน
    const { error: insertError } = await supabaseAdmin
      .from('leave_requests')
      .insert({
        user_id: userId,
        start_date: startDate,
        end_date: endDate,
        leave_days: leaveDays,
        leave_type: leaveType,
        reason: reason.trim(),
        status: 'pending',
        request_date: thailandTime.toISOString()
      })

    if (insertError) {
      console.error('Error creating leave request:', insertError)
      return NextResponse.json(
        { error: 'ไม่สามารถสร้างคำขอลางานได้' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'ส่งคำขอลางานเรียบร้อยแล้ว'
    })
  } catch (error) {
    console.error('Error in create leave request API:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    )
  }
}

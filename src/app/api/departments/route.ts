import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const { data: departments, error } = await supabaseAdmin
      .from('departments')
      .select('department_id, department_name')
      .order('department_name', { ascending: true })

    if (error) {
      console.error('Error fetching departments:', error)
      return NextResponse.json(
        { error: 'ไม่สามารถดึงข้อมูลแผนกได้' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      departments: departments || []
    })
  } catch (error) {
    console.error('Error in departments API:', error)
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในระบบ' },
      { status: 500 }
    )
  }
}

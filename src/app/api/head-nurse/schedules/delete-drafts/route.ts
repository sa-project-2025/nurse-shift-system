import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    let body
    try {
      const text = await request.text()
      body = text ? JSON.parse(text) : {}
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { departmentId, monthYear, userId } = body

    if (!departmentId || !monthYear || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Parse monthYear (e.g., "2025-02")
    const [year, month] = monthYear.split('-').map(Number)
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = new Date(year, month, 0)
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

    // First, delete all shift assignments for draft schedules in this month
    const { data: draftSchedules, error: fetchError } = await supabaseAdmin
      .from('schedules')
      .select('schedules_id')
      .eq('department_id', departmentId)
      .eq('status', 'draft')
      .gte('date', startDateStr)
      .lte('date', endDateStr)

    if (fetchError) {
      console.error('Error fetching draft schedules:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch draft schedules' }, { status: 500 })
    }

    if (draftSchedules && draftSchedules.length > 0) {
      const scheduleIds = draftSchedules.map(s => s.schedules_id)

      // Delete shift assignments first (foreign key constraint)
      const { error: assignmentDeleteError } = await supabaseAdmin
        .from('shift_assignments')
        .delete()
        .in('schedules_id', scheduleIds)

      if (assignmentDeleteError) {
        console.error('Error deleting shift assignments:', assignmentDeleteError)
        return NextResponse.json({ error: 'Failed to delete shift assignments' }, { status: 500 })
      }

      // Then delete the schedules
      const { error: scheduleDeleteError } = await supabaseAdmin
        .from('schedules')
        .delete()
        .in('schedules_id', scheduleIds)

      if (scheduleDeleteError) {
        console.error('Error deleting schedules:', scheduleDeleteError)
        return NextResponse.json({ error: 'Failed to delete schedules' }, { status: 500 })
      }
    }

    return NextResponse.json({
      message: 'ยกเลิกตารางเวรร่างสำเร็จ',
      deletedSchedules: draftSchedules?.length || 0
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
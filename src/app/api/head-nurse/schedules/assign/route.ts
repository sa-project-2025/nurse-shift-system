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

    const { date, shift_type, nurse_id, department_id, assigned_by, required_nurse } = body

    if (!date || !shift_type || !nurse_id || !department_id || !assigned_by) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    // Check if schedule exists for this date and shift
    let { data: existingSchedule, error: scheduleError } = await supabaseAdmin
      .from('schedules')
      .select('*')
      .eq('date', date)
      .eq('shift_type', shift_type)
      .eq('department_id', department_id)
      .single()

    if (scheduleError && scheduleError.code !== 'PGRST116') {
      console.error('Error checking schedule:', scheduleError)
      return NextResponse.json({ error: 'Failed to check schedule' }, { status: 500 })
    }

    // Create schedule if it doesn't exist
    if (!existingSchedule) {
      const { data: newSchedule, error: createError } = await supabaseAdmin
        .from('schedules')
        .insert({
          date,
          shift_type,
          department_id,
          created_by: assigned_by,
          status: 'draft',
          published_date: null,
          required_nurse: required_nurse || (shift_type === 'night' ? 2 : 3) // Use provided value or default
        })
        .select()
        .single()

      if (createError) {
        console.error('Error creating schedule:', createError)
        return NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 })
      }

      existingSchedule = newSchedule
    }

    // Check if nurse is already assigned to this schedule
    const { data: existingAssignment } = await supabaseAdmin
      .from('shift_assignments')
      .select('*')
      .eq('schedules_id', existingSchedule.schedules_id)
      .eq('user_id', nurse_id)
      .single()

    if (existingAssignment) {
      return NextResponse.json({ error: 'พยาบาลคนนี้ถูกจัดเวรแล้ว' }, { status: 400 })
    }

    // Business Rules Validation
    // 1. Check monthly hours (each shift = 8 hours, max ~176 hours per month)
    const assignDate = new Date(date)
    const monthStart = new Date(assignDate.getFullYear(), assignDate.getMonth(), 1)
    const monthEnd = new Date(assignDate.getFullYear(), assignDate.getMonth() + 1, 0)

    const { data: monthlyShifts } = await supabaseAdmin
      .from('shift_assignments')
      .select(`
        assignment_id,
        schedules!inner(date, shift_type)
      `)
      .eq('user_id', nurse_id)
      .gte('schedules.date', monthStart.toISOString().split('T')[0])
      .lte('schedules.date', monthEnd.toISOString().split('T')[0])

    const monthlyHours = (monthlyShifts?.length || 0) * 8
    if (monthlyHours >= 176) { // 22 shifts * 8 hours = 176 hours
      return NextResponse.json({
        error: 'พยาบาลคนนี้ทำงานครบ 176 ชั่วโมงต่อเดือนแล้ว'
      }, { status: 400 })
    }

    // Count current assignments for this schedule
    const { data: currentAssignments, error: countError } = await supabaseAdmin
      .from('shift_assignments')
      .select('assignment_id')
      .eq('schedules_id', existingSchedule.schedules_id)

    if (countError) {
      console.error('Error counting assignments:', countError)
      return NextResponse.json({ error: 'Failed to check assignments' }, { status: 500 })
    }

    // Check if schedule is full
    if (currentAssignments && currentAssignments.length >= existingSchedule.required_nurse) {
      return NextResponse.json({ error: 'กะนี้มีพยาบาลครบแล้ว' }, { status: 400 })
    }

    // Create the assignment
    const { data: assignment, error: assignError } = await supabaseAdmin
      .from('shift_assignments')
      .insert({
        user_id: nurse_id,
        schedules_id: existingSchedule.schedules_id,
        assigned_by,
        assigned_date: new Date().toISOString()
      })
      .select()
      .single()

    if (assignError) {
      console.error('Error creating assignment:', assignError)
      return NextResponse.json({ error: 'Failed to assign nurse' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'จัดเวรสำเร็จ',
      assignment
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
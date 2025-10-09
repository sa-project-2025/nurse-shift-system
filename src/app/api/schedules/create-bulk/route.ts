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

    const { monthYear, departmentId, createdBy, shiftRequirements } = body

    if (!monthYear || !departmentId || !createdBy || !shiftRequirements) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Parse monthYear (e.g., "2025-02")
    const [year, month] = monthYear.split('-').map(Number)

    // More explicit date calculation to avoid timezone issues
    const daysInMonth = new Date(year, month, 0).getDate()

    // Generate all dates for the month
    const schedules = []
    for (let day = 1; day <= daysInMonth; day++) {
      // Use explicit date string construction to avoid timezone issues
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

      // Create schedules for each shift type
      for (const shiftType of ['morning', 'afternoon', 'night']) {
        const requiredNurse = shiftRequirements[shiftType] || 3

        schedules.push({
          date: dateStr,
          shift_type: shiftType,
          department_id: departmentId,
          created_by: createdBy,
          status: 'draft',
          published_date: null,
          required_nurse: requiredNurse
        })
      }
    }

    // Insert all schedules
    const { data: createdSchedules, error: scheduleError } = await supabaseAdmin
      .from('schedules')
      .insert(schedules)
      .select('schedules_id, date, shift_type, required_nurse')

    if (scheduleError) {
      console.error('Error creating schedules:', scheduleError)
      return NextResponse.json({ error: 'Failed to create schedules' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'สร้างตารางเวรสำเร็จ',
      schedulesCreated: createdSchedules?.length || 0,
      schedules: createdSchedules
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
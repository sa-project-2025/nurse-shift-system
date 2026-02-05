import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { departmentId, monthYear } = await request.json()

    if (!departmentId || !monthYear) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Parse monthYear (e.g., "2025-10")
    const [year, month] = monthYear.split('-').map(Number)

    // Calculate first and last day of the month
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // Step 1: Get all nurses in the department
    const { data: nurses, error: nursesError } = await supabaseAdmin
      .from('users')
      .select('user_id, name, email')
      .eq('department_id', departmentId)
      .eq('role', 'nurse')
      .order('name', { ascending: true })

    if (nursesError) {
      console.error('Error fetching nurses:', nursesError)
      return NextResponse.json({ error: 'Failed to fetch nurses' }, { status: 500 })
    }

    if (!nurses || nurses.length === 0) {
      return NextResponse.json({ nurses: [], daysInMonth: lastDay })
    }

    // Step 2: Get all schedule assignments for these nurses in the month
    const nurseIds = nurses.map((n: { user_id: number }) => n.user_id)

    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('shift_assignments')
      .select(`
        assignment_id,
        user_id,
        schedules!inner(
          schedules_id,
          date,
          shift_type,
          status
        )
      `)
      .in('user_id', nurseIds)
      .gte('schedules.date', firstDay)
      .lte('schedules.date', lastDayStr)
      .eq('schedules.status', 'published')

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
    }

    // Step 3: Build schedule matrix
    // Create a map: nurseId -> { date -> shift_type }
    const scheduleMatrix: Record<number, Record<string, string>> = {}

    nurses.forEach((nurse: { user_id: number }) => {
      scheduleMatrix[nurse.user_id] = {}
    })

    ;(assignments || []).forEach((assignment) => {
      const schedule = assignment.schedules as {
        schedules_id: string
        date: string
        shift_type: string
        status: string
      }

      if (!scheduleMatrix[assignment.user_id]) {
        scheduleMatrix[assignment.user_id] = {}
      }

      scheduleMatrix[assignment.user_id][schedule.date] = schedule.shift_type
    })

    // Step 4: Format response with nurse info and their schedules
    const nursesWithSchedules = nurses.map((nurse: { user_id: number; name: string; email: string }) => ({
      user_id: nurse.user_id,
      name: nurse.name,
      email: nurse.email,
      schedules: scheduleMatrix[nurse.user_id] || {}
    }))

    return NextResponse.json({
      nurses: nursesWithSchedules,
      daysInMonth: lastDay,
      monthYear
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

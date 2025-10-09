import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { departmentId, monthYear, excludeUserId } = body

    if (!departmentId || !monthYear) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Parse monthYear (e.g., "2025-10")
    const [year, month] = monthYear.split('-').map(Number)

    // Calculate first and last day of the month
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // Fetch all published schedules for the department in the month
    const { data: schedules, error: schedulesError } = await supabaseAdmin
      .from('schedules')
      .select('schedules_id, date, shift_type, department_id, status')
      .eq('department_id', departmentId)
      .gte('date', firstDay)
      .lte('date', lastDayStr)
      .eq('status', 'published')
      .order('date', { ascending: true })

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError)
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ schedules: [], monthYear }, { status: 200 })
    }

    const scheduleIds = schedules.map(s => s.schedules_id)

    // Fetch all shift assignments for these schedules
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('shift_assignments')
      .select(`
        assignment_id,
        schedules_id,
        user_id,
        users!shift_assignment_user_id_fkey (
          user_id,
          name,
          email
        )
      `)
      .in('schedules_id', scheduleIds)

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
    }

    // Group assignments by schedule
    const enrichedSchedules = schedules.map(schedule => {
      const scheduleAssignments = (assignments || [])
        .filter(a => a.schedules_id === schedule.schedules_id)
        .map(a => ({
          assignment_id: a.assignment_id,
          user_id: (a.users as any).user_id,
          name: (a.users as any).name,
          email: (a.users as any).email
        }))

      // Filter out the current user if excludeUserId is provided
      const nurses = excludeUserId
        ? scheduleAssignments.filter(n => n.user_id !== excludeUserId)
        : scheduleAssignments

      // Check if the current user is in this schedule
      const userInSchedule = excludeUserId
        ? scheduleAssignments.some(n => n.user_id === excludeUserId)
        : false

      return {
        schedules_id: schedule.schedules_id,
        date: schedule.date,
        shift_type: schedule.shift_type,
        department_id: schedule.department_id,
        status: schedule.status,
        nurses,
        userInSchedule // Add this flag
      }
    })

    // Filter out schedules where the user is assigned (they can't exchange with themselves)
    const filteredSchedules = excludeUserId
      ? enrichedSchedules.filter(s => !s.userInSchedule)
      : enrichedSchedules

    return NextResponse.json({
      schedules: filteredSchedules,
      monthYear
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

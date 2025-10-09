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

    const { departmentId, startDate, endDate } = body

    if (!departmentId || !startDate || !endDate) {
      return NextResponse.json({ error: 'Department ID, start date, and end date are required' }, { status: 400 })
    }

    // Get schedules for the date range (both draft and published for head nurse)
    const { data: schedules, error: schedulesError } = await supabaseAdmin
      .from('schedules')
      .select('*')
      .eq('department_id', departmentId)
      .gte('date', startDate)
      .lte('date', endDate)
      .in('status', ['draft', 'published'])
      .order('date')

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError)
      return NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 })
    }

    // Get shift assignments for these schedules
    const scheduleIds = schedules?.map(s => s.schedules_id) || []

    let assignments = []
    if (scheduleIds.length > 0) {
      const { data: assignmentsData, error: assignmentsError } = await supabaseAdmin
        .from('shift_assignments')
        .select(`
          assignment_id,
          schedules_id,
          users!shift_assignment_user_id_fkey(user_id, name, email)
        `)
        .in('schedules_id', scheduleIds)

      if (assignmentsError) {
        console.error('Error fetching assignments:', assignmentsError)
      } else {
        assignments = assignmentsData || []
        console.log('Successfully fetched assignments:', assignments.length)
        if (assignments.length > 0) {
          console.log('Sample assignment:', assignments[0])
        }
      }
    }

    // Combine schedules with their assigned nurses
    const schedulesWithNurses = schedules?.map(schedule => {
      const assignedNurses = assignments
        .filter(assignment => assignment.schedules_id === schedule.schedules_id)
        .map(assignment => {
          // Handle the foreign key relationship
          const userInfo = assignment.users
          return {
            assignment_id: assignment.assignment_id,
            user_id: userInfo.user_id,
            name: userInfo.name,
            email: userInfo.email
          }
        })

      return {
        ...schedule,
        assigned_nurses: assignedNurses
      }
    }) || []

    return NextResponse.json({ schedules: schedulesWithNurses })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
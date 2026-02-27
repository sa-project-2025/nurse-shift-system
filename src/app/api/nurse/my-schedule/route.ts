import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, monthYear } = body

    if (!userId || !monthYear) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Parse monthYear (e.g., "2025-10")
    const [year, month] = monthYear.split('-').map(Number)

    // Calculate first and last day of the month
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // Fetch nurse's shifts for the month
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('shift_assignments')
      .select(`
        assignment_id,
        schedules!inner(
          schedules_id,
          date,
          shift_type,
          status,
          department_id
        )
      `)
      .eq('user_id', userId)
      .gte('schedules.date', firstDay)
      .lte('schedules.date', lastDayStr)
      .eq('schedules.status', 'published')

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return NextResponse.json({ error: 'Failed to fetch schedule' }, { status: 500 })
    }

    // Fetch colleagues for each shift
    const scheduleIds = (assignments || []).map(a => {
      const schedule = a.schedules as any
      return schedule?.schedules_id
    }).filter(Boolean)

    let colleagues: any[] = []
    if (scheduleIds.length > 0) {
      const { data: colleaguesData, error: colleaguesError } = await supabaseAdmin
        .from('shift_assignments')
        .select(`
          schedules_id,
          user_id,
          users!shift_assignment_user_id_fkey (
            user_id,
            name,
            email,
            pic_profile
          )
        `)
        .in('schedules_id', scheduleIds)
        .neq('user_id', userId)

      if (!colleaguesError && colleaguesData) {
        colleagues = colleaguesData
      }
    }

    // Transform data
    const schedules = (assignments || [])
      .filter(assignment => assignment.schedules)
      .map(assignment => {
        const schedule = assignment.schedules as any
        const scheduleColleagues = colleagues
          .filter(c => c.schedules_id === schedule.schedules_id)
          .map(c => ({
            user_id: c.users.user_id,
            name: c.users.name,
            email: c.users.email,
            pic_profile: c.users.pic_profile ?? null
          }))

        return {
          assignment_id: assignment.assignment_id,
          schedules_id: schedule.schedules_id,
          date: schedule.date,
          shift_type: schedule.shift_type,
          status: schedule.status,
          department_id: schedule.department_id,
          colleagues: scheduleColleagues
        }
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate statistics
    const stats = {
      totalShifts: schedules.length,
      morningShifts: schedules.filter(s => s.shift_type === 'morning').length,
      afternoonShifts: schedules.filter(s => s.shift_type === 'afternoon').length,
      nightShifts: schedules.filter(s => s.shift_type === 'night').length,
      totalHours: schedules.length * 8,
      workDays: new Set(schedules.map(s => s.date)).size,
      restDays: lastDay - new Set(schedules.map(s => s.date)).size
    }

    return NextResponse.json({
      schedules,
      stats,
      monthYear
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

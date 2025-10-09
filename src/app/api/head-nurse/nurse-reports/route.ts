import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, monthYear } = body

    if (!userId || !monthYear) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get head nurse's department
    const { data: department, error: deptError } = await supabaseAdmin
      .from('departments')
      .select('department_id')
      .eq('head_nurse_id', userId)
      .maybeSingle()

    if (deptError || !department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 })
    }

    // Get all nurses in the department
    const { data: nurses, error: nursesError } = await supabaseAdmin
      .from('users')
      .select('user_id, name, email')
      .eq('department_id', department.department_id)
      .eq('role', 'nurse')

    if (nursesError) {
      return NextResponse.json({ error: 'Failed to fetch nurses' }, { status: 500 })
    }

    if (!nurses || nurses.length === 0) {
      return NextResponse.json({ nurses: [] })
    }

    // Parse monthYear
    const [year, month] = monthYear.split('-').map(Number)
    const firstDay = `${year}-${String(month).padStart(2, '0')}-01`
    const lastDay = new Date(year, month, 0).getDate()
    const lastDayStr = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    // Get reports for all nurses
    const nurseReports = await Promise.all(
      nurses.map(async (nurse) => {
        // Try to get work report first
        const { data: workReport } = await supabaseAdmin
          .from('work_reports')
          .select('*')
          .eq('user_id', nurse.user_id)
          .eq('report_month', monthYear)
          .maybeSingle()

        if (workReport) {
          // Use existing work report
          return {
            user_id: nurse.user_id,
            name: nurse.name,
            email: nurse.email,
            work_days_count: workReport.work_days_count,
            shifts_count: workReport.shifts_count,
            total_hours: workReport.total_hours,
            morning_shifts: workReport.morning_shifts,
            afternoon_shifts: workReport.afternoon_shifts,
            night_shifts: workReport.night_shifts,
            rest_days: workReport.rest_days,
            has_submitted: true
          }
        }

        // Calculate from schedules if no work report
        const { data: assignments } = await supabaseAdmin
          .from('shift_assignments')
          .select(`
            assignment_id,
            schedules!inner(
              schedules_id,
              date,
              shift_type,
              status
            )
          `)
          .eq('user_id', nurse.user_id)
          .gte('schedules.date', firstDay)
          .lte('schedules.date', lastDayStr)
          .eq('schedules.status', 'published')

        const schedules = (assignments || [])
          .filter(assignment => assignment.schedules)
          .map(assignment => assignment.schedules as any)

        const stats = {
          totalShifts: schedules.length,
          morningShifts: schedules.filter((s: any) => s.shift_type === 'morning').length,
          afternoonShifts: schedules.filter((s: any) => s.shift_type === 'afternoon').length,
          nightShifts: schedules.filter((s: any) => s.shift_type === 'night').length,
          totalHours: schedules.length * 8,
          workDays: new Set(schedules.map((s: any) => s.date)).size,
          restDays: lastDay - new Set(schedules.map((s: any) => s.date)).size
        }

        return {
          user_id: nurse.user_id,
          name: nurse.name,
          email: nurse.email,
          work_days_count: stats.workDays,
          shifts_count: stats.totalShifts,
          total_hours: stats.totalHours,
          morning_shifts: stats.morningShifts,
          afternoon_shifts: stats.afternoonShifts,
          night_shifts: stats.nightShifts,
          rest_days: stats.restDays,
          has_submitted: false
        }
      })
    )

    return NextResponse.json({
      nurses: nurseReports,
      monthYear
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

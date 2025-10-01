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

    const { assignmentId, userId } = body

    if (!assignmentId || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // First, verify that the assignment exists and belongs to a draft schedule
    const { data: assignmentData, error: fetchError } = await supabaseAdmin
      .from('shift_assignments')
      .select(`
        assignment_id,
        user_id,
        schedules!inner(
          schedules_id,
          status,
          date,
          shift_type
        )
      `)
      .eq('assignment_id', assignmentId)
      .single()

    if (fetchError) {
      console.error('Error fetching assignment:', fetchError)
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    if (!assignmentData) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if the schedule is draft (only draft schedules can be modified)
    if (assignmentData.schedules.status !== 'draft') {
      return NextResponse.json({ error: 'Cannot modify published schedules' }, { status: 400 })
    }

    // Delete the assignment
    const { error: deleteError } = await supabaseAdmin
      .from('shift_assignments')
      .delete()
      .eq('assignment_id', assignmentId)

    if (deleteError) {
      console.error('Error deleting assignment:', deleteError)
      return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 })
    }

    return NextResponse.json({
      message: 'ยกเลิกการจัดเวรสำเร็จ',
      removedAssignment: {
        assignmentId,
        scheduleDate: assignmentData.schedules.date,
        shiftType: assignmentData.schedules.shift_type
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      )
    }

    // Get all shift exchange requests created by this user
    const { data: requests, error } = await supabaseAdmin
      .from('shift_exchange_requests')
      .select(`
        exchange_id,
        requester_id,
        target_user_id,
        original_schedule_id,
        target_schedule_id,
        request_date,
        reason,
        status,
        target_user:users!shift_exchange_requests_target_user_id_fkey(
          name,
          email
        )
      `)
      .eq('requester_id', userId)
      .order('request_date', { ascending: false })

    if (error) {
      console.error('Error fetching my shift exchange requests:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Fetch schedule details for each request
    const enrichedRequests = await Promise.all(
      (requests || []).map(async (req: any) => {
        // Get original schedule
        const { data: originalSchedule } = await supabaseAdmin
          .from('schedules')
          .select('date, shift_type')
          .eq('schedules_id', req.original_schedule_id)
          .single()

        // Get target schedule if exists
        let targetSchedule = null
        if (req.target_schedule_id) {
          const { data } = await supabaseAdmin
            .from('schedules')
            .select('date, shift_type')
            .eq('schedules_id', req.target_schedule_id)
            .single()
          targetSchedule = data
        }

        return {
          exchange_id: req.exchange_id,
          requester_id: req.requester_id,
          target_user_id: req.target_user_id,
          original_schedule_id: req.original_schedule_id,
          target_schedule_id: req.target_schedule_id,
          request_date: req.request_date,
          reason: req.reason,
          status: req.status,
          target_user_name: req.target_user?.name,
          target_user_email: req.target_user?.email,
          original_date: originalSchedule?.date,
          original_shift_type: originalSchedule?.shift_type,
          target_date: targetSchedule?.date,
          target_shift_type: targetSchedule?.shift_type
        }
      })
    )

    return NextResponse.json({ requests: enrichedRequests }, { status: 200 })
  } catch (error) {
    console.error('Error fetching my shift exchange requests:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // First, try to get department where this user is the head nurse
    const { data: headNurseDept, error: headNurseError } = await supabaseAdmin
      .from('departments')
      .select('department_id, department_name')
      .eq('head_nurse_id', userId)
      .maybeSingle()

    // If found as head nurse, return that department
    if (headNurseDept) {
      return NextResponse.json({ department: headNurseDept })
    }

    // If not a head nurse, try to get department from users table
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('department_id')
      .eq('user_id', userId)
      .maybeSingle()

    if (userError) {
      console.error('Error fetching user department:', userError)
      return NextResponse.json({ error: 'Failed to fetch department' }, { status: 500 })
    }

    if (!user?.department_id) {
      return NextResponse.json({ department: null })
    }

    // Get department details
    const { data: department, error: deptError } = await supabaseAdmin
      .from('departments')
      .select('department_id, department_name')
      .eq('department_id', user.department_id)
      .single()

    if (deptError) {
      console.error('Error fetching department details:', deptError)
      return NextResponse.json({ error: 'Failed to fetch department' }, { status: 500 })
    }

    return NextResponse.json({ department: department || null })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
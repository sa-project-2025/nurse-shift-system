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

    // Get department where this user is the head nurse
    const { data: department, error } = await supabaseAdmin
      .from('departments')
      .select('department_id, department_name')
      .eq('head_nurse_id', userId)
      .single()

    if (error) {
      console.error('Error fetching department:', error)
      return NextResponse.json({ error: 'Failed to fetch department' }, { status: 500 })
    }

    return NextResponse.json({ department: department || null })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
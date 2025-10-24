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

    const { departmentId } = body

    if (!departmentId) {
      return NextResponse.json({ error: 'Department ID is required' }, { status: 400 })
    }

    const { data: nurses, error } = await supabaseAdmin
      .from('users')
      .select('user_id, name, email')
      .eq('department_id', departmentId)
      .eq('role', 'nurse')
      .order('name')

    if (error) {
      console.error('Error fetching nurses:', error)
      return NextResponse.json({ error: 'Failed to fetch nurses' }, { status: 500 })
    }

    return NextResponse.json({ nurses: nurses || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
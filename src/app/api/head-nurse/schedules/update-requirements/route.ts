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

    const { departmentId, monthYear, shiftRequirements, userId } = body

    if (!departmentId || !monthYear || !shiftRequirements || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Parse monthYear (e.g., "2025-02")
    const [year, month] = monthYear.split('-').map(Number)
    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0)

    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

    // Update schedules for the month with new requirements
    const updatePromises = Object.entries(shiftRequirements).map(async ([shiftType, requiredNurse]) => {
      const { error } = await supabaseAdmin
        .from('schedules')
        .update({ required_nurse: requiredNurse as number })
        .eq('department_id', departmentId)
        .eq('shift_type', shiftType)
        .gte('date', startDateStr)
        .lte('date', endDateStr)
        .eq('status', 'draft') // Only update draft schedules

      if (error) {
        console.error(`Error updating ${shiftType} requirements:`, error)
        throw error
      }
    })

    await Promise.all(updatePromises)

    return NextResponse.json({
      message: 'อัปเดตจำนวนพยาบาลสำเร็จ',
      updated: true
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
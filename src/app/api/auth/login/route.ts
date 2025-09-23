import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // First check if user exists in users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้ในระบบ' }, { status: 404 })
    }

    // Check if password matches (simple comparison since we store plaintext)
    if (userData.password !== password) {
      return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 400 })
    }

    // Generate a session for the user (create a simple token)
    const sessionToken = Buffer.from(`${email}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      user: {
        id: userData.user_id,
        email: userData.email,
        name: userData.name,
        session_token: sessionToken
      },
      profile: userData
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, phone, departmentId } = await request.json()

    // Create user in Supabase Auth (disable email confirmation)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (authData.user) {
      // Insert user profile using admin client to bypass RLS
      const { data: userData, error: profileError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            name,
            email,
            password,
            role,
            phone: phone || null,
            department_id: departmentId ? parseInt(departmentId) : null,
          }
        ])
        .select()
        .single()

      if (profileError) {
        console.error('Profile creation error:', profileError)

        // If profile creation fails, delete the auth user
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)

        return NextResponse.json(
          { error: `เกิดข้อผิดพลาดในการสร้างโปรไฟล์: ${profileError.message}` },
          { status: 500 }
        )
      }

      // If role is head_nurse and departmentId is provided, update the department
      if (role === 'head_nurse' && departmentId && userData) {
        const { error: deptError } = await supabaseAdmin
          .from('departments')
          .update({ head_nurse_id: userData.user_id })
          .eq('department_id', parseInt(departmentId))

        if (deptError) {
          console.error('Department update error:', deptError)
          // Don't fail the registration, just log the error
        }
      }

      return NextResponse.json({
        message: 'ลงทะเบียนผู้ใช้สำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี',
        user: authData.user
      })
    }

    return NextResponse.json({ error: 'ไม่สามารถสร้างผู้ใช้ได้' }, { status: 500 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลงทะเบียนผู้ใช้' }, { status: 500 })
  }
}
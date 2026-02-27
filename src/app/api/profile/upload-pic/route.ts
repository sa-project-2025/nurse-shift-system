import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userId = formData.get('userId') as string

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and userId are required' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WEBP images are allowed' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/profile.${fileExt}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('profile-pictures')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true, // overwrite if exists
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image', detail: uploadError.message }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('profile-pictures')
      .getPublicUrl(fileName)

    // Add cache-bust to prevent browser caching old image
    const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`

    // Update pic_profile in users table
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ pic_profile: urlWithCacheBust })
      .eq('user_id', parseInt(userId))

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update profile picture' }, { status: 500 })
    }

    return NextResponse.json({ url: urlWithCacheBust })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

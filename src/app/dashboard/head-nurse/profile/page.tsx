'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function HeadNurseProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<{user_id?: number, name?: string, email?: string, phone?: string, pic_profile?: string | null}>({})
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProfile = localStorage.getItem('profile')
      if (!storedProfile) {
        router.push('/login')
        return
      }
      const parsed = JSON.parse(storedProfile)
      setProfile(parsed)
      setPreviewUrl(parsed.pic_profile || null)
    }
  }, [router])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)

    // Preview
    const reader = new FileReader()
    reader.onloadend = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || !profile.user_id) return

    setUploading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('userId', String(profile.user_id))

    try {
      const res = await fetch('/api/profile/upload-pic', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setMessage({ type: 'error', text: `${data.error || 'เกิดข้อผิดพลาด'}${data.detail ? `: ${data.detail}` : ''}` })
        return
      }

      // Update localStorage
      const updatedProfile = { ...profile, pic_profile: data.url }
      localStorage.setItem('profile', JSON.stringify(updatedProfile))
      setProfile(updatedProfile)
      setPreviewUrl(data.url)
      setSelectedFile(null)
      setMessage({ type: 'success', text: 'อัพโหลดรูปโปรไฟล์สำเร็จ' })

      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด กรุณาลองใหม่' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-bold text-gray-900">โปรไฟล์ของฉัน</h1>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white rounded-xl shadow p-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="profile"
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-100"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-blue-200 flex items-center justify-center border-4 border-blue-100">
                  <span className="text-blue-700 font-bold text-4xl">{profile.name?.charAt(0) || '?'}</span>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md transition-colors"
                title="เปลี่ยนรูปโปรไฟล์"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={handleFileSelect}
            />

            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium transition-colors"
              >
                {uploading ? 'กำลังอัพโหลด...' : 'บันทึกรูปโปรไฟล์'}
              </button>
            )}

            {message && (
              <p className={`text-sm font-medium ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {message.text}
              </p>
            )}

            <p className="text-xs text-gray-400">รองรับ JPEG, PNG, WEBP ขนาดไม่เกิน 5MB</p>
          </div>

          {/* Profile Info */}
          <div className="border-t pt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">ชื่อ</label>
              <p className="mt-1 text-gray-900 font-medium">{profile.name || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">อีเมล</label>
              <p className="mt-1 text-gray-900">{profile.email || '-'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">เบอร์โทรศัพท์</label>
              <p className="mt-1 text-gray-900">{profile.phone || '-'}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

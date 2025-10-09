'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function NurseDashboard() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user')
    const profile = localStorage.getItem('profile')

    if (!user || !profile) {
      router.push('/login')
    }
  }, [router])

  const profile = JSON.parse(localStorage.getItem('profile') || '{}')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard พยาบาล</h1>
              <p className="text-sm text-gray-600">
                ยินดีต้อนรับ {profile.name || 'พยาบาล'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              🎉 เข้าสู่ระบบสำเร็จ!
            </h2>
            <p className="text-gray-500">
              กดแถบ เมนูด้านซ้ายเพื่อเริ่มต้นใช้งานระบบจัดการเวรพยาบาล
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
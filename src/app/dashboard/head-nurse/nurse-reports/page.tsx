'use client'

import { useState, useEffect } from 'react'

interface NurseReport {
  user_id: number
  name: string
  email: string
  work_days_count: number
  shifts_count: number
  total_hours: number
  morning_shifts: number
  afternoon_shifts: number
  night_shifts: number
  rest_days: number
  has_submitted: boolean
}

export default function NurseReportsPage() {
  const [userId, setUserId] = useState<number | null>(null)
  const [nurses, setNurses] = useState<NurseReport[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProfile = localStorage.getItem('profile')
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile)
        if (parsedProfile.user_id) {
          setUserId(parsedProfile.user_id)
        }
      }
    }

    // Set default period to current month
    const now = new Date()
    const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    setSelectedPeriod(currentPeriod)
  }, [])

  useEffect(() => {
    if (userId && selectedPeriod) {
      fetchNurseReports()
    }
  }, [userId, selectedPeriod])

  const fetchNurseReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/head-nurse/nurse-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, monthYear: selectedPeriod })
      })

      if (!response.ok) throw new Error('Failed to fetch nurse reports')

      const data = await response.json()
      setNurses(data.nurses || [])
    } catch (error) {
      console.error('Error fetching nurse reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMonthOptions = () => {
    const options = []
    const now = new Date()

    // Generate last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const value = `${year}-${String(month).padStart(2, '0')}`

      const monthNames = [
        'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
        'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
      ]
      const monthName = monthNames[month - 1]

      options.push({
        value,
        label: `${monthName} ${year + 543}`
      })
    }

    return options
  }

  if (loading && nurses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-700">กำลังโหลด...</div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">รายงานการทำงานของพยาบาล</h1>
        <p className="text-gray-600">ดูรายงานการทำงานของพยาบาลในแผนกเพื่อวิเคราะห์และจัดเวร</p>
      </div>

      {/* Period Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">เลือกเดือน/ปี</label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="w-64 px-4 py-2 border text-black border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {generateMonthOptions().map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      {nurses.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-600 mb-1">พยาบาลทั้งหมด</div>
            <div className="text-2xl font-bold text-blue-700">{nurses.length}</div>
            <div className="text-xs text-blue-500">คน</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 mb-1">ส่งรายงานแล้ว</div>
            <div className="text-2xl font-bold text-green-700">
              {nurses.filter(n => n.has_submitted).length}
            </div>
            <div className="text-xs text-green-500">คน</div>
          </div>
        </div>
      )}

      {/* Nurse Cards Grid */}
      {nurses.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-lg text-yellow-800">ไม่พบข้อมูลพยาบาลในแผนก</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nurses.map((nurse) => (
            <div
              key={nurse.user_id}
              className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold">{nurse.name}</h3>
                    <p className="text-sm text-blue-100">{nurse.email}</p>
                  </div>
                  {nurse.has_submitted ? (
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                      ✓ ส่งแล้ว
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                      รอส่ง
                    </span>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-4">
                {/* Main Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{nurse.work_days_count}</div>
                    <div className="text-xs text-gray-500">วันทำงาน</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{nurse.shifts_count}</div>
                    <div className="text-xs text-gray-500">กะ</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{nurse.total_hours}</div>
                    <div className="text-xs text-gray-500">ชั่วโมง</div>
                  </div>
                </div>

                {/* Shift Breakdown */}
                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">🌅 กะเช้า</span>
                    <span className="text-sm font-medium text-gray-800">{nurse.morning_shifts} กะ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">☀️ กะบ่าย</span>
                    <span className="text-sm font-medium text-gray-800">{nurse.afternoon_shifts} กะ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">🌙 กะดึก</span>
                    <span className="text-sm font-medium text-gray-800">{nurse.night_shifts} กะ</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="text-sm text-gray-600">🏖️ วันหยุด</span>
                    <span className="text-sm font-medium text-teal-600">{nurse.rest_days} วัน</span>
                  </div>
                </div>

                {/* Workload Indicator */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>ภาระงาน</span>
                    <span>{nurse.total_hours}/176 ชม.</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        nurse.total_hours >= 176
                          ? 'bg-red-500'
                          : nurse.total_hours >= 160
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((nurse.total_hours / 176) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

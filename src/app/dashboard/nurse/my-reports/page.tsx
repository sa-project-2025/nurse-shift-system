'use client'

import { useState, useEffect } from 'react'

interface WorkReport {
  report_id: number
  user_id: number
  report_month: string
  work_days_count: number
  shifts_count: number
  total_hours: number
  morning_shifts: number
  afternoon_shifts: number
  night_shifts: number
  rest_days: number
  submitted_at: string
}

interface Schedule {
  assignment_id: number
  schedules_id: string
  date: string
  shift_type: 'morning' | 'afternoon' | 'night'
  status: string
  department_id: number
  colleagues: { user_id: number; name: string; email: string }[]
}

const SHIFT_TYPES = {
  morning: { label: 'เช้า', icon: '☀️', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', time: '06:00-14:00' },
  afternoon: { label: 'บ่าย', icon: '🌤️', color: 'bg-orange-100 text-orange-800 border-orange-300', time: '14:00-22:00' },
  night: { label: 'ดึก', icon: '🌙', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', time: '22:00-06:00' },
}

export default function MyReportsPage() {
  const [userId, setUserId] = useState<number | null>(null)
  const [reports, setReports] = useState<WorkReport[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [selectedReport, setSelectedReport] = useState<WorkReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'calendar' | 'charts'>('calendar')

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
  }, [])

  useEffect(() => {
    if (userId) {
      fetchReports()
    }
  }, [userId])

  useEffect(() => {
    if (userId && selectedPeriod) {
      fetchScheduleData()
    }
  }, [userId, selectedPeriod])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/nurse/work-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) throw new Error('Failed to fetch reports')

      const data = await response.json()
      setReports(data.reports || [])

      if (data.reports && data.reports.length > 0) {
        setSelectedPeriod(data.reports[0].report_month)
        setSelectedReport(data.reports[0])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchScheduleData = async () => {
    try {
      const response = await fetch('/api/nurse/my-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, monthYear: selectedPeriod })
      })

      if (!response.ok) throw new Error('Failed to fetch schedule')

      const data = await response.json()
      setSchedules(data.schedules || [])
    } catch (error) {
      console.error('Error fetching schedule:', error)
    }
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    const report = reports.find(r => r.report_month === period)
    setSelectedReport(report || null)
  }

  const handleExportPDF = () => {
    if (!selectedReport) return
    window.print()
  }

  const renderCalendar = () => {
    if (!selectedPeriod) return null

    const [year, month] = selectedPeriod.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay() // 0 = Sunday

    // Create schedule lookup map
    const scheduleMap: Record<string, Schedule[]> = {}
    schedules.forEach(schedule => {
      if (!scheduleMap[schedule.date]) {
        scheduleMap[schedule.date] = []
      }
      scheduleMap[schedule.date].push(schedule)
    })

    // Build calendar days
    const calendarDays = []

    // Empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="min-h-24 bg-gray-50"></div>)
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const daySchedules = scheduleMap[dateStr] || []
      const isToday = new Date().toDateString() === new Date(dateStr).toDateString()

      calendarDays.push(
        <div
          key={day}
          className={`min-h-24 border border-gray-200 p-2 ${isToday ? 'bg-blue-50 border-blue-400' : 'bg-white'}`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
            {isToday && <span className="ml-1 text-xs text-blue-600">วันนี้</span>}
          </div>
          <div className="space-y-1">
            {daySchedules.map((schedule) => (
              <div
                key={schedule.assignment_id}
                className={`text-xs p-1 rounded border ${SHIFT_TYPES[schedule.shift_type].color}`}
                title={`กะ${SHIFT_TYPES[schedule.shift_type].label} (${SHIFT_TYPES[schedule.shift_type].time})`}
              >
                {SHIFT_TYPES[schedule.shift_type].icon} {SHIFT_TYPES[schedule.shift_type].label}
              </div>
            ))}
          </div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-lg border border-gray-300 overflow-hidden">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 bg-gray-100 border-b border-gray-300">
          {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map(day => (
            <div key={day} className="p-3 text-center font-semibold text-gray-700 border-r border-gray-300 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar Body */}
        <div className="grid grid-cols-7">
          {calendarDays}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-700">กำลังโหลด...</div>
      </div>
    )
  }

  if (reports.length === 0) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">รายงานเวรของฉัน</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-lg text-yellow-800">ยังไม่มีรายงานเวร</p>
          <p className="text-sm text-yellow-600 mt-2">
            กรุณาบันทึกรายงานเวรจากหน้า &quot;ตารางเวรของฉัน&quot; ก่อน
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">รายงานเวรของฉัน</h1>
        <button
          onClick={handleExportPDF}
          disabled={!selectedReport}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed print:hidden"
        >
          📥 Export PDF
        </button>
      </div>

      {/* Period Selector */}
      <div className="mb-6 print:hidden">
        <label className="block text-sm font-medium text-gray-700 mb-2">เลือกเดือน/ปี</label>
        <select
          value={selectedPeriod}
          onChange={(e) => handlePeriodChange(e.target.value)}
          className="w-64 px-4 py-2 border text-black border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {reports.map(report => {
            const [year, month] = report.report_month.split('-')
            const monthNames = [
              'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
              'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
            ]
            const monthName = monthNames[parseInt(month) - 1]
            return (
              <option key={report.report_id} value={report.report_month}>
                {monthName} {parseInt(year) + 543}
              </option>
            )
          })}
        </select>
      </div>

      {selectedReport && (
        <>
          {/* Summary Dashboard */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">สรุปภาพรวม</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="text-sm text-blue-600 mb-1">จำนวนวันทำงาน</div>
                <div className="text-3xl font-bold text-blue-700">{selectedReport.work_days_count}</div>
                <div className="text-xs text-blue-500 mt-1">วัน</div>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <div className="text-sm text-purple-600 mb-1">จำนวนกะทั้งหมด</div>
                <div className="text-3xl font-bold text-purple-700">{selectedReport.shifts_count}</div>
                <div className="text-xs text-purple-500 mt-1">กะ</div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="text-sm text-green-600 mb-1">ชั่วโมงทั้งหมด</div>
                <div className="text-3xl font-bold text-green-700">{selectedReport.total_hours}</div>
                <div className="text-xs text-green-500 mt-1">ชั่วโมง</div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">รายละเอียดกะ</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-sm text-yellow-600 mb-1">🌅 กะเช้า</div>
                <div className="text-2xl font-bold text-yellow-700">{selectedReport.morning_shifts}</div>
                <div className="text-xs text-yellow-500 mt-1">{selectedReport.morning_shifts * 8} ชม.</div>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="text-sm text-orange-600 mb-1">☀️ กะบ่าย</div>
                <div className="text-2xl font-bold text-orange-700">{selectedReport.afternoon_shifts}</div>
                <div className="text-xs text-orange-500 mt-1">{selectedReport.afternoon_shifts * 8} ชม.</div>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <div className="text-sm text-indigo-600 mb-1">🌙 กะดึก</div>
                <div className="text-2xl font-bold text-indigo-700">{selectedReport.night_shifts}</div>
                <div className="text-xs text-indigo-500 mt-1">{selectedReport.night_shifts * 8} ชม.</div>
              </div>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="text-sm text-teal-600 mb-1">🏖️ วันหยุด</div>
                <div className="text-2xl font-bold text-teal-700">{selectedReport.rest_days}</div>
                <div className="text-xs text-teal-500 mt-1">วัน</div>
              </div>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="mb-6 flex items-center space-x-4 print:hidden">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📅 ปฏิทิน
            </button>
            <button
              onClick={() => setViewMode('charts')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                viewMode === 'charts'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📊 กราฟ
            </button>
          </div>

          {/* Calendar View */}
          {viewMode === 'calendar' && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">ตารางเวรรายวัน</h2>
              {renderCalendar()}

              {/* Legend */}
              <div className="mt-4 flex items-center space-x-4 text-sm">
                <span className="font-medium text-gray-700">คำอธิบาย:</span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded border text-xs ${SHIFT_TYPES.morning.color}`}>
                    {SHIFT_TYPES.morning.icon} กะเช้า
                  </span>
                  <span className="text-gray-500">06:00-14:00</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded border text-xs ${SHIFT_TYPES.afternoon.color}`}>
                    {SHIFT_TYPES.afternoon.icon} กะบ่าย
                  </span>
                  <span className="text-gray-500">14:00-22:00</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded border text-xs ${SHIFT_TYPES.night.color}`}>
                    {SHIFT_TYPES.night.icon} กะดึก
                  </span>
                  <span className="text-gray-500">22:00-06:00</span>
                </div>
              </div>
            </div>
          )}

          {/* Charts View */}
          {viewMode === 'charts' && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">กราฟแสดงข้อมูล</h2>

              {/* Bar Chart - Shifts by Type */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">จำนวนกะแต่ละประเภท</h3>
                <div className="flex items-end justify-around h-64 border-b border-l border-gray-300">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-20 bg-yellow-500 rounded-t"
                      style={{ height: `${(selectedReport.morning_shifts / selectedReport.shifts_count) * 200}px` }}
                    ></div>
                    <div className="mt-2 text-sm font-medium text-gray-700">กะเช้า</div>
                    <div className="text-xs text-gray-500">{selectedReport.morning_shifts}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className="w-20 bg-orange-500 rounded-t"
                      style={{ height: `${(selectedReport.afternoon_shifts / selectedReport.shifts_count) * 200}px` }}
                    ></div>
                    <div className="mt-2 text-sm font-medium text-gray-700">กะบ่าย</div>
                    <div className="text-xs text-gray-500">{selectedReport.afternoon_shifts}</div>
                  </div>
                  <div className="flex flex-col items-center">
                    <div
                      className="w-20 bg-indigo-500 rounded-t"
                      style={{ height: `${(selectedReport.night_shifts / selectedReport.shifts_count) * 200}px` }}
                    ></div>
                    <div className="mt-2 text-sm font-medium text-gray-700">กะดึก</div>
                    <div className="text-xs text-gray-500">{selectedReport.night_shifts}</div>
                  </div>
                </div>
              </div>

              {/* Pie Chart - Shift Distribution */}
              <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium text-gray-700 mb-4">สัดส่วนกะงาน</h3>
                <div className="flex items-center justify-center">
                  <svg width="300" height="300" viewBox="0 0 300 300">
                    {(() => {
                      const total = selectedReport.shifts_count
                      const morningPercent = (selectedReport.morning_shifts / total) * 100
                      const afternoonPercent = (selectedReport.afternoon_shifts / total) * 100
                      const nightPercent = (selectedReport.night_shifts / total) * 100

                      let currentAngle = 0
                      const radius = 100
                      const cx = 150
                      const cy = 150

                      const createSlice = (percent: number, startAngle: number) => {
                        const angle = (percent / 100) * 360
                        const endAngle = startAngle + angle
                        const startRad = (startAngle - 90) * Math.PI / 180
                        const endRad = (endAngle - 90) * Math.PI / 180

                        const x1 = cx + radius * Math.cos(startRad)
                        const y1 = cy + radius * Math.sin(startRad)
                        const x2 = cx + radius * Math.cos(endRad)
                        const y2 = cy + radius * Math.sin(endRad)

                        const largeArc = angle > 180 ? 1 : 0

                        return `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`
                      }

                      const slices = []

                      if (morningPercent > 0) {
                        slices.push(
                          <path
                            key="morning"
                            d={createSlice(morningPercent, currentAngle)}
                            fill="#EAB308"
                            stroke="white"
                            strokeWidth="2"
                          />
                        )
                        currentAngle += (morningPercent / 100) * 360
                      }

                      if (afternoonPercent > 0) {
                        slices.push(
                          <path
                            key="afternoon"
                            d={createSlice(afternoonPercent, currentAngle)}
                            fill="#F97316"
                            stroke="white"
                            strokeWidth="2"
                          />
                        )
                        currentAngle += (afternoonPercent / 100) * 360
                      }

                      if (nightPercent > 0) {
                        slices.push(
                          <path
                            key="night"
                            d={createSlice(nightPercent, currentAngle)}
                            fill="#6366F1"
                            stroke="white"
                            strokeWidth="2"
                          />
                        )
                      }

                      return slices
                    })()}
                  </svg>
                  <div className="ml-8 space-y-2">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                      <span className="text-sm text-gray-700">กะเช้า: {selectedReport.morning_shifts} ({((selectedReport.morning_shifts / selectedReport.shifts_count) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
                      <span className="text-sm text-gray-700">กะบ่าย: {selectedReport.afternoon_shifts} ({((selectedReport.afternoon_shifts / selectedReport.shifts_count) * 100).toFixed(1)}%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-indigo-500 rounded mr-2"></div>
                      <span className="text-sm text-gray-700">กะดึก: {selectedReport.night_shifts} ({((selectedReport.night_shifts / selectedReport.shifts_count) * 100).toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submission Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-600">
            <p>บันทึกเมื่อ: {new Date(selectedReport.submitted_at).toLocaleString('th-TH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          .max-w-7xl,
          .max-w-7xl * {
            visibility: visible;
          }
          .max-w-7xl {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import {
  SunriseIcon, SunIcon, MoonIcon, BeachIcon,
  ClipboardIcon, ChartBarIcon, CalendarIcon,
  WarningIcon, LightningIcon, CheckIcon, ClockIcon, DownloadIcon,
} from '@/components/icons'

interface NurseReport {
  user_id: number
  name: string
  email: string
  pic_profile?: string | null
  work_days_count: number
  shifts_count: number
  total_hours: number
  morning_shifts: number
  afternoon_shifts: number
  night_shifts: number
  rest_days: number
  has_submitted: boolean
}

interface Schedule {
  assignment_id: number
  schedules_id: string
  date: string
  shift_type: 'morning' | 'afternoon' | 'night'
  status: string
  department_id: number
}

interface NurseWithSchedules {
  user_id: number
  name: string
  email: string
  pic_profile?: string | null
  schedules: Record<string, string> // date -> shift_type
}

const SHIFT_TYPES = {
  morning: { label: 'เช้า', icon: SunriseIcon, color: 'bg-yellow-100 text-yellow-800 border-yellow-300', time: '06:00-14:00' },
  afternoon: { label: 'บ่าย', icon: SunIcon, color: 'bg-orange-100 text-orange-800 border-orange-300', time: '14:00-22:00' },
  night: { label: 'ดึก', icon: MoonIcon, color: 'bg-indigo-100 text-indigo-800 border-indigo-300', time: '22:00-06:00' },
}

export default function NurseReportsPage() {
  const [userId, setUserId] = useState<number | null>(null)
  const [departmentId, setDepartmentId] = useState<number | null>(null)
  const [nurses, setNurses] = useState<NurseReport[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'matrix'>('cards')

  // Matrix view state
  const [matrixNurses, setMatrixNurses] = useState<NurseWithSchedules[]>([])
  const [daysInMonth, setDaysInMonth] = useState<number>(31)
  const [loadingMatrix, setLoadingMatrix] = useState(false)

  // Modal state
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedNurse, setSelectedNurse] = useState<NurseReport | null>(null)
  const [nurseSchedules, setNurseSchedules] = useState<Schedule[]>([])
  const [loadingSchedule, setLoadingSchedule] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProfile = localStorage.getItem('profile')
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile)
        if (parsedProfile.user_id) {
          setUserId(parsedProfile.user_id)
        }
        if (parsedProfile.department_id) {
          setDepartmentId(parsedProfile.department_id)
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

  useEffect(() => {
    if (departmentId && selectedPeriod && viewMode === 'matrix') {
      fetchScheduleMatrix()
    }
  }, [departmentId, selectedPeriod, viewMode])

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

  const fetchNurseScheduleDetail = async (nurseId: number) => {
    try {
      setLoadingSchedule(true)
      const response = await fetch('/api/head-nurse/nurse-schedule-detail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nurseId, monthYear: selectedPeriod })
      })

      if (!response.ok) throw new Error('Failed to fetch schedule detail')

      const data = await response.json()
      setNurseSchedules(data.schedules || [])
    } catch (error) {
      console.error('Error fetching schedule detail:', error)
    } finally {
      setLoadingSchedule(false)
    }
  }

  const fetchScheduleMatrix = async () => {
    try {
      setLoadingMatrix(true)
      const response = await fetch('/api/head-nurse/schedule-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId, monthYear: selectedPeriod })
      })

      if (!response.ok) throw new Error('Failed to fetch schedule matrix')

      const data = await response.json()
      setMatrixNurses(data.nurses || [])
      setDaysInMonth(data.daysInMonth || 31)
    } catch (error) {
      console.error('Error fetching schedule matrix:', error)
    } finally {
      setLoadingMatrix(false)
    }
  }

  const handleViewDetail = async (nurse: NurseReport) => {
    setSelectedNurse(nurse)
    setShowDetailModal(true)
    await fetchNurseScheduleDetail(nurse.user_id)
  }

  const handleCloseModal = () => {
    setShowDetailModal(false)
    setSelectedNurse(null)
    setNurseSchedules([])
  }

  const renderCalendar = () => {
    if (!selectedPeriod || !selectedNurse) return null

    const [year, month] = selectedPeriod.split('-').map(Number)
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)
    const daysInMonth = lastDay.getDate()
    const startDayOfWeek = firstDay.getDay() // 0 = Sunday

    // Create schedule lookup map
    const scheduleMap: Record<string, Schedule[]> = {}
    nurseSchedules.forEach(schedule => {
      if (!scheduleMap[schedule.date]) {
        scheduleMap[schedule.date] = []
      }
      scheduleMap[schedule.date].push(schedule)
    })

    // Build calendar days
    const calendarDays = []

    // Empty cells before first day
    for (let i = 0; i < startDayOfWeek; i++) {
      calendarDays.push(<div key={`empty-${i}`} className="min-h-20 bg-gray-50"></div>)
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const daySchedules = scheduleMap[dateStr] || []
      const isToday = new Date().toDateString() === new Date(dateStr).toDateString()

      calendarDays.push(
        <div
          key={day}
          className={`min-h-20 border border-gray-200 p-2 ${isToday ? 'bg-blue-50 border-blue-400' : daySchedules.length > 0 ? 'bg-white' : 'bg-gray-50'}`}
        >
          <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {daySchedules.map((schedule) => (
              <div
                key={schedule.assignment_id}
                className={`flex items-center gap-1 text-xs p-1 rounded border ${SHIFT_TYPES[schedule.shift_type].color}`}
                title={`กะ${SHIFT_TYPES[schedule.shift_type].label} (${SHIFT_TYPES[schedule.shift_type].time})`}
              >
                {(() => { const I = SHIFT_TYPES[schedule.shift_type].icon; return <I className="w-3 h-3 flex-shrink-0" /> })()} {SHIFT_TYPES[schedule.shift_type].label}
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
            <div key={day} className="p-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-300 last:border-r-0">
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

  const handleExportPDF = () => {
    window.print()
  }

  const handleExportMatrix = () => {
    // Use window.print() for matrix view as well
    window.print()
  }

  const renderMatrixView = () => {
    if (loadingMatrix) {
      return (
        <div className="bg-white border border-gray-300 rounded-lg p-8 text-center">
          <p className="text-gray-500">กำลังโหลดตาราง...</p>
        </div>
      )
    }

    if (matrixNurses.length === 0) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-lg text-yellow-800">ไม่พบข้อมูลพยาบาลในแผนก</p>
        </div>
      )
    }

    const [year, month] = selectedPeriod.split('-').map(Number)

    // Generate array of days [1, 2, 3, ..., daysInMonth]
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

    const getShiftDisplay = (shiftType: string) => {
      const shiftMap: Record<string, { label: string; color: string }> = {
        morning: { label: 'เช้า', color: 'bg-yellow-200 text-yellow-900' },
        afternoon: { label: 'บ่าย', color: 'bg-orange-200 text-orange-900' },
        night: { label: 'ดึก', color: 'bg-indigo-200 text-indigo-900' }
      }
      return shiftMap[shiftType] || { label: '-', color: 'bg-gray-50 text-gray-400' }
    }

    return (
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        {/* Matrix Header - shown in print */}
        <div className="hidden print:block bg-gray-100 p-4 border-b border-gray-300">
          <h2 className="text-lg font-bold text-gray-900">
            ตารางเวรรายวัน - {generateMonthOptions().find(o => o.value === selectedPeriod)?.label}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-300 text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-100 z-10 border-r border-gray-300 min-w-[150px]">
                พยาบาล
              </th>
              {days.map(day => (
                <th
                  key={day}
                  className="px-2 py-2 text-center text-xs font-semibold text-gray-700 border-r border-gray-200 last:border-r-0 min-w-[60px]"
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {matrixNurses.map((nurse) => (
              <tr key={nurse.user_id} className="hover:bg-gray-50">
                <td className="px-3 py-2 sticky left-0 bg-white border-r border-gray-300 z-10">
                  <div className="flex items-center gap-2">
                    {nurse.pic_profile ? (
                      <img src={nurse.pic_profile} alt={nurse.name} className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-semibold text-xs">{nurse.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{nurse.name}</div>
                      <div className="text-xs text-gray-500 truncate max-w-[110px]">{nurse.email}</div>
                    </div>
                  </div>
                </td>
                {days.map(day => {
                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const shiftType = nurse.schedules[dateStr]
                  const shift = getShiftDisplay(shiftType)

                  return (
                    <td
                      key={day}
                      className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-200 last:border-r-0 ${shift.color}`}
                    >
                      {shift.label}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-300 flex flex-wrap items-center gap-4 text-xs">
          <span className="font-semibold text-gray-700">คำอธิบาย:</span>
          <div className="flex items-center space-x-1">
            <span className="px-2 py-1 rounded bg-yellow-200 text-yellow-900 font-medium">เช้า</span>
            <span className="text-gray-600">(06:00-14:00)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="px-2 py-1 rounded bg-orange-200 text-orange-900 font-medium">บ่าย</span>
            <span className="text-gray-600">(14:00-22:00)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="px-2 py-1 rounded bg-indigo-200 text-indigo-900 font-medium">ดึก</span>
            <span className="text-gray-600">(22:00-06:00)</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="px-2 py-1 rounded bg-gray-50 text-gray-400 font-medium">-</span>
            <span className="text-gray-600">(วันหยุด)</span>
          </div>
        </div>
      </div>
    )
  }

  const renderTableView = () => {
    return (
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                พยาบาล
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                วันทำงาน
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                กะทั้งหมด
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                เช้า
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                บ่าย
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                ดึก
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                ชั่วโมง
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                วันหยุด
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                สถานะ
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider print:hidden">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {nurses.map((nurse) => (
              <tr key={nurse.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {nurse.pic_profile ? (
                      <img src={nurse.pic_profile} alt={nurse.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-semibold text-xs">{nurse.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{nurse.name}</div>
                      <div className="text-xs text-gray-500">{nurse.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-900">{nurse.work_days_count}</td>
                <td className="px-4 py-3 text-center text-sm font-semibold text-purple-600">{nurse.shifts_count}</td>
                <td className="px-4 py-3 text-center text-sm text-yellow-700">{nurse.morning_shifts}</td>
                <td className="px-4 py-3 text-center text-sm text-orange-700">{nurse.afternoon_shifts}</td>
                <td className="px-4 py-3 text-center text-sm text-indigo-700">{nurse.night_shifts}</td>
                <td className="px-4 py-3 text-center">
                  <div className="text-sm font-medium text-green-700">{nurse.total_hours}</div>
                  <div className={`text-xs ${
                    nurse.total_hours >= 176
                      ? 'text-red-600'
                      : nurse.total_hours >= 160
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}>
                    {nurse.total_hours >= 176
                      ? <span className="inline-flex items-center gap-1"><WarningIcon className="w-3 h-3" /> เกิน</span>
                      : nurse.total_hours >= 160
                      ? <span className="inline-flex items-center gap-1"><LightningIcon className="w-3 h-3" /> ใกล้เกิน</span>
                      : <span className="inline-flex items-center gap-1 text-green-600"><CheckIcon className="w-3 h-3" /> ปกติ</span>
                    }
                  </div>
                </td>
                <td className="px-4 py-3 text-center text-sm text-teal-700">{nurse.rest_days}</td>
                <td className="px-4 py-3 text-center">
                  {nurse.has_submitted ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded-full font-medium">
                      <CheckIcon className="w-3 h-3" /> ส่งแล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">
                      <ClockIcon className="w-3 h-3" /> รอส่ง
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center print:hidden">
                  <button
                    onClick={() => handleViewDetail(nurse)}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  >
                    <CalendarIcon className="w-3 h-3" /> ดูเวร
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-3 text-sm font-bold text-gray-900">รวม ({nurses.length} คน)</td>
              <td className="px-4 py-3 text-center text-sm font-bold text-gray-900">
                {nurses.reduce((sum, n) => sum + n.work_days_count, 0)}
              </td>
              <td className="px-4 py-3 text-center text-sm font-bold text-purple-700">
                {nurses.reduce((sum, n) => sum + n.shifts_count, 0)}
              </td>
              <td className="px-4 py-3 text-center text-sm font-bold text-yellow-700">
                {nurses.reduce((sum, n) => sum + n.morning_shifts, 0)}
              </td>
              <td className="px-4 py-3 text-center text-sm font-bold text-orange-700">
                {nurses.reduce((sum, n) => sum + n.afternoon_shifts, 0)}
              </td>
              <td className="px-4 py-3 text-center text-sm font-bold text-indigo-700">
                {nurses.reduce((sum, n) => sum + n.night_shifts, 0)}
              </td>
              <td className="px-4 py-3 text-center text-sm font-bold text-green-700">
                {nurses.reduce((sum, n) => sum + n.total_hours, 0)}
              </td>
              <td className="px-4 py-3 text-center text-sm font-bold text-teal-700">
                {nurses.reduce((sum, n) => sum + n.rest_days, 0)}
              </td>
              <td className="px-4 py-3 text-center text-xs text-gray-600">
                {nurses.filter(n => n.has_submitted).length}/{nurses.length} ส่ง
              </td>
              <td className="px-4 py-3 print:hidden"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">รายงานการทำงานของพยาบาล</h1>
          <p className="text-gray-600">ดูรายงานการทำงานของพยาบาลในแผนกเพื่อวิเคราะห์และจัดเวร</p>
        </div>
        <button
          onClick={viewMode === 'matrix' ? handleExportMatrix : handleExportPDF}
          disabled={viewMode === 'matrix' ? matrixNurses.length === 0 : nurses.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed print:hidden"
        >
          <DownloadIcon className="w-4 h-4" /> Export PDF
        </button>
      </div>

      {/* Period Selector */}
      <div className="mb-6 print:hidden">
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
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-sm text-purple-600 mb-1">กะทั้งหมด</div>
            <div className="text-2xl font-bold text-purple-700">
              {nurses.reduce((sum, n) => sum + n.shifts_count, 0)}
            </div>
            <div className="text-xs text-purple-500">กะ</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-sm text-orange-600 mb-1">ชั่วโมงรวม</div>
            <div className="text-2xl font-bold text-orange-700">
              {nurses.reduce((sum, n) => sum + n.total_hours, 0)}
            </div>
            <div className="text-xs text-orange-500">ชั่วโมง</div>
          </div>
        </div>
      )}

      {/* View Mode Toggle */}
      <div className="mb-6 flex items-center space-x-4 print:hidden">
        <button
          onClick={() => setViewMode('cards')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'cards'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <ClipboardIcon className="w-4 h-4" /> การ์ด
        </button>
        <button
          onClick={() => setViewMode('table')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'table'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <ChartBarIcon className="w-4 h-4" /> ตาราง
        </button>
        <button
          onClick={() => setViewMode('matrix')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            viewMode === 'matrix'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <CalendarIcon className="w-4 h-4" /> ตารางเวรรายวัน
        </button>
      </div>

      {/* Content */}
      {viewMode === 'matrix' ? (
        renderMatrixView()
      ) : nurses.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-lg text-yellow-800">ไม่พบข้อมูลพยาบาลในแผนก</p>
        </div>
      ) : viewMode === 'table' ? (
        renderTableView()
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
                  <div className="flex items-center gap-3">
                    {nurse.pic_profile ? (
                      <img src={nurse.pic_profile} alt={nurse.name} className="w-10 h-10 rounded-full object-cover border-2 border-white flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-300 flex items-center justify-center border-2 border-white flex-shrink-0">
                        <span className="text-white font-semibold">{nurse.name.charAt(0)}</span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{nurse.name}</h3>
                      <p className="text-sm text-blue-100">{nurse.email}</p>
                    </div>
                  </div>
                  {nurse.has_submitted ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
                      <CheckIcon className="w-3 h-3" /> ส่งแล้ว
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white text-xs rounded-full">
                      <ClockIcon className="w-3 h-3" /> รอส่ง
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
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600"><SunriseIcon className="w-4 h-4" /> กะเช้า</span>
                    <span className="text-sm font-medium text-gray-800">{nurse.morning_shifts} กะ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600"><SunIcon className="w-4 h-4" /> กะบ่าย</span>
                    <span className="text-sm font-medium text-gray-800">{nurse.afternoon_shifts} กะ</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600"><MoonIcon className="w-4 h-4" /> กะดึก</span>
                    <span className="text-sm font-medium text-gray-800">{nurse.night_shifts} กะ</span>
                  </div>
                  <div className="flex justify-between items-center border-t pt-2">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-600"><BeachIcon className="w-4 h-4" /> วันหยุด</span>
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

                {/* View Detail Button */}
                <button
                  onClick={() => handleViewDetail(nurse)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors print:hidden"
                >
                  <CalendarIcon className="w-4 h-4" /> ดูตารางเวรรายวัน
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedNurse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  {selectedNurse.pic_profile ? (
                    <img src={selectedNurse.pic_profile} alt={selectedNurse.name} className="w-14 h-14 rounded-full object-cover border-2 border-white flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-blue-400 flex items-center justify-center border-2 border-white flex-shrink-0">
                      <span className="text-white font-bold text-xl">{selectedNurse.name.charAt(0)}</span>
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">{selectedNurse.name}</h2>
                    <p className="text-blue-100 mt-1">{selectedNurse.email}</p>
                    <p className="text-sm text-blue-100 mt-2">
                      เดือน: {generateMonthOptions().find(o => o.value === selectedPeriod)?.label}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-white hover:bg-blue-700 rounded-full p-2 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-blue-600 mb-1">วันทำงาน</div>
                  <div className="text-2xl font-bold text-blue-700">{selectedNurse.work_days_count}</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-purple-600 mb-1">กะทั้งหมด</div>
                  <div className="text-2xl font-bold text-purple-700">{selectedNurse.shifts_count}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-green-600 mb-1">ชั่วโมง</div>
                  <div className="text-2xl font-bold text-green-700">{selectedNurse.total_hours}</div>
                </div>
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-teal-600 mb-1">วันหยุด</div>
                  <div className="text-2xl font-bold text-teal-700">{selectedNurse.rest_days}</div>
                </div>
              </div>

              {/* Calendar */}
              <h3 className="text-lg font-semibold text-gray-800 mb-3">ตารางเวรรายวัน</h3>
              {loadingSchedule ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">กำลังโหลดตารางเวร...</p>
                </div>
              ) : (
                <>
                  {renderCalendar()}

                  {/* Legend */}
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                    <span className="font-medium text-gray-700">คำอธิบาย:</span>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs ${SHIFT_TYPES.morning.color}`}>
                        <SunriseIcon className="w-3 h-3" /> กะเช้า
                      </span>
                      <span className="text-gray-500 text-xs">06:00-14:00</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs ${SHIFT_TYPES.afternoon.color}`}>
                        <SunIcon className="w-3 h-3" /> กะบ่าย
                      </span>
                      <span className="text-gray-500 text-xs">14:00-22:00</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs ${SHIFT_TYPES.night.color}`}>
                        <MoonIcon className="w-3 h-3" /> กะดึก
                      </span>
                      <span className="text-gray-500 text-xs">22:00-06:00</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-lg border-t border-gray-200">
              <button
                onClick={handleCloseModal}
                className="w-full md:w-auto px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
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
            max-width: 100%;
          }

          /* Matrix table print styles */
          table {
            page-break-inside: auto;
            width: 100%;
            font-size: 9px !important;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }

          /* Make matrix cells more compact for printing */
          table td,
          table th {
            padding: 2px 4px !important;
            font-size: 8px !important;
            border: 1px solid #333 !important;
          }

          /* Ensure colors print correctly */
          .bg-yellow-200 {
            background-color: #fef08a !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-orange-200 {
            background-color: #fed7aa !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-indigo-200 {
            background-color: #c7d2fe !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .bg-gray-50 {
            background-color: #f9fafb !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          /* Sticky columns should not be sticky in print */
          .sticky {
            position: static !important;
          }

          @page {
            size: landscape;
            margin: 0.5cm;
          }

          /* Title and header */
          h1 {
            font-size: 16px !important;
            margin-bottom: 8px !important;
          }

          p {
            font-size: 10px !important;
            margin-bottom: 12px !important;
          }

          /* Hide scrollbars */
          * {
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import {
  SunriseIcon, SunIcon, MoonIcon, BeachIcon,
  WarningIcon, CheckIcon,
} from '@/components/icons'

// Shift type constants
const SHIFT_TYPES = {
  morning: { label: 'เช้า', icon: SunriseIcon, time: '06:00-14:00', color: 'bg-yellow-50 border-yellow-200 text-yellow-900' },
  afternoon: { label: 'บ่าย', icon: SunIcon, time: '14:00-22:00', color: 'bg-blue-50 border-blue-200 text-blue-900' },
  night: { label: 'ดึก', icon: MoonIcon, time: '22:00-06:00', color: 'bg-purple-50 border-purple-200 text-purple-900' },
}

type ShiftType = 'morning' | 'afternoon' | 'night'

interface Colleague {
  user_id: number
  name: string
  email: string
  pic_profile?: string | null
}

interface Schedule {
  assignment_id: string
  schedules_id: string
  date: string
  shift_type: ShiftType
  status: string
  department_id: number
  colleagues: Colleague[]
}

interface Stats {
  totalShifts: number
  morningShifts: number
  afternoonShifts: number
  nightShifts: number
  totalHours: number
  workDays: number
  restDays: number
}

export default function MySchedulePage() {
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<{ user_id?: number, name?: string, department_id?: number }>({})
  const [todayShift, setTodayShift] = useState<Schedule | null>(null)
  const [departmentName, setDepartmentName] = useState('')
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedProfile = localStorage.getItem('profile')
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile)
        setProfile(parsedProfile)
        if (parsedProfile.user_id) {
          loadDepartmentInfo(parsedProfile.user_id)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (profile.user_id) {
      loadSchedule()
    }
  }, [profile.user_id, currentDate])

  const loadDepartmentInfo = async (userId: number) => {
    try {
      const response = await fetch('/api/profile/department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.department) {
          setDepartmentName(data.department.department_name)
        }
      }
    } catch (error) {
      console.error('Error loading department info:', error)
    }
  }

  const loadSchedule = async () => {
    if (!profile.user_id) return

    setLoading(true)
    try {
      const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

      const response = await fetch('/api/nurse/my-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.user_id,
          monthYear
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules || [])
        setStats(data.stats || null)

        // Find today's shift
        const today = new Date()
        const year = today.getFullYear()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        const todayStr = `${year}-${month}-${day}`
        const shift = data.schedules?.find((s: Schedule) => s.date === todayStr)
        setTodayShift(shift || null)
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
    }
    setLoading(false)
  }

  const getMonthCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const calendar = []
    let week = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      week.push(null)
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      week.push(date)

      if (week.length === 7) {
        calendar.push(week)
        week = []
      }
    }

    // Add remaining empty cells
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null)
      }
      calendar.push(week)
    }

    return calendar
  }

  const getSchedulesForDate = (date: Date | null): Schedule[] => {
    if (!date) return []
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    const daySchedules = schedules.filter(s => s.date === dateStr)

    // Sort by shift type: morning -> afternoon -> night
    const shiftOrder: { [key in ShiftType]: number } = {
      morning: 1,
      afternoon: 2,
      night: 3
    }

    return daySchedules.sort((a, b) => shiftOrder[a.shift_type] - shiftOrder[b.shift_type])
  }

  const isToday = (date: Date | null): boolean => {
    if (!date) return false
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const monthName = currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setToast({
      show: true,
      type,
      title,
      message
    })

    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }))
  }

  const handleSubmitWorkReport = () => {
    if (!stats || stats.totalShifts === 0) {
      showToast('warning', 'ไม่มีข้อมูล', 'ไม่มีข้อมูลเวรในเดือนนี้')
      return
    }

    setShowConfirmModal(true)
  }

  const confirmSubmitWorkReport = async () => {
    setShowConfirmModal(false)
    setLoading(true)
    try {
      const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

      const response = await fetch('/api/nurse/submit-work-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.user_id,
          monthYear,
          schedules,
          stats
        })
      })

      if (response.ok) {
        showToast('success', 'บันทึกรายงานสำเร็จ!', 'สามารถดูรายงานได้ที่เมนู "รายงานเวรของฉัน"')
      } else {
        const data = await response.json()
        showToast('error', 'ไม่สามารถบันทึกได้', data.error || 'เกิดข้อผิดพลาดในการบันทึก')
      }
    } catch (error) {
      console.error('Error submitting work report:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  const handleDateClick = (date: Date | null) => {
    if (date) {
      setSelectedDate(date)
      setViewMode('day')
    }
  }

  const handleBackToMonth = () => {
    setViewMode('month')
    setSelectedDate(null)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black mb-2">ตารางเวรของฉัน</h1>
            <p className="text-black">
              แผนก: {departmentName || 'กำลังโหลด...'} | ดูตารางเวรและเพื่อนร่วมงาน
            </p>
          </div>

        </div>
      </div>

      {/* Today's Status Badge */}
      {todayShift && (
        <div className={`mb-6 p-4 rounded-lg border-2 ${SHIFT_TYPES[todayShift.shift_type].color}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {(() => { const I = SHIFT_TYPES[todayShift.shift_type].icon; return <I className="w-9 h-9 flex-shrink-0" /> })()}
              <div>
                <p className="font-semibold text-black">วันนี้ - กะ{SHIFT_TYPES[todayShift.shift_type].label}</p>
                <p className="text-sm text-black">{SHIFT_TYPES[todayShift.shift_type].time}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-black">เพื่อนร่วมกะ</p>
              <p className="font-semibold text-black">{todayShift.colleagues.length} คน</p>
            </div>
          </div>
        </div>
      )}

      {!todayShift && (
        <div className="mb-6 p-4 rounded-lg border-2 bg-green-50 border-green-200 text-green-900">
          <div className="flex items-center space-x-3">
            <BeachIcon className="w-9 h-9 flex-shrink-0" />
            <div>
              <p className="font-semibold text-black">วันนี้ - วันหยุด</p>
              <p className="text-sm text-black">ไม่มีเวรในวันนี้</p>
            </div>
          </div>
        </div>
      )}

      {/* Day View */}
      {viewMode === 'day' && selectedDate && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="mb-4">
            <button
              onClick={handleBackToMonth}
              className="text-blue-500 hover:text-blue-700 flex items-center space-x-2"
            >
              <span>←</span>
              <span>กลับไปมุมมองเดือน</span>
            </button>
          </div>

          <h2 className="text-2xl font-bold text-black mb-4">
            {selectedDate.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </h2>

          {(() => {
            const daySchedules = getSchedulesForDate(selectedDate)
            if (daySchedules.length > 0) {
              return (
                <div className="space-y-4">
                  {daySchedules.map((schedule, idx) => (
                    <div key={idx} className={`p-6 rounded-lg border-2 ${SHIFT_TYPES[schedule.shift_type].color}`}>
                      <div className="flex items-center space-x-4 mb-6">
                        {(() => { const I = SHIFT_TYPES[schedule.shift_type].icon; return <I className="w-16 h-16 flex-shrink-0" /> })()}
                        <div>
                          <h3 className="text-2xl font-bold text-black">กะ{SHIFT_TYPES[schedule.shift_type].label}</h3>
                          <p className="text-xl text-black">{SHIFT_TYPES[schedule.shift_type].time}</p>
                          <p className="text-lg text-black mt-1">8 ชั่วโมง</p>
                        </div>
                      </div>

                      <div className="border-t border-gray-300 pt-4">
                        <h4 className="text-lg font-semibold text-black mb-3">เพื่อนร่วมกะ ({schedule.colleagues.length} คน)</h4>
                        {schedule.colleagues.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {schedule.colleagues.map((colleague) => (
                              <div key={colleague.user_id} className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                                {colleague.pic_profile ? (
                                  <img src={colleague.pic_profile} alt={colleague.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-gray-600 font-semibold">{colleague.name.charAt(0)}</span>
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium text-black">{colleague.name}</p>
                                  <p className="text-sm text-gray-600">{colleague.email}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-black">ไม่มีเพื่อนร่วมกะ</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            } else {
              return (
                <div className="p-6 rounded-lg border-2 bg-green-50 border-green-200">
                  <div className="flex items-center space-x-4">
                    <BeachIcon className="w-16 h-16 flex-shrink-0" />
                    <div>
                      <h3 className="text-2xl font-bold text-black">วันหยุด</h3>
                      <p className="text-lg text-black">ไม่มีเวรในวันนี้</p>
                    </div>
                  </div>
                </div>
              )
            }
          })()}
        </div>
      )}

      <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 ${viewMode !== 'month' ? 'hidden' : ''}`}>
        {/* Calendar View */}
        <div className="lg:col-span-3">
          <div className="bg-white p-6 rounded-lg shadow">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-black font-semibold">{monthName}</h2>
              <div className="flex space-x-2">
                <button
                  onClick={previousMonth}
                  className="px-3 py-1 text-sm text-black bg-gray-100 hover:bg-gray-200 rounded"
                >
                  ← ก่อนหน้า
                </button>
                <button
                  onClick={nextMonth}
                  className="px-3 py-1 text-sm text-black bg-gray-100 hover:bg-gray-200 rounded"
                >
                  ถัดไป →
                </button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                <div key={day} className="text-center font-semibold text-black text-sm py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {getMonthCalendar().map((week, weekIdx) => (
                week.map((date, dayIdx) => {
                  const daySchedules = getSchedulesForDate(date)
                  const isTodayDate = isToday(date)

                  return (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      className={`min-h-[100px] p-2 border rounded-lg ${
                        !date ? 'bg-gray-50' :
                        isTodayDate ? 'border-blue-500 border-2' :
                        'border-gray-200'
                      } ${date ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] transition-all duration-200' : ''}`}
                      onClick={() => handleDateClick(date)}
                    >
                      {date && (
                        <>
                          <div className="text-sm font-semibold text-black mb-1">
                            {date.getDate()}
                          </div>

                          {daySchedules.length > 0 ? (
                            <div className="space-y-1">
                              {daySchedules.map((schedule, idx) => (
                                <div
                                  key={idx}
                                  className={`p-1 rounded border ${SHIFT_TYPES[schedule.shift_type].color} relative group hover:shadow-md hover:scale-105 transition-all duration-150`}
                                  title={`กะ${SHIFT_TYPES[schedule.shift_type].label}`}
                                >
                                  <div className="text-center">
                                    {(() => { const I = SHIFT_TYPES[schedule.shift_type].icon; return <I className="w-6 h-6 mx-auto mb-0.5" /> })()}
                                    <div className="text-xs font-medium">{SHIFT_TYPES[schedule.shift_type].label}</div>
                                  </div>

                                  {/* Tooltip on hover */}
                                  {schedule.colleagues.length > 0 && (
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                                      <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap">
                                        <p className="font-semibold mb-1">เพื่อนร่วมกะ:</p>
                                        {schedule.colleagues.map((colleague, idx) => (
                                          <p key={idx}>{colleague.name}</p>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-green-50 border border-green-200 text-center">
                              <BeachIcon className="w-7 h-7 mx-auto mb-1" />
                              <div className="text-xs text-green-800 font-medium">หยุด</div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })
              ))}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-black mb-3">สรุปการทำงานเดือนนี้</h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-black">ชั่วโมงทำงาน</span>
                  <span className="text-sm font-semibold text-black">{stats?.totalHours || 0} ชม.</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(((stats?.totalHours || 0) / 176) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-black mt-1">จาก 176 ชม./เดือน</p>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="inline-flex items-center gap-1 text-sm text-black"><SunriseIcon className="w-4 h-4" /> กะเช้า</span>
                  <span className="text-sm font-semibold text-black">{stats?.morningShifts || 0} ครั้ง</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="inline-flex items-center gap-1 text-sm text-black"><SunIcon className="w-4 h-4" /> กะบ่าย</span>
                  <span className="text-sm font-semibold text-black">{stats?.afternoonShifts || 0} ครั้ง</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="inline-flex items-center gap-1 text-sm text-black"><MoonIcon className="w-4 h-4" /> กะดึก</span>
                  <span className="text-sm font-semibold text-black">{stats?.nightShifts || 0} ครั้ง</span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-black">วันทำงาน</span>
                  <span className="text-sm font-semibold text-black">{stats?.workDays || 0} วัน</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-black">วันหยุด</span>
                  <span className="text-sm font-semibold text-black">{stats?.restDays || 0} วัน</span>
                </div>
              </div>

              {/* Submit Work Report Button */}
              <div className="pt-4 border-t border-gray-200 mt-4">
                <button
                  onClick={handleSubmitWorkReport}
                  disabled={loading || !stats || stats.totalShifts === 0}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium"
                >
                  <CheckIcon className="w-5 h-5" />
                  <span>บันทึกการทำงาน</span>
                </button>
                <p className="text-xs text-gray-500 text-center mt-2">
                  ยืนยันการทำงานตามตารางเวรเดือนนี้
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && stats && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{zIndex: 10000}}>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">ยืนยันการทำงานตามเวร</h3>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-700">กะทั้งหมด:</span>
                    <span className="font-semibold text-gray-800">{stats.totalShifts} กะ</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">ชั่วโมงรวม:</span>
                    <span className="font-semibold text-gray-800">{stats.totalHours} ชม.</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">วันทำงาน:</span>
                    <span className="font-semibold text-gray-800">{stats.workDays} วัน</span>
                  </div>
                </div>
              </div>

              <p className="flex items-center gap-1.5 text-sm text-red-600 mb-6">
                <WarningIcon className="w-4 h-4 flex-shrink-0" /> หลังจากยืนยันแล้วจะไม่สามารถแก้ไขได้
              </p>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmSubmitWorkReport}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 right-4 z-50 max-w-lg min-w-[450px]">
          <div
            className={`rounded-lg shadow-lg p-4 border-l-4 ${
              toast.type === 'success'
                ? 'bg-green-50 border-green-500 text-green-800'
                : toast.type === 'error'
                ? 'bg-red-50 border-red-500 text-red-800'
                : toast.type === 'warning'
                ? 'bg-yellow-50 border-yellow-500 text-yellow-800'
                : 'bg-blue-50 border-blue-500 text-blue-800'
            } transform transition-all duration-300 ease-in-out animate-in slide-in-from-right`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {toast.type === 'success' && (
                  <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === 'error' && (
                  <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === 'warning' && (
                  <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                )}
                {toast.type === 'info' && (
                  <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{toast.title}</p>
                <p className="mt-1 text-sm opacity-90">{toast.message}</p>
              </div>
              <div className="ml-4 flex-shrink-0 flex">
                <button
                  onClick={hideToast}
                  className={`rounded-md inline-flex ${
                    toast.type === 'success'
                      ? 'text-green-500 hover:text-green-600'
                      : toast.type === 'error'
                      ? 'text-red-500 hover:text-red-600'
                      : toast.type === 'warning'
                      ? 'text-yellow-500 hover:text-yellow-600'
                      : 'text-blue-500 hover:text-blue-600'
                  }`}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center" style={{zIndex: 10000}}>
          <div className="text-black bg-white p-6 rounded-lg">
            <p>กำลังโหลด...</p>
          </div>
        </div>
      )}
    </div>
  )
}


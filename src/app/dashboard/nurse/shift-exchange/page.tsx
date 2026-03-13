'use client'

import { useState, useEffect } from 'react'
import {
  SunriseIcon, SunIcon, MoonIcon,
  ClipboardIcon, PenIcon, CheckCircleIcon, XCircleIcon, DownloadIcon,
} from '@/components/icons'

// Shift type constants
const SHIFT_TYPES = {
  morning: { label: 'เช้า', icon: SunriseIcon, time: '06:00-14:00', color: 'bg-yellow-50 border-yellow-200 text-yellow-900' },
  afternoon: { label: 'บ่าย', icon: SunIcon, time: '14:00-22:00', color: 'bg-blue-50 border-blue-200 text-blue-900' },
  night: { label: 'ดึก', icon: MoonIcon, time: '22:00-06:00', color: 'bg-purple-50 border-purple-200 text-purple-900' },
}

type ShiftType = 'morning' | 'afternoon' | 'night'

// Common reasons for shift exchange
const COMMON_REASONS = [
  'มีธุระส่วนตัวเร่งด่วน',
  'ต้องดูแลบุตรหลาน',
  'ต้องพาครอบครัวไปพบแพทย์',
  'มีนัดสอบ/เรียน',
  'ต้องเข้าร่วมงานสำคัญ',
  'ไม่สบาย',
  'ต้องดูแลผู้ป่วยในครอบครัว',
  'มีกิจธุระนอกเมือง',
  'อื่นๆ (โปรดระบุ)'
]

interface Schedule {
  assignment_id: string
  schedules_id: string
  date: string
  shift_type: ShiftType
  status: string
  department_id: number
}

interface AllSchedule {
  schedules_id: string
  date: string
  shift_type: ShiftType
  department_id: number
  status: string
  nurses: Nurse[]
}

interface Nurse {
  user_id: number
  name: string
  email: string
  assignment_id?: string
}

interface ExchangeRequest {
  exchange_id: number
  requester_id: number
  target_user_id: number
  original_schedule_id: string
  target_schedule_id: string | null
  request_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  target_user_name?: string
  target_user_email?: string
  requester_name?: string
  requester_email?: string
  original_date: string
  original_shift_type: ShiftType
  target_date?: string
  target_shift_type?: ShiftType
}

export default function ShiftExchangePage() {
  const [activeTab, setActiveTab] = useState<'create' | 'my-requests' | 'incoming' | 'history'>('create')
  const [profile, setProfile] = useState<{ user_id?: number, name?: string, department_id?: number }>({})
  const [currentDate, setCurrentDate] = useState(new Date())
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [allSchedules, setAllSchedules] = useState<AllSchedule[]>([])
  const [loading, setLoading] = useState(false)

  // Create request form - Step by step
  const [step, setStep] = useState(1) // 1: select my shift, 2: select target shift, 3: select nurse, 4: reason
  const [selectedMySchedule, setSelectedMySchedule] = useState<Schedule | null>(null)
  const [selectedTargetSchedule, setSelectedTargetSchedule] = useState<AllSchedule | null>(null)
  const [selectedNurse, setSelectedNurse] = useState<Nurse | null>(null)
  const [reason, setReason] = useState('')
  const [reasonType, setReasonType] = useState<'preset' | 'custom'>('preset')
  const [selectedPresetReason, setSelectedPresetReason] = useState('')

  // Requests lists
  const [myRequests, setMyRequests] = useState<ExchangeRequest[]>([])
  const [incomingRequests, setIncomingRequests] = useState<ExchangeRequest[]>([])
  const [incomingHistory, setIncomingHistory] = useState<ExchangeRequest[]>([])

  // Toast
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
        setProfile(JSON.parse(storedProfile))
      }
    }
  }, [])

  useEffect(() => {
    if (profile.user_id && profile.department_id) {
      loadSchedule()
      loadAllSchedules()
      loadMyRequests()
      loadIncomingRequests()
      loadIncomingHistory()
    }
  }, [profile.user_id, profile.department_id, currentDate])

  const loadSchedule = async () => {
    if (!profile.user_id) return

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
      }
    } catch (error) {
      console.error('Error loading schedule:', error)
    }
  }

  const loadAllSchedules = async () => {
    if (!profile.department_id || !profile.user_id) return

    try {
      const monthYear = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

      const response = await fetch('/api/nurse/all-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departmentId: profile.department_id,
          monthYear,
          excludeUserId: profile.user_id
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAllSchedules(data.schedules || [])
      }
    } catch (error) {
      console.error('Error loading all schedules:', error)
    }
  }

  const loadMyRequests = async () => {
    if (!profile.user_id) return

    try {
      const response = await fetch('/api/nurse/shift-exchange/my-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.user_id })
      })

      if (response.ok) {
        const data = await response.json()
        setMyRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error loading my requests:', error)
    }
  }

  const loadIncomingRequests = async () => {
    if (!profile.user_id) return

    try {
      const response = await fetch('/api/nurse/shift-exchange/incoming-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.user_id })
      })

      if (response.ok) {
        const data = await response.json()
        setIncomingRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error loading incoming requests:', error)
    }
  }

  const loadIncomingHistory = async () => {
    if (!profile.user_id) return

    try {
      const response = await fetch('/api/nurse/shift-exchange/incoming-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.user_id })
      })

      if (response.ok) {
        const data = await response.json()
        setIncomingHistory(data.requests || [])
      }
    } catch (error) {
      console.error('Error loading incoming history:', error)
    }
  }

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setToast({ show: true, type, title, message })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const handleSubmitRequest = async () => {
    // Determine final reason
    const finalReason = reasonType === 'preset' ? selectedPresetReason : reason

    if (!selectedMySchedule || !selectedTargetSchedule || !selectedNurse || !finalReason.trim()) {
      showToast('warning', 'ข้อมูลไม่ครบ', 'กรุณาเลือกเวรและพยาบาลที่ต้องการแลก และกรอกเหตุผล')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/nurse/shift-exchange/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: profile.user_id,
          targetUserId: selectedNurse.user_id,
          originalScheduleId: selectedMySchedule.schedules_id,
          targetScheduleId: selectedTargetSchedule.schedules_id,
          reason: finalReason
        })
      })

      if (response.ok) {
        showToast('success', 'สำเร็จ!', 'ส่งคำขอแลกเวรเรียบร้อยแล้ว')
        // Reset form
        setStep(1)
        setSelectedMySchedule(null)
        setSelectedTargetSchedule(null)
        setSelectedNurse(null)
        setReason('')
        setReasonType('preset')
        setSelectedPresetReason('')
        loadMyRequests()
      } else {
        const data = await response.json()
        showToast('error', 'เกิดข้อผิดพลาด', data.error || 'ไม่สามารถส่งคำขอได้')
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  const handleRespondToRequest = async (exchangeId: number, response: 'approved' | 'rejected') => {
    setLoading(true)
    try {
      const res = await fetch('/api/nurse/shift-exchange/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exchangeId, response })
      })

      if (res.ok) {
        const data = await res.json()
        showToast('success', 'สำเร็จ!', data.message)
        loadIncomingRequests()
        loadIncomingHistory()
        loadMyRequests()
        loadSchedule()
      } else {
        const data = await res.json()
        showToast('error', 'เกิดข้อผิดพลาด', data.error || 'ไม่สามารถดำเนินการได้')
      }
    } catch (error) {
      console.error('Error responding to request:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const monthName = currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })

  const getMonthCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const calendar = []
    let week = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      week.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      week.push(date)

      if (week.length === 7) {
        calendar.push(week)
        week = []
      }
    }

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

  const getAllSchedulesForDate = (date: Date | null): AllSchedule[] => {
    if (!date) return []
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`

    const daySchedules = allSchedules.filter(s => s.date === dateStr)

    // Sort by shift type: morning -> afternoon -> night
    const shiftOrder: { [key in ShiftType]: number } = {
      morning: 1,
      afternoon: 2,
      night: 3
    }

    return daySchedules.sort((a, b) => shiftOrder[a.shift_type] - shiftOrder[b.shift_type])
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"><span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" /> รอตอบรับ</span>
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"><span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" /> อนุมัติ</span>
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"><span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" /> ปฏิเสธ</span>
      default:
        return null
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">ขอแลกเวร</h1>
        <p className="text-gray-600">จัดการคำขอแลกเวรกับเพื่อนร่วมงาน</p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              สร้างคำขอใหม่
            </button>
            <button
              onClick={() => setActiveTab('my-requests')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'my-requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              คำขอของฉัน ({myRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('incoming')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'incoming'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              คำขอจากเพื่อน ({incomingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ประวัติ ({myRequests.filter(r => r.status !== 'pending').length + incomingHistory.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Tab: Create New Request */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              {/* Progress Steps */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    1
                  </div>
                  <span className={`text-sm ${step >= 1 ? 'text-black font-medium' : 'text-gray-500'}`}>เลือกเวรของฉัน</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 mx-2">
                  <div className={`h-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: step >= 2 ? '100%' : '0%' }}></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    2
                  </div>
                  <span className={`text-sm ${step >= 2 ? 'text-black font-medium' : 'text-gray-500'}`}>เลือกเวรที่จะแลก</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 mx-2">
                  <div className={`h-full ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: step >= 3 ? '100%' : '0%' }}></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    3
                  </div>
                  <span className={`text-sm ${step >= 3 ? 'text-black font-medium' : 'text-gray-500'}`}>เลือกพยาบาล</span>
                </div>
                <div className="flex-1 h-1 bg-gray-200 mx-2">
                  <div className={`h-full ${step >= 4 ? 'bg-blue-600' : 'bg-gray-200'}`} style={{ width: step >= 4 ? '100%' : '0%' }}></div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full ${step >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    4
                  </div>
                  <span className={`text-sm ${step >= 4 ? 'text-black font-medium' : 'text-gray-500'}`}>เหตุผล</span>
                </div>
              </div>

              {/* Step 1: Select My Shift */}
              {step === 1 && (
                <div>
                  <h3 className="text-lg font-semibold text-black mb-4">ขั้นตอนที่ 1: เลือกเวรของฉันที่ต้องการแลก</h3>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-md font-medium text-black">{monthName}</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={previousMonth}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-black"
                      >
                        ← ก่อนหน้า
                      </button>
                      <button
                        onClick={nextMonth}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded text-black"
                      >
                        ถัดไป →
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-6">
                    {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                      <div key={day} className="text-center font-semibold text-black text-sm py-2">
                        {day}
                      </div>
                    ))}

                    {getMonthCalendar().map((week, weekIdx) =>
                      week.map((date, dayIdx) => {
                        const daySchedules = getSchedulesForDate(date)

                        return (
                          <div
                            key={`${weekIdx}-${dayIdx}`}
                            className={`min-h-[80px] p-2 border rounded ${
                              !date ? 'bg-gray-50' : 'border-gray-200'
                            }`}
                          >
                            {date && (
                              <>
                                <div className="text-sm font-semibold text-black mb-1">
                                  {date.getDate()}
                                </div>

                                {daySchedules.length > 0 ? (
                                  <div className="space-y-1">
                                    {daySchedules.map((schedule, idx) => {
                                      const isSelected = selectedMySchedule?.schedules_id === schedule.schedules_id
                                      return (
                                        <div
                                          key={idx}
                                          className={`p-1 rounded text-center cursor-pointer transition-all ${
                                            isSelected
                                              ? 'border-2 border-blue-500 bg-blue-50 text-black'
                                              : SHIFT_TYPES[schedule.shift_type].color + ' hover:shadow-md hover:scale-105'
                                          }`}
                                          onClick={() => setSelectedMySchedule(schedule)}
                                        >
                                          {(() => { const I = SHIFT_TYPES[schedule.shift_type].icon; return <I className="w-6 h-6 mx-auto" /> })()}
                                          <div className="text-xs">{SHIFT_TYPES[schedule.shift_type].label}</div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                ) : null}
                              </>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>

                  {selectedMySchedule && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-black mb-3">
                        <strong>เวรที่เลือก:</strong> {formatDate(selectedMySchedule.date)} - กะ{SHIFT_TYPES[selectedMySchedule.shift_type].label} ({SHIFT_TYPES[selectedMySchedule.shift_type].time})
                      </p>
                      <button
                        onClick={() => setStep(2)}
                        className="w-full bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                      >
                        ถัดไป: เลือกเวรที่จะแลก →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Select Target Shift */}
              {step === 2 && (
                <div>
                  <button
                    onClick={() => {
                      setStep(1)
                      setSelectedTargetSchedule(null)
                      setSelectedNurse(null)
                    }}
                    className="mb-4 text-blue-600 hover:text-blue-700 flex items-center space-x-2"
                  >
                    <span>←</span>
                    <span>กลับไปขั้นตอนที่ 1</span>
                  </button>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-black">
                      <strong>เวรของฉัน:</strong> {formatDate(selectedMySchedule!.date)} - กะ{SHIFT_TYPES[selectedMySchedule!.shift_type].label}
                    </p>
                  </div>

                  <h3 className="text-lg font-semibold text-black mb-4">ขั้นตอนที่ 2: เลือกเวรที่ต้องการแลก</h3>

                  <div className="grid grid-cols-7 gap-2 mb-6">
                    {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                      <div key={day} className="text-center font-semibold text-black text-sm py-2">
                        {day}
                      </div>
                    ))}

                    {getMonthCalendar().map((week, weekIdx) =>
                      week.map((date, dayIdx) => {
                        if (!date) {
                          return <div key={`${weekIdx}-${dayIdx}`} className="min-h-[80px] p-2 border rounded bg-gray-50"></div>
                        }

                        const targetSchedules = getAllSchedulesForDate(date)

                        return (
                          <div
                            key={`${weekIdx}-${dayIdx}`}
                            className="min-h-[80px] p-2 border rounded border-gray-200"
                          >
                            <div className="text-sm font-semibold text-black mb-1">
                              {date.getDate()}
                            </div>

                            {targetSchedules.length > 0 ? (
                              <div className="space-y-1">
                                {targetSchedules.map((targetSchedule, idx) => {
                                  const isSelected = selectedTargetSchedule?.schedules_id === targetSchedule.schedules_id
                                  const hasNurses = targetSchedule.nurses.length > 0

                                  if (!hasNurses) return null

                                  return (
                                    <div
                                      key={idx}
                                      className={`p-1 rounded text-center cursor-pointer transition-all ${
                                        isSelected
                                          ? 'border-2 border-green-500 bg-green-50 text-black'
                                          : SHIFT_TYPES[targetSchedule.shift_type].color + ' hover:shadow-md hover:scale-105'
                                      }`}
                                      onClick={() => {
                                        setSelectedTargetSchedule(targetSchedule)
                                        setSelectedNurse(null)
                                      }}
                                    >
                                      {(() => { const I = SHIFT_TYPES[targetSchedule.shift_type].icon; return <I className="w-6 h-6 mx-auto" /> })()}
                                      <div className="text-xs">{SHIFT_TYPES[targetSchedule.shift_type].label}</div>
                                      <div className="text-xs mt-1">{targetSchedule.nurses.length} คน</div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : null}
                          </div>
                        )
                      })
                    )}
                  </div>

                  {selectedTargetSchedule && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-black mb-3">
                        <strong>เวรที่จะแลก:</strong> {formatDate(selectedTargetSchedule.date)} - กะ{SHIFT_TYPES[selectedTargetSchedule.shift_type].label} ({SHIFT_TYPES[selectedTargetSchedule.shift_type].time})
                      </p>
                      <p className="text-sm text-black mb-3">
                        มีพยาบาล {selectedTargetSchedule.nurses.length} คนในเวรนี้
                      </p>
                      <button
                        onClick={() => setStep(3)}
                        className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium"
                      >
                        ถัดไป: เลือกพยาบาล →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Select Nurse */}
              {step === 3 && selectedTargetSchedule && (
                <div>
                  <button
                    onClick={() => {
                      setStep(2)
                      setSelectedNurse(null)
                    }}
                    className="mb-4 text-blue-600 hover:text-blue-700 flex items-center space-x-2"
                  >
                    <span>←</span>
                    <span>กลับไปขั้นตอนที่ 2</span>
                  </button>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-black mb-1">
                      <strong>เวรของฉัน:</strong> {formatDate(selectedMySchedule!.date)} - กะ{SHIFT_TYPES[selectedMySchedule!.shift_type].label}
                    </p>
                    <p className="text-sm text-black">
                      <strong>เวรที่จะแลก:</strong> {formatDate(selectedTargetSchedule.date)} - กะ{SHIFT_TYPES[selectedTargetSchedule.shift_type].label}
                    </p>
                  </div>

                  <h3 className="text-lg font-semibold text-black mb-4">ขั้นตอนที่ 3: เลือกพยาบาลที่จะแลกเวร</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {selectedTargetSchedule.nurses.map(nurse => {
                      const isSelected = selectedNurse?.user_id === nurse.user_id

                      return (
                        <div
                          key={nurse.user_id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            isSelected ? 'border-green-500 bg-green-50 shadow-md' : 'border-gray-200 hover:border-green-300 hover:shadow'
                          }`}
                          onClick={() => setSelectedNurse(nurse)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-lg">{nurse.name.charAt(0)}</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-black">{nurse.name}</p>
                              <p className="text-sm text-gray-600">{nurse.email}</p>
                            </div>
                            {isSelected && (
                              <div className="text-green-600">
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {selectedNurse && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <p className="text-sm text-black mb-3">
                        <strong>แลกเวรกับ:</strong> {selectedNurse.name}
                      </p>
                      <button
                        onClick={() => setStep(4)}
                        className="w-full bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium"
                      >
                        ถัดไป: กรอกเหตุผล →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 4: Reason */}
              {step === 4 && (
                <div>
                  <button
                    onClick={() => setStep(3)}
                    className="mb-4 text-blue-600 hover:text-blue-700 flex items-center space-x-2"
                  >
                    <span>←</span>
                    <span>กลับไปขั้นตอนที่ 3</span>
                  </button>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-black mb-1">
                      <strong>เวรของฉัน:</strong> {formatDate(selectedMySchedule!.date)} - กะ{SHIFT_TYPES[selectedMySchedule!.shift_type].label}
                    </p>
                    <p className="text-sm text-black mb-1">
                      <strong>เวรที่จะแลก:</strong> {formatDate(selectedTargetSchedule!.date)} - กะ{SHIFT_TYPES[selectedTargetSchedule!.shift_type].label}
                    </p>
                    <p className="text-sm text-black">
                      <strong>แลกเวรกับ:</strong> {selectedNurse!.name}
                    </p>
                  </div>

                  <h3 className="text-lg font-semibold text-black mb-4">ขั้นตอนที่ 4: กรอกเหตุผลในการขอแลกเวร</h3>

                  {/* Reason Type Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">เลือกวิธีกรอกเหตุผล</label>
                    <div className="flex space-x-4">
                      <button
                        onClick={() => setReasonType('preset')}
                        className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                          reasonType === 'preset'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5"><ClipboardIcon className="w-4 h-4" /> เลือกจากรายการ</span>
                      </button>
                      <button
                        onClick={() => setReasonType('custom')}
                        className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${
                          reasonType === 'custom'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-blue-400'
                        }`}
                      >
                        <span className="inline-flex items-center gap-1.5"><PenIcon className="w-4 h-4" /> พิมพ์เอง</span>
                      </button>
                    </div>
                  </div>

                  {/* Preset Reasons Dropdown */}
                  {reasonType === 'preset' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">เหตุผลในการขอแลกเวร</label>
                      <select
                        value={selectedPresetReason}
                        onChange={(e) => setSelectedPresetReason(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- เลือกเหตุผล --</option>
                        {COMMON_REASONS.map((reason, index) => (
                          <option key={index} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>

                      {selectedPresetReason === 'อื่นๆ (โปรดระบุ)' && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">โปรดระบุเหตุผล</label>
                          <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="กรอกเหตุผลเพิ่มเติม..."
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Custom Reason Textarea */}
                  {reasonType === 'custom' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">เหตุผลในการขอแลกเวร</label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                        placeholder="กรอกเหตุผลในการขอแลกเวร..."
                      />
                    </div>
                  )}

                  <button
                    onClick={handleSubmitRequest}
                    disabled={
                      loading ||
                      (reasonType === 'preset' && !selectedPresetReason) ||
                      (reasonType === 'preset' && selectedPresetReason === 'อื่นๆ (โปรดระบุ)' && !reason.trim()) ||
                      (reasonType === 'custom' && !reason.trim())
                    }
                    className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                  >
                    ส่งคำขอแลกเวร
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab: My Requests */}
          {activeTab === 'my-requests' && (
            <div className="space-y-4">
              {myRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">ไม่มีคำขอแลกเวร</p>
              ) : (
                [...myRequests]
                  .sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime())
                  .map(request => (
                  <div key={request.exchange_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-semibold text-black mb-1">
                          ขอแลกกับ: {request.target_user_name}
                        </p>
                        <p className="text-sm text-gray-600">{request.target_user_email}</p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    <div className="bg-gray-50 rounded p-3 mb-3">
                      <p className="text-sm text-black">
                        <strong>เวรของฉัน:</strong> {formatDate(request.original_date)} - กะ{SHIFT_TYPES[request.original_shift_type].label}
                      </p>
                      {request.target_date && (
                        <p className="text-sm text-black mt-1">
                          <strong>แลกกับเวร:</strong> {formatDate(request.target_date)} - กะ{SHIFT_TYPES[request.target_shift_type!].label}
                        </p>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      <strong>เหตุผล:</strong> {request.reason}
                    </p>

                    <p className="text-xs text-gray-500">
                      ส่งคำขอเมื่อ: {formatDateTime(request.request_date)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: Incoming Requests */}
          {activeTab === 'incoming' && (
            <div className="space-y-4">
              {incomingRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">ไม่มีคำขอแลกเวรจากเพื่อน</p>
              ) : (
                incomingRequests.map(request => (
                  <div key={request.exchange_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      <p className="font-semibold text-black mb-1">
                        จาก: {request.requester_name}
                      </p>
                      <p className="text-sm text-gray-600">{request.requester_email}</p>
                    </div>

                    <div className="bg-gray-50 rounded p-3 mb-3">
                      <p className="text-sm text-black">
                        <strong>{request.requester_name} ต้องการแลกเวร:</strong>
                      </p>
                      <p className="text-sm text-black mt-1">
                        {formatDate(request.original_date)} - กะ{SHIFT_TYPES[request.original_shift_type].label}
                      </p>
                      {request.target_date && (
                        <p className="text-sm text-black mt-1">
                          <strong>กับเวรของคุณ:</strong> {formatDate(request.target_date)} - กะ{SHIFT_TYPES[request.target_shift_type!].label}
                        </p>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 mb-2">
                      <strong>เหตุผล:</strong> {request.reason}
                    </p>

                    <p className="text-xs text-gray-500 mb-4">
                      ส่งคำขอเมื่อ: {formatDateTime(request.request_date)}
                    </p>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleRespondToRequest(request.exchange_id, 'approved')}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                      >
                        <CheckCircleIcon className="w-4 h-4" /> ยอมรับ
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(request.exchange_id, 'rejected')}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400"
                      >
                        <XCircleIcon className="w-4 h-4" /> ปฏิเสธ
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab: History */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {myRequests.filter(r => r.status !== 'pending').length === 0 && incomingHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">ไม่มีประวัติการแลกเวร</p>
              ) : (
                <>
                  {/* Combine and sort all history by request_date */}
                  {[
                    ...myRequests
                      .filter(r => r.status !== 'pending')
                      .map(r => ({ ...r, type: 'my' as const })),
                    ...incomingHistory.map(r => ({ ...r, type: 'incoming' as const }))
                  ]
                    .sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime())
                    .map(request => {
                      if (request.type === 'my') {
                        return (
                          <div key={`my-${request.exchange_id}`} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="text-xs text-blue-600 font-medium mb-1">📤 คำขอของฉัน</p>
                                <p className="font-semibold text-black mb-1">
                                  ขอแลกกับ: {request.target_user_name}
                                </p>
                              </div>
                              {getStatusBadge(request.status)}
                            </div>

                            <div className="bg-gray-50 rounded p-3 mb-3">
                              <p className="text-sm text-black">
                                <strong>เวรของฉัน:</strong> {formatDate(request.original_date)} - กะ{SHIFT_TYPES[request.original_shift_type].label}
                              </p>
                              {request.target_date && (
                                <p className="text-sm text-black mt-1">
                                  <strong>แลกกับเวร:</strong> {formatDate(request.target_date)} - กะ{SHIFT_TYPES[request.target_shift_type!].label}
                                </p>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 mb-2">
                              <strong>เหตุผล:</strong> {request.reason}
                            </p>

                            <p className="text-xs text-gray-500">
                              ส่งคำขอเมื่อ: {formatDateTime(request.request_date)}
                            </p>
                          </div>
                        )
                      } else {
                        return (
                          <div key={`incoming-${request.exchange_id}`} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="inline-flex items-center gap-1 text-xs text-green-600 font-medium mb-1"><DownloadIcon className="w-3 h-3" /> คำขอที่ได้รับ</p>
                                <p className="font-semibold text-black mb-1">
                                  จาก: {request.requester_name}
                                </p>
                                <p className="text-sm text-gray-600">{request.requester_email}</p>
                              </div>
                              {getStatusBadge(request.status)}
                            </div>

                            <div className="bg-gray-50 rounded p-3 mb-3">
                              <p className="text-sm text-black">
                                <strong>{request.requester_name} ต้องการแลกเวร:</strong>
                              </p>
                              <p className="text-sm text-black mt-1">
                                {formatDate(request.original_date)} - กะ{SHIFT_TYPES[request.original_shift_type].label}
                              </p>
                              {request.target_date && (
                                <p className="text-sm text-black mt-1">
                                  <strong>กับเวรของคุณ:</strong> {formatDate(request.target_date)} - กะ{SHIFT_TYPES[request.target_shift_type!].label}
                                </p>
                              )}
                            </div>

                            <p className="text-sm text-gray-600 mb-2">
                              <strong>เหตุผล:</strong> {request.reason}
                            </p>

                            <p className="text-xs text-gray-500">
                              ส่งคำขอเมื่อ: {formatDateTime(request.request_date)}
                            </p>
                          </div>
                        )
                      }
                    })}
                </>
              )}
            </div>
          )}
        </div>
      </div>

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
            }`}
          >
            <div className="flex items-start">
              <div className="flex-1">
                <p className="text-sm font-medium">{toast.title}</p>
                <p className="mt-1 text-sm opacity-90">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(prev => ({ ...prev, show: false }))}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center" style={{ zIndex: 10000 }}>
          <div className="bg-white p-6 rounded-lg">
            <p className="text-black">กำลังประมวลผล...</p>
          </div>
        </div>
      )}
    </div>
  )
}

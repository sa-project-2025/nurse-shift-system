'use client'

import { useState, useEffect } from 'react'
import {
  SunriseIcon, SunIcon, MoonIcon, BeachIcon,
  SickIcon, ClipboardIcon, NoteIcon,
  WarningIcon,
} from '@/components/icons'

// Leave type constants
const LEAVE_TYPES = {
  sick: { label: 'ลาป่วย', icon: SickIcon, color: 'bg-red-50 border-red-200 text-red-900' },
  personal: { label: 'ลากิจ', icon: ClipboardIcon, color: 'bg-blue-50 border-blue-200 text-blue-900' },
  vacation: { label: 'ลาพักร้อน', icon: BeachIcon, color: 'bg-green-50 border-green-200 text-green-900' },
  other: { label: 'ลาอื่นๆ', icon: NoteIcon, color: 'bg-gray-50 border-gray-200 text-gray-900' },
}

type LeaveType = 'sick' | 'personal' | 'vacation' | 'other'

const SHIFT_TYPES = {
  morning: { label: 'เช้า', icon: SunriseIcon, time: '06:00-14:00', color: 'bg-yellow-50 border-yellow-200 text-yellow-900' },
  afternoon: { label: 'บ่าย', icon: SunIcon, time: '14:00-22:00', color: 'bg-blue-50 border-blue-200 text-blue-900' },
  night: { label: 'ดึก', icon: MoonIcon, time: '22:00-06:00', color: 'bg-purple-50 border-purple-200 text-purple-900' },
}

type ShiftType = 'morning' | 'afternoon' | 'night'

interface Schedule {
  schedules_id: string
  date: string
  shift_type: ShiftType
  status: string
}

interface LeaveRequest {
  leave_id: number
  user_id: number
  start_date: string
  end_date: string
  leave_days: number
  leave_type: LeaveType
  reason: string
  reason_reject: string | null
  status: 'pending' | 'approved' | 'rejected'
  request_date: string
  response_date: string | null
  approved_by: number | null
  approver_name?: string
}

export default function LeaveRequestPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'pending' | 'approved' | 'rejected' | 'all'>('create')
  const [profile, setProfile] = useState<{ user_id?: number, name?: string, department_id?: number }>({})
  const [loading, setLoading] = useState(false)

  // Form state
  const [leaveType, setLeaveType] = useState<LeaveType>('sick')
  const [otherLeaveType, setOtherLeaveType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  // Schedules in selected date range
  const [affectedSchedules, setAffectedSchedules] = useState<Schedule[]>([])

  // Leave requests
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])

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
    if (profile.user_id) {
      loadLeaveRequests()
    }
  }, [profile.user_id])

  useEffect(() => {
    if (startDate && endDate && profile.user_id) {
      loadAffectedSchedules()
    } else {
      setAffectedSchedules([])
    }
  }, [startDate, endDate, profile.user_id])

  const loadLeaveRequests = async () => {
    if (!profile.user_id) return

    try {
      const response = await fetch('/api/nurse/leave-request/my-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.user_id })
      })

      if (response.ok) {
        const data = await response.json()
        setLeaveRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error loading leave requests:', error)
    }
  }

  const loadAffectedSchedules = async () => {
    if (!profile.user_id || !startDate || !endDate) return

    try {
      const response = await fetch('/api/nurse/leave-request/affected-schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.user_id,
          startDate,
          endDate
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAffectedSchedules(data.schedules || [])
      }
    } catch (error) {
      console.error('Error loading affected schedules:', error)
    }
  }

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setToast({ show: true, type, title, message })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const calculateLeaveDays = () => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays + 1 // +1 because both start and end dates are included
  }

  const handleSubmitLeaveRequest = async () => {
    if (!startDate || !endDate || !reason.trim()) {
      showToast('warning', 'ข้อมูลไม่ครบ', 'กรุณาเลือกวันที่และกรอกเหตุผล')
      return
    }

    if (leaveType === 'other' && !otherLeaveType.trim()) {
      showToast('warning', 'ข้อมูลไม่ครบ', 'กรุณาระบุประเภทการลา')
      return
    }

    if (new Date(endDate) < new Date(startDate)) {
      showToast('error', 'วันที่ไม่ถูกต้อง', 'วันสิ้นสุดต้องมากกว่าหรือเท่ากับวันเริ่มต้น')
      return
    }

    const leaveDays = calculateLeaveDays()

    setLoading(true)
    try {
      const response = await fetch('/api/nurse/leave-request/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.user_id,
          startDate,
          endDate,
          leaveDays,
          leaveType: leaveType === 'other' ? otherLeaveType : leaveType,
          reason
        })
      })

      if (response.ok) {
        showToast('success', 'สำเร็จ!', 'ส่งคำขอลางานเรียบร้อยแล้ว')
        // Reset form
        setStartDate('')
        setEndDate('')
        setReason('')
        setOtherLeaveType('')
        setAffectedSchedules([])
        loadLeaveRequests()
        setActiveTab('pending')
      } else {
        const data = await response.json()
        showToast('error', 'เกิดข้อผิดพลาด', data.error || 'ไม่สามารถส่งคำขอได้')
      }
    } catch (error) {
      console.error('Error submitting leave request:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถติดต่อเซิร์ฟเวอร์ได้')
    } finally {
      setLoading(false)
    }
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
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full"><span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" /> รอการอนุมัติ</span>
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"><span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" /> อนุมัติแล้ว</span>
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"><span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" /> ไม่อนุมัติ</span>
      default:
        return null
    }
  }

  const filterRequests = (status?: string) => {
    if (!status) return leaveRequests
    return leaveRequests.filter(r => r.status === status)
  }

  const getLeaveTypeDisplay = (leaveType: string) => {
    if (leaveType in LEAVE_TYPES) {
      const type = LEAVE_TYPES[leaveType as keyof typeof LEAVE_TYPES]
      return { icon: type.icon, label: type.label }
    }
    // Custom leave type
    return { icon: NoteIcon, label: leaveType }
  }

  const renderLeaveRequestCard = (request: LeaveRequest) => {
    const leaveTypeDisplay = getLeaveTypeDisplay(request.leave_type)

    return (
      <div key={request.leave_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            {(() => { const I = leaveTypeDisplay.icon; return <I className="w-7 h-7 flex-shrink-0" /> })()}
            <div>
              <p className="font-semibold text-black">{leaveTypeDisplay.label}</p>
              <p className="text-sm text-gray-600">
                {formatDate(request.start_date)} - {formatDate(request.end_date)} ({request.leave_days} วัน)
              </p>
            </div>
          </div>
          {getStatusBadge(request.status)}
        </div>

      <div className="bg-gray-50 rounded p-3 mb-3">
        <p className="text-sm text-black">
          <strong>เหตุผล:</strong> {request.reason}
        </p>
      </div>

      {request.status === 'rejected' && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
          {request.approver_name && (
            <p className="text-sm text-red-900 mb-2">
              <strong>ปฏิเสธโดย:</strong> {request.approver_name}
            </p>
          )}
          {request.reason_reject && (
            <p className="text-sm text-red-900">
              <strong>เหตุผลที่ปฏิเสธ:</strong> {request.reason_reject}
            </p>
          )}
        </div>
      )}

      {request.status === 'approved' && request.approver_name && (
        <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
          <p className="text-sm text-green-900">
            <strong>อนุมัติโดย:</strong> {request.approver_name}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>ส่งคำขอ: {formatDateTime(request.request_date)}</span>
        {request.response_date && (
          <span>ตอบรับ: {formatDateTime(request.response_date)}</span>
        )}
      </div>
    </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">ขอลางาน</h1>
        <p className="text-gray-600">จัดการคำขอลางานและติดตามสถานะ</p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px overflow-x-auto">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'create'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              สร้างคำขอใหม่
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              รอการอนุมัติ ({filterRequests('pending').length})
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'approved'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              อนุมัติแล้ว ({filterRequests('approved').length})
            </button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'rejected'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ไม่อนุมัติ ({filterRequests('rejected').length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                activeTab === 'all'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              ทั้งหมด ({leaveRequests.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Tab: Create New Request */}
          {activeTab === 'create' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <h3 className="text-lg font-semibold text-black mb-4">สร้างคำขอลางานใหม่</h3>

              {/* Leave Type */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">ประเภทการลา</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(Object.keys(LEAVE_TYPES) as LeaveType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setLeaveType(type)
                        if (type !== 'other') {
                          setOtherLeaveType('')
                        }
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        leaveType === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {(() => { const I = LEAVE_TYPES[type].icon; return <I className="w-9 h-9 mx-auto mb-2" /> })()}
                      <div className="text-sm font-medium text-black">{LEAVE_TYPES[type].label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Other Leave Type Input */}
              {leaveType === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    ระบุประเภทการลา <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={otherLeaveType}
                    onChange={(e) => setOtherLeaveType(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black"
                    placeholder="เช่น ลาบวช, ลาคลอด, ลาทำบุญ..."
                  />
                </div>
              )}

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">วันที่เริ่มต้น</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">วันที่สิ้นสุด</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full p-3 border border-gray-300 rounded-lg text-black"
                  />
                </div>
              </div>

              {/* Leave Days Display */}
              {startDate && endDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-black">
                    <strong>จำนวนวันที่ลา:</strong> {calculateLeaveDays()} วัน
                  </p>
                </div>
              )}

              {/* Affected Schedules */}
              {affectedSchedules.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-black mb-2">
                    <WarningIcon className="w-4 h-4 flex-shrink-0" /> คุณมีเวรในช่วงนี้ {affectedSchedules.length} วัน:
                  </p>
                  <div className="space-y-1">
                    {affectedSchedules.map((schedule, idx) => (
                      <div key={idx} className="flex items-center space-x-2 text-sm text-black">
                        {(() => { const I = SHIFT_TYPES[schedule.shift_type].icon; return <I className="w-4 h-4 flex-shrink-0" /> })()}
                        <span>{formatDate(schedule.date)} - กะ{SHIFT_TYPES[schedule.shift_type].label}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-800 mt-3">
                    หากได้รับอนุมัติ เวรเหล่านี้จะถูกลบออกจากตารางเวร
                  </p>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  เหตุผล <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-black"
                  rows={4}
                  placeholder="กรอกเหตุผลในการขอลางาน..."
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmitLeaveRequest}
                disabled={loading || !startDate || !endDate || !reason.trim() || (leaveType === 'other' && !otherLeaveType.trim())}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
              >
                ส่งคำขอลางาน
              </button>
            </div>
          )}

          {/* Tab: Pending */}
          {activeTab === 'pending' && (
            <div className="space-y-4">
              {filterRequests('pending').length === 0 ? (
                <p className="text-center text-gray-500 py-8">ไม่มีคำขอที่รอการอนุมัติ</p>
              ) : (
                filterRequests('pending')
                  .sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime())
                  .map(renderLeaveRequestCard)
              )}
            </div>
          )}

          {/* Tab: Approved */}
          {activeTab === 'approved' && (
            <div className="space-y-4">
              {filterRequests('approved').length === 0 ? (
                <p className="text-center text-gray-500 py-8">ไม่มีคำขอที่อนุมัติแล้ว</p>
              ) : (
                filterRequests('approved')
                  .sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime())
                  .map(renderLeaveRequestCard)
              )}
            </div>
          )}

          {/* Tab: Rejected */}
          {activeTab === 'rejected' && (
            <div className="space-y-4">
              {filterRequests('rejected').length === 0 ? (
                <p className="text-center text-gray-500 py-8">ไม่มีคำขอที่ไม่อนุมัติ</p>
              ) : (
                filterRequests('rejected')
                  .sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime())
                  .map(renderLeaveRequestCard)
              )}
            </div>
          )}

          {/* Tab: All */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              {leaveRequests.length === 0 ? (
                <p className="text-center text-gray-500 py-8">ไม่มีคำขอลางาน</p>
              ) : (
                [...leaveRequests]
                  .sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime())
                  .map(renderLeaveRequestCard)
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

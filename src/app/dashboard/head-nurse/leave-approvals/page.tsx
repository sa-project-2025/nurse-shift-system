'use client'

import { useState, useEffect } from 'react'
import {
  SunriseIcon, SunIcon, MoonIcon, BeachIcon,
  SickIcon, ClipboardIcon, NoteIcon,
  CheckCircleIcon, XCircleIcon, WarningIcon,
} from '@/components/icons'

// Leave type constants
const LEAVE_TYPES = {
  sick: { label: 'ลาป่วย', icon: SickIcon, color: 'bg-red-50 border-red-200 text-red-900' },
  personal: { label: 'ลากิจ', icon: ClipboardIcon, color: 'bg-blue-50 border-blue-200 text-blue-900' },
  vacation: { label: 'ลาพักร้อน', icon: BeachIcon, color: 'bg-green-50 border-green-200 text-green-900' },
}

type LeaveType = 'sick' | 'personal' | 'vacation' | string

const SHIFT_TYPES = {
  morning: { label: 'เช้า', icon: SunriseIcon, time: '06:00-14:00' },
  afternoon: { label: 'บ่าย', icon: SunIcon, time: '14:00-22:00' },
  night: { label: 'ดึก', icon: MoonIcon, time: '22:00-06:00' },
}

type ShiftType = 'morning' | 'afternoon' | 'night'

interface Schedule {
  schedules_id: string
  date: string
  shift_type: ShiftType
}

interface LeaveRequest {
  leave_id: number
  user_id: number
  user_name: string
  user_email: string
  start_date: string
  end_date: string
  leave_days: number
  leave_type: LeaveType
  reason: string
  reason_reject: string | null
  status: 'pending' | 'approved' | 'rejected'
  request_date: string
  response_date: string | null
  affected_schedules?: Schedule[]
}

export default function LeaveApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [profile, setProfile] = useState<{ user_id?: number, name?: string, department_id?: number }>({})
  const [loading, setLoading] = useState(false)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve')
  const [rejectReason, setRejectReason] = useState('')

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
    if (profile.department_id) {
      loadLeaveRequests()
    }
  }, [profile.department_id])

  const loadLeaveRequests = async () => {
    if (!profile.department_id) return

    setLoading(true)
    try {
      const response = await fetch('/api/head-nurse/leave-request/all-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: profile.department_id })
      })

      if (response.ok) {
        const data = await response.json()
        setLeaveRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Error loading leave requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setToast({ show: true, type, title, message })
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const handleOpenModal = (request: LeaveRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request)
    setModalAction(action)
    setRejectReason('')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedRequest(null)
    setRejectReason('')
  }

  const handleConfirmAction = async () => {
    if (!selectedRequest) return

    if (modalAction === 'reject' && !rejectReason.trim()) {
      showToast('warning', 'ข้อมูลไม่ครบ', 'กรุณากรอกเหตุผลที่ปฏิเสธ')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/head-nurse/leave-request/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveId: selectedRequest.leave_id,
          response: modalAction === 'approve' ? 'approved' : 'rejected',
          approvedBy: profile.user_id,
          reasonReject: modalAction === 'reject' ? rejectReason : null
        })
      })

      if (response.ok) {
        const data = await response.json()
        showToast('success', 'สำเร็จ!', data.message)
        handleCloseModal()
        loadLeaveRequests()
      } else {
        const data = await response.json()
        showToast('error', 'เกิดข้อผิดพลาด', data.error || 'ไม่สามารถดำเนินการได้')
      }
    } catch (error) {
      console.error('Error responding to leave request:', error)
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

  const getLeaveTypeDisplay = (leaveType: string) => {
    if (leaveType in LEAVE_TYPES) {
      const type = LEAVE_TYPES[leaveType as keyof typeof LEAVE_TYPES]
      return (
        <div className="flex items-center space-x-2">
          {(() => { const I = type.icon; return <I className="w-7 h-7 flex-shrink-0" /> })()}
          <span className="font-medium text-black">{type.label}</span>
        </div>
      )
    }
    return (
      <div className="flex items-center space-x-2">
        <NoteIcon className="w-7 h-7 flex-shrink-0" />
        <span className="font-medium text-black">{leaveType}</span>
      </div>
    )
  }

  const filterRequests = (status?: string) => {
    if (!status) return leaveRequests
    return leaveRequests.filter(r => r.status === status)
  }

  const renderLeaveRequestCard = (request: LeaveRequest) => (
    <div key={request.leave_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          {getLeaveTypeDisplay(request.leave_type)}
          <p className="text-sm text-gray-600 mt-1">
            {formatDate(request.start_date)} - {formatDate(request.end_date)} ({request.leave_days} วัน)
          </p>
        </div>
        {getStatusBadge(request.status)}
      </div>

      <div className="bg-gray-50 rounded p-3 mb-3">
        <p className="text-sm text-black mb-2">
          <strong>ผู้ขอลา:</strong> {request.user_name}
        </p>
        <p className="text-sm text-gray-600 mb-2">{request.user_email}</p>
        <p className="text-sm text-black">
          <strong>เหตุผล:</strong> {request.reason}
        </p>
      </div>

      {request.affected_schedules && request.affected_schedules.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-black mb-2">
            <WarningIcon className="w-4 h-4 flex-shrink-0" /> มีเวรในช่วงนี้ {request.affected_schedules.length} วัน:
          </p>
          <div className="space-y-1">
            {request.affected_schedules.slice(0, 3).map((schedule, idx) => (
              <div key={idx} className="flex items-center space-x-2 text-sm text-black">
                {(() => { const I = SHIFT_TYPES[schedule.shift_type].icon; return <I className="w-4 h-4 flex-shrink-0" /> })()}
                <span>{formatDate(schedule.date)} - กะ{SHIFT_TYPES[schedule.shift_type].label}</span>
              </div>
            ))}
            {request.affected_schedules.length > 3 && (
              <p className="text-xs text-gray-600">และอีก {request.affected_schedules.length - 3} วัน...</p>
            )}
          </div>
          {request.status === 'pending' && (
            <p className="text-xs text-yellow-800 mt-2">
              หากอนุมัติ เวรเหล่านี้จะถูกลบออกจากตาราง
            </p>
          )}
        </div>
      )}

      {request.status === 'rejected' && request.reason_reject && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
          <p className="text-sm text-red-900">
            <strong>เหตุผลที่ปฏิเสธ:</strong> {request.reason_reject}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
        <span>ส่งคำขอ: {formatDateTime(request.request_date)}</span>
        {request.response_date && (
          <span>ตอบรับ: {formatDateTime(request.response_date)}</span>
        )}
      </div>

      {request.status === 'pending' && (
        <div className="flex space-x-3 pt-3 border-t border-gray-200">
          <button
            onClick={() => handleOpenModal(request, 'approve')}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
          >
            <CheckCircleIcon className="w-4 h-4" /> อนุมัติ
          </button>
          <button
            onClick={() => handleOpenModal(request, 'reject')}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 font-medium"
          >
            <XCircleIcon className="w-4 h-4" /> ปฏิเสธ
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-black mb-2">อนุมัติคำขอลางาน</h1>
        <p className="text-gray-600">จัดการคำขอลางานของพยาบาล</p>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
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
          {loading && leaveRequests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">กำลังโหลด...</p>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center" style={{ zIndex: 10000 }}>
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-bold text-black mb-4">
              {modalAction === 'approve' ? 'ยืนยันการอนุมัติ' : 'ยืนยันการปฏิเสธ'}
            </h3>

            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>ผู้ขอลา:</strong> {selectedRequest.user_name}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>ประเภทการลา:</strong> {selectedRequest.leave_type}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>วันที่ลา:</strong> {formatDate(selectedRequest.start_date)} - {formatDate(selectedRequest.end_date)} ({selectedRequest.leave_days} วัน)
              </p>
            </div>

            {modalAction === 'approve' && selectedRequest.affected_schedules && selectedRequest.affected_schedules.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                <p className="flex items-center gap-1.5 text-sm font-semibold text-yellow-900 mb-2">
                  <WarningIcon className="w-4 h-4 flex-shrink-0" /> เวร {selectedRequest.affected_schedules.length} วันจะถูกลบออกจากตาราง
                </p>
              </div>
            )}

            {modalAction === 'reject' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">
                  เหตุผลที่ปฏิเสธ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-black"
                  rows={3}
                  placeholder="กรอกเหตุผลที่ปฏิเสธคำขอลา..."
                />
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleCloseModal}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-100"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
                  modalAction === 'approve'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                } disabled:bg-gray-400`}
              >
                {loading ? 'กำลังดำเนินการ...' : 'ยืนยัน'}
              </button>
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
    </div>
  )
}

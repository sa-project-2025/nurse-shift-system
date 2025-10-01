'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  useDroppable,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface Nurse {
  assignment_id?: string  // Present in assigned nurses
  user_id: number
  name: string
  email: string
}

interface Schedule {
  schedules_id?: number
  date: string
  shift_type: 'morning' | 'afternoon' | 'night'
  required_nurse: number
  assigned_nurses: Nurse[]
  status: 'draft' | 'published'
  created_by: number
  published_date?: string
}

const SHIFT_TYPES = [
  { value: 'morning', label: 'เช้า (6:00-14:00)', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'afternoon', label: 'บ่าย (14:00-22:00)', color: 'bg-blue-100 text-blue-800' },
  { value: 'night', label: 'ดึก (22:00-6:00)', color: 'bg-purple-100 text-purple-800' },
]

// Draggable Nurse Component
interface DraggableNurseProps {
  nurse: Nurse
  onAssign?: () => void
  isDragging?: boolean
}

function DraggableNurse({ nurse, onAssign, isDragging }: DraggableNurseProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: nurse.user_id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging || isSortableDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
    >
      <div
        {...attributes}
        {...listeners}
        className="flex-1 cursor-move py-1"
      >
        <p className="text-sm font-medium text-black">{nurse.name}</p>
        <p className="text-xs text-black">{nurse.email}</p>
      </div>
      {onAssign && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            console.log('Button clicked for:', nurse.name)
            onAssign()
          }}
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 ml-2 flex-shrink-0"
        >
          จัดเวร
        </button>
      )}
    </div>
  )
}

// Drop Zone Component
interface DropZoneProps {
  date: string
  shift: string
  children?: React.ReactNode
  className?: string
}

function DropZone({ date, shift, children, className = '' }: DropZoneProps) {
  const id = `${date}-${shift}`

  const { isOver, setNodeRef } = useDroppable({
    id: id,
  })

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[60px] p-2 border-2 border-dashed border-gray-200 rounded-lg ${className} ${
        isOver ? 'bg-blue-50 border-blue-300' : ''
      }`}
      data-drop-zone={id}
    >
      {children}
    </div>
  )
}

export default function ScheduleManagementPage() {
  const router = useRouter()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedShift, setSelectedShift] = useState<'morning' | 'afternoon' | 'night'>('morning')
  const [availableNurses, setAvailableNurses] = useState<Nurse[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(false)
  const [activeId, setActiveId] = useState<number | null>(null)
  const [draggedNurse, setDraggedNurse] = useState<Nurse | null>(null)
  const [departmentName, setDepartmentName] = useState('')
  const [requiredNurses, setRequiredNurses] = useState({
    morning: 3,
    afternoon: 3,
    night: 2
  })
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null)
  const [tempScheduleRequirement, setTempScheduleRequirement] = useState<number>(0)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    type: 'success' | 'error' | 'warning'
    title: string
    message: string
  }>({
    show: false,
    type: 'success',
    title: '',
    message: ''
  })
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean
    title: string
    message: string
    onConfirm: () => void
    onCancel: () => void
    confirmText: string
    cancelText: string
    type: 'danger' | 'warning' | 'info'
  }>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: 'ยืนยัน',
    cancelText: 'ยกเลิก',
    type: 'info'
  })

  useEffect(() => {
    // Check if user is logged in
    const user = localStorage.getItem('user')
    const profile = localStorage.getItem('profile')

    if (!user || !profile) {
      router.push('/login')
    } else {
      loadDepartmentInfo()
      loadAvailableNurses()
      loadMonthlySchedules()
    }
  }, [router, currentMonth])

  const loadDepartmentInfo = async () => {
    try {
      const profile = JSON.parse(localStorage.getItem('profile') || '{}')
      const response = await fetch('/api/profile/department', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.user_id })
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

  const loadAvailableNurses = async () => {
    try {
      const profile = JSON.parse(localStorage.getItem('profile') || '{}')
      const response = await fetch('/api/nurses/available', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: profile.department_id })
      })

      if (response.ok) {
        const data = await response.json()
        setAvailableNurses(data.nurses || [])
      }
    } catch (error) {
      console.error('Error loading nurses:', error)
    }
  }

  const loadMonthlySchedules = async () => {
    try {
      const profile = JSON.parse(localStorage.getItem('profile') || '{}')
      const startDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)

      console.log('Loading schedules for:', formatDateToString(startDate), 'to', formatDateToString(endDate))

      const response = await fetch(`/api/schedules/monthly?t=${Date.now()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          departmentId: profile.department_id,
          startDate: formatDateToString(startDate),
          endDate: formatDateToString(endDate)
        })
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Loaded schedules:', data.schedules?.length || 0, 'items')

        // Log sample schedule to verify assigned_nurses
        if (data.schedules && data.schedules.length > 0) {
          const sampleSchedule = data.schedules.find((s: Schedule) => s.assigned_nurses?.length > 0)
          if (sampleSchedule) {
            console.log('Sample schedule with assignments:', {
              id: sampleSchedule.schedules_id,
              date: sampleSchedule.date,
              shift: sampleSchedule.shift_type,
              assigned: sampleSchedule.assigned_nurses?.length || 0,
              required: sampleSchedule.required_nurse
            })
          }
        }

        setSchedules(data.schedules || [])
      } else {
        console.error('Failed to load schedules:', response.status)
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
    }
  }

  // Helper function to format date consistently
  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const generateCalendar = () => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const current = new Date(startDate)

    // Generate calendar but ensure we have full weeks
    while (current <= lastDay || current.getDay() !== 0) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }


    return days
  }

  const getScheduleForDate = (date: Date, shiftType: string) => {
    const dateStr = formatDateToString(date)
    return schedules.find(s => s.date === dateStr && s.shift_type === shiftType)
  }

  const handleAssignNurse = async (nurse: Nurse, targetDate?: string, targetShift?: string) => {
    const assignDate = targetDate || selectedDate
    const assignShift = targetShift || selectedShift

    if (!assignDate) {
      showToast('warning', 'ข้อมูลไม่ครบ', 'กรุณาเลือกวันที่ก่อนจัดเวร')
      return
    }

    setLoading(true)
    try {
      const profile = JSON.parse(localStorage.getItem('profile') || '{}')
      const response = await fetch('/api/schedules/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: assignDate,
          shift_type: assignShift,
          nurse_id: nurse.user_id,
          department_id: profile.department_id,
          assigned_by: profile.user_id,
          required_nurse: requiredNurses[assignShift as keyof typeof requiredNurses]
        })
      })

      if (response.ok) {
        console.log('Assignment successful, reloading schedules...')

        // Force refresh with a small delay to ensure DB transaction is complete
        setTimeout(async () => {
          await loadMonthlySchedules()
        }, 500)

        showToast('success', 'จัดเวรสำเร็จ!', `จัดเวรพยาบาล ${nurse.name} เข้ากะ${assignShift === 'morning' ? 'เช้า' : assignShift === 'afternoon' ? 'บ่าย' : 'ดึก'} เรียบร้อยแล้ว`)
      } else {
        const data = await response.json()
        showToast('error', 'ไม่สามารถจัดเวรได้', data.error || 'เกิดข้อผิดพลาดในระบบ')
      }
    } catch (error) {
      console.error('Error assigning nurse:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้')
    }
    setLoading(false)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as number)
    const nurse = availableNurses.find(n => n.user_id === active.id)
    setDraggedNurse(nurse || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setDraggedNurse(null)

    if (!over) return

    const overId = String(over.id)
    const nurse = availableNurses.find(n => n.user_id === active.id)

    if (!nurse) return

    console.log('Dropped on:', overId) // Debug log

    // Check if dropped on a specific shift (priority)
    const shiftDropMatch = overId.match(/^(\d{4}-\d{2}-\d{2})-(morning|afternoon|night)$/)
    if (shiftDropMatch) {
      const [, dropDate, dropShift] = shiftDropMatch
      console.log('Assigning to specific shift:', dropDate, dropShift) // Debug log
      handleAssignNurse(nurse, dropDate, dropShift as 'morning' | 'afternoon' | 'night')
      return
    }

    // Check if dropped on a calendar date (fallback to selected shift)
    const calendarDropMatch = overId.match(/^calendar-(\d{4}-\d{2}-\d{2})$/)
    if (calendarDropMatch) {
      const dropDate = calendarDropMatch[1]
      console.log('Assigning to calendar date with selected shift:', dropDate, selectedShift) // Debug log
      handleAssignNurse(nurse, dropDate, selectedShift)
      return
    }

    // Check if dropped on general date
    const generalDateMatch = overId.match(/^(\d{4}-\d{2}-\d{2})-general$/)
    if (generalDateMatch) {
      const dropDate = generalDateMatch[1]
      console.log('Assigning to general date with selected shift:', dropDate, selectedShift) // Debug log
      handleAssignNurse(nurse, dropDate, selectedShift)
      return
    }
  }

  const handlePublishSchedules = async () => {
    const draftSchedules = getDraftSchedulesForMonth()

    // Check if all schedules have enough nurses assigned
    const incompleteSchedules = draftSchedules.filter(schedule =>
      schedule.assigned_nurses.length < schedule.required_nurse
    )

    if (incompleteSchedules.length > 0) {
      showToast('warning', 'ตารางเวรยังไม่ครบ', `ยังมีตารางเวรที่ไม่ครบ ${incompleteSchedules.length} รายการ กรุณาจัดเวรให้ครบทุกกรอบก่อนประกาศ`)
      return
    }

    showConfirmDialog(
      'ประกาศตารางเวร',
      `คุณต้องการประกาศตารางเวรทั้งเดือนใช่หรือไม่?\n\nจะประกาศทั้งหมด ${draftSchedules.length} รายการ\n\nหลังจากประกาศแล้วจะไม่สามารถแก้ไขได้`,
      async () => {
        setConfirmDialog(prev => ({ ...prev, show: false }))
        setLoading(true)
        try {
          const profile = JSON.parse(localStorage.getItem('profile') || '{}')
          const scheduleIds = draftSchedules.map(s => s.schedules_id!).filter(id => id)

          const response = await fetch('/api/schedules/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scheduleIds,
              userId: profile.user_id
            })
          })

          if (response.ok) {
            await loadMonthlySchedules()
            showToast('success', 'ประกาศตารางเวรสำเร็จ!', 'ตารางเวรได้รับการประกาศแล้ว พยาบาลสามารถดูตารางเวรได้')
          } else {
            const data = await response.json()
            showToast('error', 'ไม่สามารถประกาศได้', data.error || 'เกิดข้อผิดพลาดในระบบ')
          }
        } catch (error) {
          console.error('Error publishing schedules:', error)
          showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้')
        }
        setLoading(false)
      },
      'warning',
      'ประกาศตารางเวร',
      'ยกเลิก'
    )
  }

  const getDraftSchedulesForMonth = () => {
    const monthSchedules = schedules.filter(s => {
      const scheduleDate = new Date(s.date)
      return scheduleDate.getMonth() === currentMonth.getMonth() &&
             scheduleDate.getFullYear() === currentMonth.getFullYear() &&
             s.status === 'draft'
    })
    return monthSchedules
  }

  const handleCreateMonthlySchedules = async () => {
    setLoading(true)
    try {
      const profile = JSON.parse(localStorage.getItem('profile') || '{}')
      const monthYear = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`


      const response = await fetch('/api/schedules/create-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthYear,
          departmentId: profile.department_id,
          createdBy: profile.user_id,
          shiftRequirements: requiredNurses
        })
      })

      if (response.ok) {
        const data = await response.json()
        await loadMonthlySchedules()
        setShowCreateDialog(false)
        showToast('success', 'สร้างตารางเวรสำเร็จ!', `สร้างตารางเวรแล้ว ${data.schedulesCreated} รายการ พร้อมสำหรับจัดเวรพยาบาล`)
      } else {
        const data = await response.json()
        showToast('error', 'ไม่สามารถสร้างตารางเวรได้', data.error || 'เกิดข้อผิดพลาดในระบบ')
      }
    } catch (error) {
      console.error('Error creating schedules:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้')
    }
    setLoading(false)
  }


  const handleUpdateSingleScheduleRequirement = async () => {
    if (!editingScheduleId) return

    setLoading(true)
    try {
      const profile = JSON.parse(localStorage.getItem('profile') || '{}')

      const response = await fetch('/api/schedules/update-single-requirement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scheduleId: editingScheduleId,
          requiredNurse: tempScheduleRequirement,
          userId: profile.user_id
        })
      })

      if (response.ok) {
        setEditingScheduleId(null)
        setTempScheduleRequirement(0)
        await loadMonthlySchedules()
        showToast('success', 'อัปเดตสำเร็จ!', 'ปรับจำนวนพยาบาลที่ต้องการในเวรนี้เรียบร้อยแล้ว')
      } else {
        const data = await response.json()
        showToast('error', 'ไม่สามารถอัปเดตได้', data.error || 'เกิดข้อผิดพลาดในระบบ')
      }
    } catch (error) {
      console.error('Error updating single schedule requirement:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้')
    }
    setLoading(false)
  }

  const handleStartEditSingleSchedule = (schedule: Schedule) => {
    setEditingScheduleId(schedule.schedules_id!)
    setTempScheduleRequirement(schedule.required_nurse)
  }

  const handleCancelEditSingleSchedule = () => {
    setEditingScheduleId(null)
    setTempScheduleRequirement(0)
  }

  const showToast = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    setToast({
      show: true,
      type,
      title,
      message
    })

    // Auto hide after 4 seconds
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }))
  }

  const handleRemoveNurseFromShift = async (nurse: Nurse) => {
    if (!nurse.assignment_id) {
      showToast('error', 'ข้อผิดพลาด', 'ไม่พบข้อมูลการจัดเวร')
      return
    }

    // Close the confirm dialog first
    setConfirmDialog(prev => ({ ...prev, show: false }))

    setLoading(true)
    try {
      const profile = JSON.parse(localStorage.getItem('profile') || '{}')

      const response = await fetch('/api/schedules/remove-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId: nurse.assignment_id,
          userId: profile.user_id
        })
      })

      if (response.ok) {
        await response.json() // Consume the response
        await loadMonthlySchedules() // Refresh the data
        showToast('success', 'ยกเลิกสำเร็จ!', `ยกเลิกการจัดเวรของ ${nurse.name} เรียบร้อยแล้ว`)
      } else {
        const data = await response.json()
        showToast('error', 'ไม่สามารถยกเลิกได้', data.error || 'เกิดข้อผิดพลาดในระบบ')
      }
    } catch (error) {
      console.error('Error removing nurse from shift:', error)
      showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้')
    }
    setLoading(false)
  }

  const showConfirmDialog = (
    title: string,
    message: string,
    onConfirm: () => void,
    type: 'danger' | 'warning' | 'info' = 'info',
    confirmText: string = 'ยืนยัน',
    cancelText: string = 'ยกเลิก'
  ) => {
    setConfirmDialog({
      show: true,
      title,
      message,
      onConfirm,
      onCancel: () => setConfirmDialog(prev => ({ ...prev, show: false })),
      confirmText,
      cancelText,
      type
    })
  }

  const handleDeleteDraftSchedules = async () => {
    const draftSchedules = getDraftSchedulesForMonth()

    if (draftSchedules.length === 0) {
      showToast('warning', 'ไม่มีข้อมูล', 'ไม่มีตารางเวรร่างในเดือนนี้')
      return
    }

    showConfirmDialog(
      'ยกเลิกตารางเวรร่าง',
      `คุณต้องการยกเลิกตารางเวรร่างทั้งหมดในเดือนนี้ใช่หรือไม่?\n\nจะลบไปทั้งหมด ${draftSchedules.length} รายการ\n\n⚠️ การกระทำนี้ไม่สามารถย้อนกลับได้`,
      async () => {
        setConfirmDialog(prev => ({ ...prev, show: false }))
        setLoading(true)
        try {
          const profile = JSON.parse(localStorage.getItem('profile') || '{}')
          const monthYear = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`

          const response = await fetch('/api/schedules/delete-drafts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              departmentId: profile.department_id,
              monthYear,
              userId: profile.user_id
            })
          })

          if (response.ok) {
            const data = await response.json()
            await loadMonthlySchedules()
            showToast('success', 'ยกเลิกการร่างสำเร็จ!', `ลบตารางเวรร่างไปทั้งหมด ${data.deletedSchedules} รายการ สามารถสร้างใหม่ได้`)
          } else {
            const data = await response.json()
            showToast('error', 'ไม่สามารถยกเลิกได้', data.error || 'เกิดข้อผิดพลาดในระบบ')
          }
        } catch (error) {
          console.error('Error deleting draft schedules:', error)
          showToast('error', 'เกิดข้อผิดพลาด', 'ไม่สามารถติดต่อกับเซิร์ฟเวอร์ได้')
        }
        setLoading(false)
      },
      'danger',
      'ยกเลิกตารางเวร',
      'ไม่ยกเลิก'
    )
  }

  const hasSchedulesForCurrentMonth = () => {
    return schedules.some(s => {
      const scheduleDate = new Date(s.date)
      return scheduleDate.getMonth() === currentMonth.getMonth() &&
             scheduleDate.getFullYear() === currentMonth.getFullYear()
    })
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-black">จัดตารางเวรพยาบาล</h1>
          <p className="text-black">
            แผนก: {departmentName || 'กำลังโหลด...'} |
            จัดการตารางเวรและมอบหมายพยาบาลเข้าเวร
          </p>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem('user')
            localStorage.removeItem('profile')
            router.push('/login')
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
        >
          ออกจากระบบ
        </button>
      </div>

      {/* Create Schedule Button */}
      {!hasSchedulesForCurrentMonth() && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                ยังไม่มีตารางเวรสำหรับเดือน {currentMonth.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}
              </h3>
              <p className="text-xs text-blue-600">
                สร้างตารางเวรใหม่สำหรับเดือนนี้
              </p>
            </div>
            <button
              onClick={() => setShowCreateDialog(true)}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              สร้างตารางเวร
            </button>
          </div>
        </div>
      )}

      {/* Draft Schedules Summary & Publish Button */}
      {getDraftSchedulesForMonth().length > 0 && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-orange-800">
                ตารางเวรร่าง: {getDraftSchedulesForMonth().length} รายการ
              </h3>
              <p className="text-xs text-orange-600">
                {(() => {
                  const draftSchedules = getDraftSchedulesForMonth()
                  const incompleteSchedules = draftSchedules.filter(schedule =>
                    schedule.assigned_nurses.length < schedule.required_nurse
                  )
                  const completeSchedules = draftSchedules.length - incompleteSchedules.length

                  if (incompleteSchedules.length === 0) {
                    return `✅ จัดเวรครบทั้งหมดแล้ว (${completeSchedules}/${draftSchedules.length}) - พร้อมประกาศ`
                  } else {
                    return `⚠️ จัดเวรแล้ว ${completeSchedules}/${draftSchedules.length} - ขาดอีก ${incompleteSchedules.length} รายการ`
                  }
                })()}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleDeleteDraftSchedules}
                disabled={loading}
                className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                {loading ? 'กำลังยกเลิก...' : 'ยกเลิกการร่าง'}
              </button>
              <button
                onClick={handlePublishSchedules}
                disabled={loading || getDraftSchedulesForMonth().some(schedule =>
                  schedule.assigned_nurses.length < schedule.required_nurse
                )}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'กำลังประกาศ...' : 'ประกาศตารางเวร'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`grid gap-6 ${
        // Show 3 columns when published schedule is selected
        selectedDate && selectedShift && (() => {
          const schedule = getScheduleForDate(new Date(selectedDate), selectedShift)
          return schedule && schedule.status === 'published'
        })()
          ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'
          : getDraftSchedulesForMonth().length > 0
            ? 'grid-cols-1 lg:grid-cols-3'
            : 'grid-cols-1'
      }`}>
        {/* Calendar Section */}
        <div className={
          selectedDate && selectedShift && (() => {
            const schedule = getScheduleForDate(new Date(selectedDate), selectedShift)
            return schedule && schedule.status === 'published'
          })()
            ? "xl:col-span-2"
            : getDraftSchedulesForMonth().length > 0
              ? "lg:col-span-2"
              : "lg:col-span-3"
        }>
          <div className="bg-white rounded-lg shadow p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded text-black"
              >
                ←
              </button>
              <h2 className="text-lg font-semibold text-black">
                {currentMonth.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}
              </h2>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded text-black"
              >
                →
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-sm">
              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                <div key={day} className="p-2 text-center font-medium text-black">
                  {day}
                </div>
              ))}

              {generateCalendar().map((date, index) => {
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                const isToday = date.toDateString() === new Date().toDateString()
                const dateStr = formatDateToString(date)
                const isSelected = selectedDate === dateStr

                return (
                  <DropZone
                    key={index}
                    date={dateStr}
                    shift="general"
                    className={`min-h-[80px] p-1 border cursor-pointer ${
                      isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 text-black border-gray-100'
                    } ${isToday ? 'ring-2 ring-blue-300' : ''} ${
                      isSelected ? 'bg-blue-50 ring-2 ring-blue-500' : ''
                    } border-dashed-0 border-solid`}
                  >
                    <div
                      className="h-full w-full"
                      onClick={() => setSelectedDate(dateStr)}
                      id={`calendar-${dateStr}`}
                    >
                      <div className="font-medium text-xs text-black">{date.getDate()}</div>

                      {/* Schedule indicators - only show for current month dates */}
                      {isCurrentMonth && (
                        <div className="space-y-1 mt-1">
                          {SHIFT_TYPES.map(shift => {
                            const schedule = getScheduleForDate(date, shift.value)

                          return (
                            <DropZone
                              key={shift.value}
                              date={dateStr}
                              shift={shift.value}
                              className="p-0.5 min-h-[35px] border-0 bg-transparent"
                            >
                              <div
                                className={`text-[10px] px-2 py-1.5 rounded cursor-pointer flex flex-col items-center justify-center min-h-[30px] ${
                                  // Check if this shift is currently selected
                                  selectedDate === dateStr && selectedShift === shift.value
                                    ? 'ring-2 ring-blue-500 '
                                    : ''
                                }${
                                  schedule
                                    ? schedule.status === 'draft'
                                      ? schedule.assigned_nurses.length >= schedule.required_nurse
                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'  // ครบแล้ว
                                        : 'bg-orange-100 text-orange-800 hover:bg-orange-200' // ยังไม่ครบ
                                      : shift.color  // published
                                    : 'bg-gray-100 text-black hover:bg-gray-200'  // ไม่มีตารางเวร
                                }`}
                                title={schedule ? `${shift.label}: ${schedule.assigned_nurses.length}/${schedule.required_nurse} (${schedule.status === 'draft' ? 'ร่าง' : 'ประกาศแล้ว'}) - คลิกเพื่อเลือกกะนี้` : `${shift.label}: ว่าง - คลิกเพื่อเลือกกะนี้`}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // Allow clicking on any schedule (draft or published) to view details
                                  setSelectedDate(dateStr)
                                  setSelectedShift(shift.value as 'morning' | 'afternoon' | 'night')
                                }}
                              >
                                <div className="text-center leading-tight">
                                  {shift.value === 'morning' ? 'เช้า' :
                                   shift.value === 'afternoon' ? 'บ่าย' : 'ดึก'}: {schedule ? `${schedule.assigned_nurses.length}/${schedule.required_nurse}` : `0/${requiredNurses[shift.value as keyof typeof requiredNurses]}`}
                                </div>
                                <div className="text-center mt-0.5">
                                  {schedule?.status === 'draft'
                                    ? schedule.assigned_nurses.length >= schedule.required_nurse ? '✅' : '📝'
                                    : schedule?.status === 'published' ? '✅' : ''
                                  }
                                </div>
                              </div>
                            </DropZone>
                          )
                        })}
                        </div>
                      )}
                    </div>
                  </DropZone>
                )
              })}
            </div>
          </div>
        </div>

        {/* Nurse Assignment Section - Only show when there are draft schedules */}
        {getDraftSchedulesForMonth().length > 0 && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-black mb-4">จัดเวรพยาบาล (ร่าง)</h3>

              {/* Selected Date */}
              {selectedDate && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    วันที่เลือก: {(() => {
                      const [year, month, day] = selectedDate.split('-')
                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                      return date.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })
                    })()}
                  </p>
                </div>
              )}

              {/* Shift Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-black mb-2">
                  เลือกกะ
                  {selectedDate && selectedShift && (
                    <span className="ml-2 text-xs text-blue-600 font-normal">
                      (คลิกที่ช่องกะในปฏิทินเพื่อเลือกอัตโนมัติ)
                    </span>
                  )}
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value as any)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-black"
                >
                  {SHIFT_TYPES.map(shift => (
                    <option key={shift.value} value={shift.value}>
                      {shift.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Schedule Requirement */}
              {selectedDate && selectedShift && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-blue-800">จำนวนพยาบาลที่ต้องการ</h4>
                    {(() => {
                      const schedule = getScheduleForDate(new Date(selectedDate), selectedShift)
                      if (schedule && schedule.status === 'draft' && editingScheduleId !== schedule.schedules_id) {
                        return (
                          <button
                            onClick={() => handleStartEditSingleSchedule(schedule)}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            แก้ไข
                          </button>
                        )
                      }
                      return null
                    })()}
                  </div>
                  {(() => {
                    const schedule = getScheduleForDate(new Date(selectedDate), selectedShift)
                    const isEditing = editingScheduleId === schedule?.schedules_id

                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-800">
                            {selectedShift === 'morning' ? 'เช้า' : selectedShift === 'afternoon' ? 'บ่าย' : 'ดึก'}:
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => {
                                if (isEditing) {
                                  setTempScheduleRequirement(Math.max(1, tempScheduleRequirement - 1))
                                }
                              }}
                              disabled={!isEditing}
                              className={`w-6 h-6 ${isEditing ? 'bg-blue-200 hover:bg-blue-300' : 'bg-gray-100 cursor-not-allowed'} text-blue-700 rounded text-xs`}
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs text-blue-800 font-medium">
                              {isEditing ? tempScheduleRequirement : (schedule?.required_nurse || requiredNurses[selectedShift])}
                            </span>
                            <button
                              onClick={() => {
                                if (isEditing) {
                                  setTempScheduleRequirement(Math.min(10, tempScheduleRequirement + 1))
                                }
                              }}
                              disabled={!isEditing}
                              className={`w-6 h-6 ${isEditing ? 'bg-blue-200 hover:bg-blue-300' : 'bg-gray-100 cursor-not-allowed'} text-blue-700 rounded text-xs`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        {isEditing && (
                          <>
                            <div className="flex space-x-2 mt-3">
                              <button
                                onClick={handleUpdateSingleScheduleRequirement}
                                disabled={loading}
                                className="flex-1 bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                              >
                                {loading ? 'กำลังอัปเดต...' : 'ยืนยัน'}
                              </button>
                              <button
                                onClick={handleCancelEditSingleSchedule}
                                disabled={loading}
                                className="flex-1 bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 disabled:opacity-50"
                              >
                                ยกเลิก
                              </button>
                            </div>
                            <div className="mt-2 p-2 bg-yellow-50 rounded text-xs text-yellow-800">
                              ⚠️ การเปลี่ยนแปลงจะมีผลกับเวรนี้เท่านั้น
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}


              {/* Available Nurses */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-black mb-2">พยาบาลที่ว่าง</h4>
                <SortableContext items={availableNurses.map(n => n.user_id)} strategy={verticalListSortingStrategy}>
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {availableNurses.map(nurse => (
                      <DraggableNurse
                        key={nurse.user_id}
                        nurse={nurse}
                        onAssign={() => {
                          console.log('Assign button clicked for:', nurse.name)
                          console.log('Selected date:', selectedDate)
                          console.log('Selected shift:', selectedShift)

                          if (!selectedDate) {
                            showToast('warning', 'ข้อมูลไม่ครบ', 'กรุณาเลือกวันที่ก่อนจัดเวร')
                            return
                          }
                          console.log('Calling handleAssignNurse...')
                          handleAssignNurse(nurse, selectedDate, selectedShift)
                        }}
                        isDragging={activeId === nurse.user_id}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>

              {/* Current Assignments for Selected Date */}
              {selectedDate && selectedShift && (
                <div>
                  <h4 className="text-sm font-medium text-black mb-3">
                    รายชื่อพยาบาลในกะ{selectedShift === 'morning' ? 'เช้า' : selectedShift === 'afternoon' ? 'บ่าย' : 'ดึก'}
                  </h4>
                  {(() => {
                    const schedule = getScheduleForDate(new Date(selectedDate), selectedShift)

                    if (!schedule) {
                      return (
                        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-sm">ยังไม่มีตารางเวรสำหรับกะนี้</p>
                        </div>
                      )
                    }

                    if (schedule.assigned_nurses.length === 0) {
                      return (
                        <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-sm">ยังไม่มีพยาบาลในกะนี้</p>
                          <p className="text-xs mt-1">ลากพยาบาลจากรายชื่อด้านบนมาวางในกะนี้</p>
                        </div>
                      )
                    }

                    return (
                      <div className="space-y-2">
                        {schedule.assigned_nurses.map((nurse, index) => (
                          <div key={nurse.user_id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-blue-700">{index + 1}</span>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-blue-900">{nurse.name}</p>
                                <p className="text-xs text-blue-600">{nurse.email}</p>
                              </div>
                            </div>
                            {schedule.status === 'draft' && (
                              <button
                                onClick={async () => {
                                  showConfirmDialog(
                                    'ยกเลิกการจัดเวร',
                                    `คุณต้องการยกเลิกการจัดเวรของ ${nurse.name} ใช่หรือไม่?`,
                                    async () => {
                                      await handleRemoveNurseFromShift(nurse)
                                    },
                                    'warning',
                                    'ใช่',
                                    'ไม่'
                                  )
                                }}
                                className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded"
                              >
                                ยกเลิก
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule Viewer Section - Show only for published schedules */}
        {selectedDate && selectedShift && (() => {
          const schedule = getScheduleForDate(new Date(selectedDate), selectedShift)
          return schedule && schedule.status === 'published'
        })() && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-black mb-4">รายละเอียดกะเวร</h3>

              {/* Selected Date and Shift Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-800 mb-1">
                  วันที่: {(() => {
                    const [year, month, day] = selectedDate.split('-')
                    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                    return date.toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  })()}
                </p>
                <p className="text-sm text-gray-800">
                  กะ: {selectedShift === 'morning' ? 'เช้า (06:00-14:00)' :
                       selectedShift === 'afternoon' ? 'บ่าย (14:00-22:00)' :
                       'ดึก (22:00-06:00)'}
                </p>
              </div>

              {(() => {
                const schedule = getScheduleForDate(new Date(selectedDate), selectedShift)

                return (
                  <div>
                    {/* Schedule Status */}
                    <div className="mb-4 p-3 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-800">สถานะ:</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                          ประกาศแล้ว
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">จำนวนที่ต้องการ:</span>
                        <span className="text-sm font-medium text-gray-800">{schedule?.required_nurse} คน</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">จำนวนที่จัดแล้ว:</span>
                        <span className="text-sm font-medium text-green-600">
                          {schedule?.assigned_nurses.length} คน
                        </span>
                      </div>
                    </div>

                    {/* Assigned Nurses List */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-800 mb-3">รายชื่อพยาบาลที่จัดเวร</h4>
                      {schedule?.assigned_nurses.length ? (
                        <div className="space-y-2">
                          {schedule.assigned_nurses.map((nurse, index) => (
                            <div key={nurse.user_id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-blue-700">{index + 1}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-blue-900">{nurse.name}</p>
                                  <p className="text-xs text-blue-600">{nurse.email}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-sm">ไม่มีพยาบาลในกะนี้</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

      </div>

      <DragOverlay>
        {draggedNurse ? (
          <div className="flex items-center justify-between p-2 border rounded bg-white shadow-lg opacity-90">
            <div>
              <p className="text-sm font-medium">{draggedNurse.name}</p>
              <p className="text-xs text-black">{draggedNurse.email}</p>
            </div>
          </div>
        ) : null}
      </DragOverlay>

      {/* Create Schedule Dialog */}
      {showCreateDialog && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xxs flex items-center justify-center"
          style={{zIndex: 9999}}
          onClick={() => setShowCreateDialog(false)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-black mb-4">
              สร้างตารางเวรประจำเดือน {currentMonth.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}
            </h3>

            {/* Required Nurses Configuration for Creation */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-black mb-3">จำนวนพยาบาลที่ต้องการแต่ละกะ</h4>
              <div className="space-y-3">
                {SHIFT_TYPES.map(shift => (
                  <div key={shift.value} className="flex items-center justify-between">
                    <span className="text-sm text-black">{shift.label}:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setRequiredNurses(prev => ({
                          ...prev,
                          [shift.value]: Math.max(1, prev[shift.value as keyof typeof prev] - 1)
                        }))}
                        className="w-8 h-8 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-black font-medium">
                        {requiredNurses[shift.value as keyof typeof requiredNurses]}
                      </span>
                      <button
                        onClick={() => setRequiredNurses(prev => ({
                          ...prev,
                          [shift.value]: Math.min(10, prev[shift.value as keyof typeof prev] + 1)
                        }))}
                        className="w-8 h-8 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-black">
                ระบบจะสร้างตารางเวรทั้งเดือน ({new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()} วัน × 3 กะ = {new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() * 3} รายการ)
              </p>
              <p className="text-xs text-gray-600 mt-1">
                สถานะ: ร่าง (Draft) - สามารถแก้ไขแต่ละเวรได้ภายหลัง
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateDialog(false)}
                disabled={loading}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreateMonthlySchedules}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'กำลังสร้าง...' : 'ยืนยันสร้าง'}
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
                : 'bg-yellow-50 border-yellow-500 text-yellow-800'
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
                      : 'text-yellow-500 hover:text-yellow-600'
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

      {/* Confirm Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center" style={{zIndex: 10000}}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {confirmDialog.type === 'danger' && (
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                )}
                {confirmDialog.type === 'warning' && (
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
                    <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                )}
                {confirmDialog.type === 'info' && (
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{confirmDialog.title}</h3>
                <div className="text-sm text-gray-500 whitespace-pre-line">{confirmDialog.message}</div>
              </div>
            </div>

            <div className="mt-6 flex space-x-3 justify-end">
              <button
                onClick={confirmDialog.onCancel}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${
                  confirmDialog.type === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmDialog.type === 'warning'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'กำลังดำเนินการ...' : confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </DndContext>
  )
}
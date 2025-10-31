'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Department {
  department_id: number
  department_name: string
}

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'nurse' as 'nurse' | 'head_nurse',
    departmentId: ''
  })
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoleChange = (role: 'nurse' | 'head_nurse') => {
    setFormData(prev => ({
      ...prev,
      role
    }))
  }

  useEffect(() => {
    // Load departments on component mount
    const loadDepartments = async () => {
      try {
        console.log('Fetching departments...')
        const response = await fetch('/api/departments')
        console.log('Response status:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('Departments data:', data)
          setDepartments(data.departments || [])
        } else {
          const errorData = await response.json()
          console.error('Error response:', errorData)
        }
      } catch (error) {
        console.error('Error loading departments:', error)
      }
    }

    loadDepartments()
  }, [])

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล')
      return false
    }
    if (!formData.email.trim()) {
      setError('กรุณากรอกอีเมล')
      return false
    }
    if (!formData.password) {
      setError('กรุณากรอกรหัสผ่าน')
      return false
    }
    if (formData.password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return false
    }
    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      // Call API route to handle registration with admin privileges
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          phone: formData.phone || null,
          departmentId: formData.departmentId || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการลงทะเบียนผู้ใช้')
        return
      }

      setSuccess(data.message)

      // Clear form
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'nurse',
        departmentId: ''
      })

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err) {
      console.error('Registration error:', err)
      setError('เกิดข้อผิดพลาดในการลงทะเบียนผู้ใช้ใหม่')
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'nurse':
        return 'พยาบาลทั่วไป'
      case 'head_nurse':
        return 'หัวหน้าพยาบาล'
      default:
        return role
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ลงทะเบียนผู้ใช้งานใหม่
          </h1>
          <p className="text-gray-600">สร้างบัญชีใหม่สำหรับระบบจัดการตารางเวรพยาบาล</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อ-นามสกุล *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
              placeholder="กรอกชื่อ-นามสกุลของคุณ"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              อีเมล *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
              placeholder="กรอกอีเมลของคุณ"
            />
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
              placeholder="กรอกเบอร์โทรศัพท์ของคุณ"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              เลือกบทบาท *
            </label>
            <div className="grid grid-cols-1 gap-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="nurse"
                  checked={formData.role === 'nurse'}
                  onChange={() => handleRoleChange('nurse')}
                  className="mr-3 text-green-600"
                />
                <div>
                  <div className="font-medium text-gray-900">พยาบาลทั่วไป</div>
                  <div className="text-sm text-gray-500">ดูตารางเวร, ขอแลกเวร, ขอลา</div>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="role"
                  value="head_nurse"
                  checked={formData.role === 'head_nurse'}
                  onChange={() => handleRoleChange('head_nurse')}
                  className="mr-3 text-green-600"
                />
                <div>
                  <div className="font-medium text-gray-900">หัวหน้าพยาบาล</div>
                  <div className="text-sm text-gray-500">จัดตารางเวร, อนุมัติคำขอ</div>
                </div>
              </label>

            </div>
          </div>

          {/* Department Selection */}
          <div>
            <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-2">
              แผนกที่สังกัด
            </label>
            <select
              id="departmentId"
              name="departmentId"
              value={formData.departmentId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black bg-white"
            >
              <option value="">-- เลือกแผนก --</option>
              {departments.map((dept) => (
                <option key={dept.department_id} value={dept.department_id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              รหัสผ่าน *
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
              placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              ยืนยันรหัสผ่าน *
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-black"
              placeholder="กรอกรหัสผ่านอีกครั้ง"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md text-sm">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outlFne-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'กำลังสมัครลงทะเบียนผู้ใช้...' : 'ลงทะเบียนผู้ใช้'}
          </button>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            มีบัญชีอยู่แล้ว?{' '}
            <Link href="/login" className="text-green-600 hover:text-green-700 font-medium">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
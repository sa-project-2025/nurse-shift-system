'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

// SVG Icons
const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ArrowsRightLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
  </svg>
)

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const ChartBarIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const Bars3Icon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
)

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const ArrowRightOnRectangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
)

const UserCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

const navigation = [
  {
    name: 'ตารางเวรของฉัน',
    href: '/dashboard/nurse/my-schedule',
    icon: CalendarIcon,
  },
  {
    name: 'ขอแลกเวร',
    href: '/dashboard/nurse/shift-exchange',
    icon: ArrowsRightLeftIcon,
  },
  {
    name: 'ขอลางาน',
    href: '/dashboard/nurse/leave-request',
    icon: DocumentTextIcon,
  },
  {
    name: 'รายงานเวรของฉัน',
    href: '/dashboard/nurse/my-reports',
    icon: ChartBarIcon,
  },
  {
    name: 'โปรไฟล์ของฉัน',
    href: '/dashboard/nurse/profile',
    icon: UserCircleIcon,
  },
]

export default function NurseLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<{user_id?: number, name?: string, email?: string, pic_profile?: string | null}>({})
  const [incomingRequestsCount, setIncomingRequestsCount] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Load profile data on client side only
    if (typeof window !== 'undefined') {
      const storedProfile = localStorage.getItem('profile')
      if (storedProfile) {
        setProfile(JSON.parse(storedProfile))
      }
    }
  }, [])

  useEffect(() => {
    // Load incoming requests count
    const loadIncomingRequestsCount = async () => {
      if (!profile.user_id) return

      try {
        const response = await fetch('/api/nurse/shift-exchange/incoming-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: profile.user_id })
        })

        if (response.ok) {
          const data = await response.json()
          setIncomingRequestsCount(data.requests?.length || 0)
        }
      } catch (error) {
        console.error('Error loading incoming requests count:', error)
      }
    }

    loadIncomingRequestsCount()

    // Refresh count every 30 seconds
    const interval = setInterval(loadIncomingRequestsCount, 30000)
    return () => clearInterval(interval)
  }, [profile.user_id])

  const handleSignOut = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('profile')
    router.push('/login')
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile menu */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />

        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-lg font-semibold text-gray-900">พยาบาล</h1>
            </div>
            {/* User info - mobile */}
            <div className="mt-4 px-4 py-3 bg-gray-50 mx-4 rounded-lg flex items-center gap-3">
              {profile.pic_profile ? (
                <img src={profile.pic_profile} alt="profile" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 font-semibold text-sm">{profile.name?.charAt(0) || '?'}</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{profile.name || 'Loading...'}</p>
                <p className="text-xs text-gray-500 truncate">{profile.email || ''}</p>
              </div>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const showBadge = item.href === '/dashboard/nurse/shift-exchange' && incomingRequestsCount > 0
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-green-100 text-green-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
                      } mr-3 flex-shrink-0 h-6 w-6`}
                    />
                    {item.name}
                    {showBadge && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                        {incomingRequestsCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">พยาบาล</h1>
              </div>

              {/* User info */}
              <div className="mt-4 px-4 py-3 bg-gray-50 mx-4 rounded-lg flex items-center gap-3">
                {profile.pic_profile ? (
                  <img src={profile.pic_profile} alt="profile" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-700 font-semibold text-sm">{profile.name?.charAt(0) || '?'}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{profile.name || 'Loading...'}</p>
                  <p className="text-xs text-gray-500 truncate">{profile.email || ''}</p>
                </div>
              </div>

              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  const showBadge = item.href === '/dashboard/nurse/shift-exchange' && incomingRequestsCount > 0
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-green-100 text-green-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
                        } mr-3 flex-shrink-0 h-6 w-6`}
                      />
                      {item.name}
                      {showBadge && (
                        <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                          {incomingRequestsCount}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </nav>

              {/* Sign out button */}
              <div className="px-4 py-4 border-t border-gray-200">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center px-2 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900"
                >
                  <ArrowRightOnRectangleIcon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400" />
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
        </div>

        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  )
}

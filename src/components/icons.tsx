// Shared SVG icon components — replaces all emoji throughout the app

interface IconProps {
  className?: string
}

// ☀️ Afternoon shift — full sun with 8 rays
export const SunIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="5" fill="#FCD34D" />
    <line x1="12" y1="2" x2="12" y2="5" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="19" x2="12" y2="22" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="12" x2="5" y2="12" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <line x1="19" y1="12" x2="22" y2="12" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <line x1="4.22" y1="19.78" x2="6.34" y2="17.66" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <line x1="17.66" y1="6.34" x2="19.78" y2="4.22" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// 🌅 Morning shift — sunrise on horizon
export const SunriseIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <line x1="2" y1="18" x2="22" y2="18" stroke="#FB923C" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 18 A6 6 0 0 1 18 18" fill="#FCD34D" />
    <line x1="12" y1="4" x2="12" y2="7" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
    <line x1="4.5" y1="9.5" x2="6.5" y2="11" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
    <line x1="19.5" y1="9.5" x2="17.5" y2="11" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
    <line x1="2.5" y1="14.5" x2="5" y2="14.5" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
    <line x1="21.5" y1="14.5" x2="19" y2="14.5" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

// 🌙 Night shift — crescent moon with stars
export const MoonIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#818CF8" stroke="#6366F1" strokeWidth="1" />
    <circle cx="18.5" cy="4.5" r="0.9" fill="#E0E7FF" />
    <circle cx="20.5" cy="8.5" r="0.7" fill="#E0E7FF" />
    <circle cx="15.5" cy="2.5" r="0.6" fill="#E0E7FF" />
  </svg>
)

// 🏖️ Day off / vacation — beach umbrella
export const BeachIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3 Q18 5 19 12 Q14.5 9.5 12 12 Q9.5 9.5 5 12 Q6 5 12 3Z" fill="#FB923C" stroke="#EA580C" strokeWidth="0.8" />
    <line x1="12" y1="12" x2="14.5" y2="20" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="21" x2="22" y2="21" stroke="#FCD34D" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M4 18 Q6 16.5 8 18 Q10 19.5 12 18 Q14 16.5 16 18 Q18 19.5 20 18" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" fill="none" />
  </svg>
)

// 🤒 Sick leave — red medical cross
export const SickIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9.5" y="3" width="5" height="18" rx="2" fill="#FCA5A5" />
    <rect x="3" y="9.5" width="18" height="5" rx="2" fill="#FCA5A5" />
    <rect x="9.5" y="9.5" width="5" height="5" fill="#F87171" />
  </svg>
)

// 📋 Clipboard — personal leave / card view
export const ClipboardIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="4" width="14" height="17" rx="2" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" />
    <path d="M9 4 C9 2.5 10 2 12 2 C14 2 15 2.5 15 4" stroke="#3B82F6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <rect x="9" y="3.5" width="6" height="2" rx="1" fill="#3B82F6" />
    <line x1="8" y1="11" x2="16" y2="11" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="14" x2="16" y2="14" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="8" y1="17" x2="13" y2="17" stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// 📝 Note — other leave / document
export const NoteIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="3" width="12" height="16" rx="2" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
    <line x1="7" y1="8" x2="13" y2="8" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="7" y1="11" x2="13" y2="11" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="7" y1="14" x2="11" y2="14" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15.5 15 L20 10.5 L21.5 12 L17 16.5 Z" fill="#78716C" />
    <path d="M14.5 16.5 L15.5 15 L17 16.5 L16 17.5 Z" fill="#44403C" />
  </svg>
)

// ✅ Approve / success — green circle checkmark
export const CheckCircleIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#22C55E" />
    <path d="M7 12 L10.5 15.5 L17 8.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ❌ Reject / error — red circle X
export const XCircleIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#EF4444" />
    <path d="M8.5 8.5 L15.5 15.5 M15.5 8.5 L8.5 15.5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

// ⚠️ Warning — amber triangle with exclamation
export const WarningIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3 L22 21 L2 21 Z" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round" />
    <line x1="12" y1="9.5" x2="12" y2="15" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="17.5" r="1.2" fill="#92400E" />
  </svg>
)

// 📅 Calendar — schedule/calendar view
export const CalendarIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" fill="#EFF6FF" stroke="#3B82F6" strokeWidth="1.5" />
    <line x1="3" y1="9" x2="21" y2="9" stroke="#3B82F6" strokeWidth="1.5" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
    <line x1="16" y1="2" x2="16" y2="6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
    <circle cx="8" cy="13" r="1.1" fill="#3B82F6" />
    <circle cx="12" cy="13" r="1.1" fill="#3B82F6" />
    <circle cx="16" cy="13" r="1.1" fill="#3B82F6" />
    <circle cx="8" cy="17.5" r="1.1" fill="#3B82F6" />
    <circle cx="12" cy="17.5" r="1.1" fill="#3B82F6" />
  </svg>
)

// 📊 Chart — bar chart / table view
export const ChartBarIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="14" width="4" height="7" rx="1" fill="#A5B4FC" />
    <rect x="9" y="9" width="4" height="12" rx="1" fill="#818CF8" />
    <rect x="15" y="5" width="4" height="16" rx="1" fill="#6366F1" />
    <line x1="2" y1="21.5" x2="22" y2="21.5" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// ⚡ Lightning — over/near limit warning
export const LightningIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2 L4 14 H11 L11 22 L20 10 H13 Z" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1" strokeLinejoin="round" />
  </svg>
)

// ✓ Simple check — submitted / done
export const CheckIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12 L10 17 L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// ✏️ Pen — custom text input
export const PenIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" fill="#D1D5DB" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

// 📥 Download — export PDF
export const DownloadIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
)

// ⏳ Clock — pending / waiting
export const ClockIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#FEF9C3" stroke="#EAB308" strokeWidth="1.5" />
    <polyline points="12 6 12 12 16 14" stroke="#CA8A04" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
)

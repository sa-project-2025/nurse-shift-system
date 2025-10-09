# 🏥 Nurse Shift Management System

ระบบจัดการตารางเวรพยาบาล - A comprehensive shift scheduling system for nurses and head nurses.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [User Roles](#user-roles)
- [Key Features by Role](#key-features-by-role)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Documentation](#documentation)

## 🎯 Overview

ระบบจัดการตารางเวรพยาบาล (Nurse Shift Management System) เป็นระบบที่ออกแบบมาเพื่อช่วยให้การบริหารจัดการตารางเวรในโรงพยาบาลเป็นไปอย่างมีประสิทธิภาพ รองรับการทำงานของพยาบาลและหัวหน้าพยาบาลในการจัดการเวร การแลกเวร การขอลางาน และการรายงานการทำงาน

## ✨ Features

### For Nurses (พยาบาล)
- 📅 **ดูตารางเวร** - ดูตารางเวรประจำเดือนของตนเอง
- 🔄 **ขอแลกเวร** - ส่งคำขอแลกเวรกับพยาบาลคนอื่น
- ✅ **อนุมัติ/ปฏิเสธคำขอแลกเวร** - ตอบรับคำขอแลกเวรจากเพื่อน
- 🏖️ **ขอลางาน** - ส่งคำขอลางานพร้อมเหตุผล
- 📊 **บันทึกรายงานการทำงาน** - บันทึกวันทำงาน ชั่วโมง และกะต่างๆ

### For Head Nurses (หัวหน้าพยาบาล)
- 🗓️ **จัดตารางเวร** - สร้างและจัดการตารางเวรประจำเดือน
- 👥 **จัดสรรพยาบาล** - มอบหมายพยาบาลเข้ากะต่างๆ
- ✅ **อนุมัติคำขอลางาน** - อนุมัติ/ปฏิเสธคำขอลางานของพยาบาล
- 📈 **ดูรายงานพยาบาล** - ตรวจสอบสถิติการทำงานของพยาบาลทั้งหมดในแผนก

## 🛠️ Tech Stack

### Core Framework
- **Next.js 15.5.3** - React framework with App Router
- **React 19.1.0** - UI library
- **TypeScript 5** - Type-safe JavaScript

### Styling
- **Tailwind CSS v4** - Utility-first CSS framework
- **PostCSS** - CSS processing

### Database & Backend
- **Supabase** - Backend as a Service (PostgreSQL database)
  - `@supabase/supabase-js` - Supabase client
  - `@supabase/ssr` - Server-side rendering support

### UI Components & Interactions
- **@dnd-kit** - Drag and drop functionality
  - `@dnd-kit/core` - Core functionality
  - `@dnd-kit/sortable` - Sortable lists
  - `@dnd-kit/utilities` - Utilities
- **@heroicons/react** - Icon library

### Development Tools
- **Turbopack** - Fast bundler (Next.js built-in)
- **ESLint** - Code linting
- **TypeScript** - Type checking

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- npm/yarn/pnpm/bun
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd nurse-shift-system
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
nurse-shift-system/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/             # Authentication APIs
│   │   │   ├── nurse/            # Nurse-specific APIs
│   │   │   │   ├── shift-exchange/
│   │   │   │   ├── leave-request/
│   │   │   │   ├── my-schedule/
│   │   │   │   └── work-report/
│   │   │   ├── head-nurse/       # Head Nurse APIs
│   │   │   │   ├── schedule-management/
│   │   │   │   ├── leave-request/
│   │   │   │   └── nurse-reports/
│   │   │   └── departments/      # Department APIs
│   │   ├── dashboard/            # Dashboard pages
│   │   │   ├── nurse/            # Nurse dashboard
│   │   │   │   ├── my-schedule/
│   │   │   │   ├── shift-exchange/
│   │   │   │   ├── leave-request/
│   │   │   │   └── work-report/
│   │   │   └── head-nurse/       # Head Nurse dashboard
│   │   │       ├── schedule-management/
│   │   │       ├── leave-approvals/
│   │   │       └── nurse-reports/
│   │   ├── login/                # Login page
│   │   ├── register/             # Registration page
│   │   └── layout.tsx            # Root layout
│   └── lib/                      # Shared utilities
│       ├── supabase-admin.ts     # Supabase admin client
│       └── supabase.ts           # Supabase client
├── markdown/                     # Documentation
│   ├── usecase*.md              # Use case documents
│   ├── seq-diagram*.md          # Sequence diagrams
│   └── DB-schema.md             # Database schema
├── public/                       # Static files
├── package.json                 # Dependencies
├── tsconfig.json               # TypeScript config
├── tailwind.config.js          # Tailwind config
└── next.config.ts              # Next.js config
```

## 🗄️ Database Schema

### Main Tables

#### users
```sql
user_id (PK)
name
email
password
role (nurse | head_nurse )
phone
department_id (FK)
```

#### departments
```sql
department_id (PK)
department_name
head_nurse_id (FK)
```

#### schedules
```sql
schedules_id (PK)
date
shift_type (morning | afternoon | night)
created_by (FK)
department_id (FK)
status (draft | published)
published_date
required_nurse
```

#### shift_assignments
```sql
assignment_id (PK)
user_id (FK)
schedules_id (FK)
assigned_by (FK)
assigned_date
```

#### shift_exchange_requests
```sql
exchange_id (PK)
requester_id (FK)
target_user_id (FK)
original_schedule_id (FK)
target_schedule_id (FK)
request_date
reason
status (pending | approved | rejected)
```

#### leave_requests
```sql
leave_id (PK)
user_id (FK)
start_date
end_date
leave_days
leave_type (sick | personal | vacation | other)
reason
reason_reject
request_date
status (pending | approved | rejected)
approved_by (FK)
response_date
```

#### work_reports
```sql
report_id (PK)
user_id (FK)
report_month
work_days_count
shifts_count
total_hours
morning_shifts
afternoon_shifts
night_shifts
rest_days
submitted_at
```

See [DB-schema.md](./markdown/DB-schema.md) for complete schema.

## 👥 User Roles

### 1. Nurse (พยาบาล)
- View personal schedule
- Request shift exchanges
- Approve/reject shift exchange requests
- Request leave
- Submit work reports

### 2. Head Nurse (หัวหน้าพยาบาล)
- Create and manage schedules
- Assign nurses to shifts
- Approve/reject leave requests
- View department reports


## 🎯 Key Features by Role

### Nurse Dashboard
1. **ตารางเวรของฉัน** - View monthly schedule
2. **ขอแลกเวร** - 4-step shift exchange wizard
3. **ขอลางาน** - Leave request with affected shifts preview
4. **รายงานเวรของฉัน** - Monthly work report submission

### Head Nurse Dashboard
1. **จัดตารางเวร** - Drag-and-drop schedule management
2. **อนุมัติคำขอลางาน** - Leave request approval with notification badge
3. **รายงานพยาบาล** - Department statistics and PDF export

## 📚 API Documentation

### Authentication APIs
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Nurse APIs
- `POST /api/nurse/my-schedule` - Get personal schedule
- `POST /api/nurse/shift-exchange/create` - Create shift exchange request
- `POST /api/nurse/shift-exchange/respond` - Respond to exchange request
- `POST /api/nurse/leave-request/create` - Create leave request
- `POST /api/nurse/work-report/submit` - Submit work report

### Head Nurse APIs
- `POST /api/head-nurse/schedule-management/create` - Create schedule
- `POST /api/head-nurse/schedule-management/publish` - Publish schedule
- `POST /api/head-nurse/leave-request/respond` - Approve/reject leave
- `POST /api/head-nurse/nurse-reports` - Get department reports

See individual use cases in [markdown/](./markdown/) folder for detailed API specifications.

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 💻 Development

### Available Scripts

```bash
# Development server (with Turbopack)
npm run dev

# Build for production (with Turbopack)
npm run build

# Start production server
npm start

# Run linter
npm run lint
```


---

Built with ❤️ using Next.js 15, React 19, and Supabase

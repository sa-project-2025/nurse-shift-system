# Nurse Scheduling System - Project Context

## Project Overview
ระบบจัดการตารางเวรสำหรับพยาบาล รองรับการทำงานเป็นกะ (เช้า-บ่าย-ดึก) มีความยืดหยุ่นในการจัดเวร และอำนวยความสะดวกทั้งพยาบาลและหัวหน้าพยาบาล

## Tech Stack
- **Frontend**:  Next.js, React, TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Database Schema (Supabase PostgreSQL)

### 1. **users** table
```sql
- user_id: SERIAL PRIMARY KEY -- รหัสผู้ใช้
- name: VARCHAR(255) -- ชื่อ-นามสกุล
- email: VARCHAR(255) UNIQUE -- อีเมล (ใช้ login)
- password : VARCHAR(255) --รหัส (ใช้ login)
- role: VARCHAR(100) -- บทบาท (nurse/head_nurse)
- phone: VARCHAR(50) -- เบอร์โทร
- pic_profile: VARCHAR(255) -- URL รูปโปรไฟล์
- department_id: INT FK -> departments -- แผนกที่สังกัด
```

### 2. **departments** table
```sql
- department_id: SERIAL PRIMARY KEY -- รหัสแผนก
- department_name: VARCHAR(255) -- ชื่อแผนก
- head_nurse_id: INT FK -> users -- รหัสหัวหน้าพยาบาล
```

### 3. **schedules** table
```sql
- schedules_id: SERIAL PRIMARY KEY -- รหัสตารางเวร
- date: DATE -- วันที่
- shift_type: VARCHAR(50) -- ประเภทกะ (morning/afternoon/night)
- created_by: INT FK -> users -- ผู้สร้างตาราง
- department_id: INT FK -> departments -- แผนก
- status: VARCHAR(50) -- สถานะ (draft/published)
- published_date: TIMESTAMP -- วันที่เผยแพร่
- required_nurse: INT -- จำนวนพยาบาลที่ต้องการ
```

### 4. **shift_assignments** table
```sql
- assignment_id: SERIAL PRIMARY KEY -- รหัสการมอบหมาย
- user_id: INT FK -> users -- พยาบาลที่ได้รับมอบหมาย
- schedules_id: INT FK -> schedules -- ตารางเวร
- assigned_by: INT FK -> users -- ผู้มอบหมาย
- assigned_date: DATE -- วันที่มอบหมาย
```

### 5. **shift_exchange_requests** table
```sql
- exchange_id: SERIAL PRIMARY KEY -- รหัสคำขอแลกเวร
- requester_id: INT FK -> users -- ผู้ขอแลก
- target_user_id: INT FK -> users -- ผู้ที่ขอแลกด้วย
- original_schedule_id: INT FK -> schedules -- เวรเดิม
- target_schedule_id: INT FK -> schedules -- เวรที่ต้องการแลก
- request_date: DATE -- วันที่ขอ
- reason: TEXT -- เหตุผล
- status: VARCHAR(50) -- สถานะ (pending/approved/rejected)
```

### 6. **leave_requests** table
```sql
- leave_id: SERIAL PRIMARY KEY -- รหัสคำขอลา
- user_id: INT FK -> users -- ผู้ขอลา
- start_date: DATE -- วันที่เริ่มลา
- end_date: DATE -- วันที่สิ้นสุดลา
- leave_type: VARCHAR(100) -- ประเภทการลา (sick/personal/vacation)
- reason: TEXT -- เหตุผล
- request_date: DATE -- วันที่ขอลา
- status: VARCHAR(50) -- สถานะ (pending/approved/rejected)
```

### 7. **notifications** table
```sql
- notification_id: SERIAL PRIMARY KEY -- รหัสการแจ้งเตือน
- user_id: INT FK -> users -- ผู้รับการแจ้งเตือน
- title: VARCHAR(255) -- หัวข้อ
- action_type: VARCHAR(100) -- ประเภทการแจ้งเตือน
- description: TEXT -- รายละเอียด
- related_id: INT -- รหัสอ้างอิง (เช่น exchange_id, leave_id)
- related_table: VARCHAR(100) -- ตารางอ้างอิง
- is_read: BOOLEAN DEFAULT FALSE -- สถานะการอ่าน
- create_date: TIMESTAMP -- วันที่สร้าง
```

### 8. **work_reports** table
```sql
- report_id: SERIAL PRIMARY KEY -- รหัสรายงาน
- user_id: INT FK -> users -- พยาบาล
- report_month: DATE -- เดือนที่รายงาน
- work_days_count: INT -- จำนวนวันทำงาน
- shifts_count: INT -- จำนวนกะ
- total_hours: INT -- ชั่วโมงรวม
- submitted_at: TIMESTAMP -- วันที่สร้างรายงาน
```

## Core Features Implementation

### 1. การจัดการตารางเวร (Schedule Management)
**สิทธิ์**: หัวหน้าพยาบาล
- สร้างตารางเวรรายเดือน
- กำหนดพยาบาลเข้าเวรแต่ละกะ (เช้า/บ่าย/ดึก)
- แก้ไขตารางเวรก่อน published
- เผยแพร่ตารางเวรให้พยาบาลเห็น

### 2. การขอแลกเวร/ลางาน (Shift Exchange & Leave)
**สิทธิ์**: พยาบาลทั่วไป
- ส่งคำขอแลกเวรกับเพื่อนร่วมงาน
- ตอบรับ/ปฏิเสธคำขอแลกเวร
- ส่งคำขอลางาน
- ติดตามสถานะคำขอ

### 3. การแจ้งเตือน (Notifications)
**ทุกบทบาท**:
- แจ้งเตือนตารางเวรใหม่
- แจ้งเตือนคำขอแลกเวร
- แจ้งเตือนการอนุมัติ/ปฏิเสธ
- แจ้งเตือนการเปลี่ยนแปลงตาราง

### 4. การแสดงผล (Display Views)
**พยาบาลทั่วไป**:
- ดูตารางเวรส่วนตัว (รายวัน/สัปดาห์/เดือน)
- ดูตารางเวรรวมของแผนก
- ดูรายงานการทำงานของตนเอง

**หัวหน้าพยาบาล**:
- ดูตารางเวรทั้งหมด
- ดูรายงานการทำงานของทุกคน
- Dashboard สรุปภาพรวม

### 5. รายงาน (Reports)
- สรุปชั่วโมงทำงานรายเดือน
- สรุปจำนวนกะที่ทำ
- สรุปวันลา
- ประวัติการแลกเวร

## User Roles & Permissions

### 1. **พยาบาลทั่วไป (nurse)**
- ดูตารางเวรของตนเองและแผนก
- ขอแลกเวร/ลางาน
- ดูรายงานของตนเอง
- รับการแจ้งเตือน

### 2. **หัวหน้าพยาบาล (head_nurse)**
- ทุกอย่างที่พยาบาลทำได้ +
- สร้าง/แก้ไขตารางเวร
- อนุมัติ/ปฏิเสธคำขอลา
- ดูรายงานของทุกคนในแผนก
- จัดการพยาบาลในแผนก

### 3. **ผู้ดูแลระบบ (admin)**
- จัดการผู้ใช้ทั้งหมด
- จัดการแผนก
- ดูรายงานทุกแผนก
- ตั้งค่าระบบ

## Business Rules

1. **การจัดเวร**:
   - แต่ละกะต้องมีพยาบาลตามจำนวนที่กำหนด
   - พยาบาลทำงานไม่เกิน 2 กะติดต่อกัน
   - ต้องมีวันหยุดอย่างน้อย 8 วัน/เดือน

2. **การแลกเวร**:
   - แลกได้เฉพาะในแผนกเดียวกัน
   - ต้องขอล่วงหน้าอย่างน้อย 2 วัน
   - ต้องได้รับการยินยอมจากอีกฝ่าย

3. **การลา**:
   - ลาป่วย: ไม่จำกัด (แต่ต้องมีใบรับรองแพทย์)
   - ลากิจ: 10 วัน/ปี
   - ลาพักผ่อน: 15 วัน/ปี

## API Endpoints Structure (Supabase)

```javascript
// Authentication
supabase.auth.signIn()
supabase.auth.signOut()

// Users
supabase.from('users').select()
supabase.from('users').update()

// Schedules
supabase.from('schedules').select()
supabase.from('schedules').insert()
supabase.from('schedules').update()

// Shift Assignments
supabase.from('shift_assignments').select()
supabase.from('shift_assignments').insert()

// Exchange Requests
supabase.from('shift_exchange_requests').select()
supabase.from('shift_exchange_requests').insert()
supabase.from('shift_exchange_requests').update()

// Leave Requests
supabase.from('leave_requests').select()
supabase.from('leave_requests').insert()

// Notifications
supabase.from('notifications').select()
supabase.from('notifications').update()

// Reports
supabase.from('work_reports').select()
```

## Row Level Security (RLS) Policies

```sql
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = user_id);

-- Head nurses can manage their department
CREATE POLICY "Head nurse can manage department schedules" ON schedules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.role = 'head_nurse'
    AND users.department_id = schedules.department_id
  )
);

-- Nurses can view their department schedules
CREATE POLICY "Nurses can view department schedules" ON schedules
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.user_id = auth.uid() 
    AND users.department_id = schedules.department_id
  )
);
```

## Example Prompts for Claude Code

### 1. สร้างหน้า Dashboard
```
"สร้างหน้า Dashboard สำหรับหัวหน้าพยาบาลที่แสดง:
- จำนวนพยาบาลในแผนก
- ตารางเวรวันนี้
- คำขอแลกเวร/ลาที่รอการอนุมัติ
- กราฟสรุปชั่วโมงทำงานของเดือนนี้
ใช้ React + Tailwind CSS + Supabase client"
```

### 2. สร้างฟอร์มจัดตารางเวร
```
"สร้างฟอร์มจัดตารางเวรที่:
- เลือกวันที่และกะ (เช้า/บ่าย/ดึก)
- แสดงรายชื่อพยาบาลที่ว่าง
- drag & drop เพื่อจัดคนเข้าเวร
- validate ไม่ให้จัดคนทำงานเกิน 2 กะติดกัน
- บันทึกลง Supabase"
```

### 3. ระบบแจ้งเตือน
```
"สร้างระบบแจ้งเตือนแบบ real-time ที่:
- ใช้ Supabase Realtime subscription
- แสดง notification badge
- มี dropdown แสดงรายการแจ้งเตือน
- mark as read เมื่อคลิก
- แยกประเภทการแจ้งเตือนด้วยสีและ icon"
```


## Testing Scenarios

1. **สร้างตารางเวร**: หัวหน้าพยาบาลสร้างตารางเดือนหน้า
2. **ขอแลกเวร**: พยาบาล A ขอแลกกับ B, B ตอบรับ
3. **ขอลา**: พยาบาลขอลาพักผ่อน 3 วัน
4. **Conflict**: ระบบป้องกันการจัดเวรซ้ำซ้อน
5. **Permission**: พยาบาลไม่สามารถแก้ไขตารางเวรได้
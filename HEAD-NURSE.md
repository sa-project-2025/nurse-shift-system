สร้างระบบจัดการตารางเวรสำหรับหัวหน้าพยาบาล (Head Nurse Dashboard) ด้วย Next.js 14, TypeScript, Tailwind CSS และ Supabase

Database Schema:
- users (user_id, name, email, password, role, phone, pic_profile, department_id)
- departments (department_id, department_name, head_nurse_id)
- schedules (schedules_id, date, shift_type[morning/afternoon/night], created_by, department_id, status[draft/published], published_date, required_nurse)
- shift_assignments (assignment_id, user_id, schedules_id, assigned_by, assigned_date)
- shift_exchange_requests (exchange_id, requester_id, target_user_id, original_schedule_id, target_schedule_id, request_date, reason, status)
- leave_requests (leave_id, user_id, start_date, end_date, leave_type, reason, request_date, status)
- notifications (notification_id, user_id, title, action_type, description, related_id, related_table, is_read, create_date)


ใช้ Supabase client สำหรับ authentication และ database operations
ใช้ React hooks และ component-based architecture
ใช้ Tailwind CSS สำหรับ responsive design
เพิ่ม loading states และ error handling

1. หน้าจัดตารางเวร
สร้างหน้าจัดตารางเวรพยาบาลที่มี:
- Calendar view แสดงเดือนปัจจุบัน
- เลือกวันที่และกะ (morning/afternoon/night)
- แสดงรายชื่อพยาบาลที่ว่างในแต่ละวัน
- Drag & drop interface เพื่อจัดพยาบาลเข้าเวร
- ตรวจสอบ business rules:
  * พยาบาลทำงานไม่เกิน 2 กะติดต่อกัน
  * แต่ละกะมีพยาบาลตาม required_nurse
  * พยาบาลมีวันหยุดอย่างน้อย 8 วัน/เดือน
- ปุ่ม Save as Draft และ Publish
- แสดงสถิติการจัดเวร (จำนวนชั่วโมงของแต่ละคน)
ใช้ @dnd-kit/sortable สำหรับ drag & drop
บันทึกข้อมูลลง Supabase พร้อม transaction handling

2. หน้าดูตารางเวรของฉัน(เหมือนกับพยาบาลทั่วไป)
- Calendar view แสดงตารางเวรของตัวเองตามเดือนปัจจุบัน หรือ ตารางรวมดูเวรของคนอื่นได้
- เลือกมุมมองรายเดือน/รายสัปดาห์

3. หน้าอนุมัติคำขอ
สร้างหน้าจัดการคำขออนุมัติที่มี:
- Tabs แยกประเภท: คำขอแลกเวร | คำขอลางาน
- ตารางแสดงคำขอพร้อม filters (pending/approved/rejected/all)
- Modal แสดงรายละเอียดคำขอเมื่อคลิก:
  * ข้อมูลผู้ขอ
  * รายละเอียดการขอ (วันที่, เหตุผล)
- ปุ่ม Approve/Reject พร้อม comment
- Auto-update shift_assignments เมื่ออนุมัติแลกเวร
- ส่ง notification ไปยังผู้ขอ
- Real-time update ด้วย Supabase subscription

4. หน้ารายงาน
สร้างหน้ารายงานการทำงานที่มี:
- Date range picker เลือกช่วงเวลา
- Summary cards สถิติการทำงานของแต่ละคน:
  * จำนวนวันทำงาน/ขาด/ลา
  * ชั่วโมงทำงานสะสม
  * ประวัติการแลกเวร
- Charts (ใช้ Recharts):
  * กราฟแท่งเปรียบเทียบชั่วโมงทำงาน
  * Pie chart สัดส่วนกะเช้า/บ่าย/ดึก
  * Line chart แนวโน้มการลา
- ตารางแสดงรายชื่อพยาบาลพร้อม search และ filter
  * กดดูข้อมูล: รูป, ชื่อ, email, เบอร์โทร
- Export to PDF/Excel functionality
- Drill-down เพื่อดูรายละเอียดรายบุคคล


5. ระบบ Notification
สร้างระบบ notification แบบ real-time ที่:
- Bell icon บน header แสดงจำนวนที่ยังไม่อ่าน
- Dropdown แสดงรายการ notifications
- แยกสีตาม action_type (info/warning/success)
- คลิกเพื่อไปยังหน้าที่เกี่ยวข้อง
- Mark as read/Mark all as read
- ใช้ Supabase Realtime subscription:
  * Listen to INSERT on notifications table
  * Filter by user_id = current user
- Toast notification สำหรับแจ้งเตือนสำคัญ
- Settings ให้เลือกประเภทการแจ้งเตือน

6. Mobile Responsive
ปรับปรุง UI ให้รองรับ mobile devices:
- Hamburger menu สำหรับ navigation
- Swipeable tabs สำหรับ mobile
- Touch-friendly buttons และ forms
- Responsive tables ที่แปลงเป็น cards บน mobile
- Bottom navigation bar สำหรับ quick access
- Pull-to-refresh functionality
- Optimize performance สำหรับ slow connections

## Database Structure & Relationships:
1. **schedules table** = "กรอบเวร/กะงาน" (One-to-Many with shift_assignments)
   - schedules_id (PK)
   - date = วันที่ของเวร
   - shift_type = ประเภทกะ (morning/afternoon/night)
   - department_id = แผนกที่ต้องการคนเวร
   - required_nurse = จำนวนพยาบาลที่ต้องการในกะนี้
   - status = draft/published
   
   ตัวอย่าง: "วันที่ 15 ม.ค. กะเช้า แผนกอายุรกรรม ต้องการพยาบาล 3 คน"

2. **shift_assignments table** = "การจัดคนเข้าเวร" (Many-to-One with schedules)
   - assignment_id (PK)
   - schedules_id (FK) = อ้างอิงถึง schedule
   - user_id (FK) = พยาบาลที่ถูกจัดเข้าเวร
   
   ตัวอย่าง: "schedule_id: 1 มีพยาบาล 3 คน คือ user_id: 101, 102, 103"

## ความสัมพันธ์:
- 1 schedule → หลาย assignments (1 กะ มีพยาบาลหลายคน)
- ถ้า schedule ต้องการ 3 คน → ต้องมี 3 records ใน shift_assignments
- schedules.required_nurse ควรเท่ากับ COUNT(shift_assignments) ของ schedules_id นั้นๆ

## Use Cases ที่ต้องทำ:
1. **การสร้างตารางเวร**:
   - Step 1: สร้าง record ใน schedules (date, shift_type, required_nurse)
   - Step 2: เลือกพยาบาลตาม required_nurse
   - Step 3: สร้าง shift_assignments สำหรับแต่ละคนที่เลือก

2. **การดูตารางเวร**:
```sql
   -- ดูว่าใครต้องมาเวรวันนี้
   SELECT s.*, u.name 
   FROM schedules s
   JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id  
   JOIN users u ON sa.user_id = u.user_id
   WHERE s.date = '2025-01-15'
# Use Case 4: จัดตารางเวร (หัวหน้าพยาบาล)

## Actor Actions:
1. คลิก “เมนูจัดตารางเวร”
5. กำหนดจำนวนพยาบาลต่อกะ 
(เช้า/บ่าย/ดึก)
7. กดสร้างตารางเวร
10.เลือกพยาบาลแล้วคลิกจัดเวร
12. ทำซ้ำจนครบทุกกะ


## System Actions:
2. แสดงหน้าจัดการตารางเวร พร้อมปฏิทินเดือนปัจจุบัน
Q 4.1 : 
SELECT department_id 
FROM departments 
WHERE head_nurse_id = {userId}
3. แสดงตาราง เดือน/ปี ปัจจุบันของแผนกผู้ใช้
4. โหลดข้อมูลตารางเวรของเดือนที่เลือก 
Q 4.2 :
SELECT schedules_id, date, shift_type, status, required_nurse,department_id, created_by, published_date
FROM schedules
WHERE department_id = {dept_id}
AND date >= '{startDate}' AND date <= '{endDate}'
AND status IN ('draft', 'published')
ORDER BY date
Q 4.3 : 
SELECT sa.assignment_id, sa.schedules_id,u.user_id, u.name, u.email
FROM shift_assignments sa
INNER JOIN users u ON sa.user_id = u.user_id
WHERE sa.schedules_id IN ({scheduleIds})


6.เก็บค่าที่ตั้งไว้สำหรับการสร้างตารางเวร
  - เก็บค่า: morning_required, afternoon_required, night_required
8.สร้างตารางเวรเปล่าสำหรับทั้งเดือน 
- สร้างตารางสำหรับทุกวัน × 3 กะ (เช้า/บ่าย/ดึก)
Q 4.4 : 
INSERT INTO schedules (date, shift_type, department_id, created_by,status, required_nurse, published_date)
VALUES (...)
9.แสดงรายชื่อพยาบาลที่สามารถจัดเวรได้
Q 4.5 :
SELECT user_id, name, email
FROM users
WHERE department_id = {dept_id}
AND role = 'nurse'
ORDER BY name
11. จัดเวรพยาบาล
- ตรวจสอบความถูกต้อง:
Q4.6 : 
SELECT assignment_id
FROM shift_assignments
WHERE schedules_id = {schedule_id} 
AND user_id = {nurse_id}
- เช็คชั่วโมงรายเดือน - ต้องไม่เกิน 176 ชม.
Q4.7 : 
SELECT sa.assignment_id
FROM shift_assignments sa
INNER JOIN schedules s ON sa.schedules_id = s.schedules_id
WHERE sa.user_id = {nurse_id}
AND s.date >= '{monthStart}' AND s.date <= '{monthEnd}'
- นับคนในกะ  ต้องไม่เกินที่กำหนด
Q4.8 :
SELECT COUNT(*) as count
FROM shift_assignments
WHERE schedules_id = {schedule_id}
- ถ้าถูกต้องทั้งหมด บันทึกการจัดเวร:
Q4.9 :
INSERT INTO shift_assignments (user_id, schedules_id, assigned_by, assigned_date)
VALUES (...)


# Use Case 3: ดูรายงานพยาบาล (หัวหน้าพยาบาล)

## Actor Actions:
1. คลิกเมนู "รายงานพยาบาล"
3. เลือกเดือน/ปีที่ต้องการวิเคราะห์
5. ดูภาพรวมสถิติของแผนกทั้งหมด
6. คลิกปุ่ม "Export PDF"

## System Actions:
2. ดึงรายงานของพยาบาลทั้งหมดในแผนกของเดือนปัจจุบัน
Q 3.1 : 
SELECT department_id 
FROM departments 
WHERE head_nurse_id = {userId}
Q 3.2 : 
SELECT user_id, name, email 
FROM users 
WHERE department_id = {dept_id} 
AND role = 'nurse'
- ตรวจสอบสำหรับแต่ละพยาบาล 
Q 3.3 : 
SELECT work_days_count, shifts_count, total_hours,morning_shifts, afternoon_shifts, night_shifts, rest_days 
FROM work_reports
WHERE user_id = {nurse_id} 
AND report_month = '{monthYear}'

- ถ้าไม่มีรายงานของพยาบาลคำนวณจากตารางเวร
Q 3.4 : 
SELECT sa.assignment_id, s.date, s.shift_type, s.status
FROM shift_assignments sa
INNER JOIN schedules s ON sa.schedule_id = s.schedules_id
WHERE sa.user_id = {nurse_id}
AND s.date >= '{firstDay}' 
AND s.date <= '{lastDay}'
AND s.status = 'published'
       
4. แสดงรายงานของพยาบาลของเดือนที่เลือก
  - แสดงตารางรายงานพยาบาลแต่ละคน:
     - ชื่อพยาบาล
     - วันทำงาน
     - กะทั้งหมด (แยกเช้า/บ่าย/ดึก)
     - ชั่วโมงรวม
     - วันหยุด
     - สถานะส่งรายงาน (ส่งแล้ว/ยังไม่ส่ง)

7. สร้างไฟล์ PDF ของสรุปรายงาน พร้อม download
  - สร้าง PDF จากข้อมูลรายงานทั้งหมด
   - รวมสถิติภาพรวมแผนก
   - Download ไฟล์ให้ผู้ใช้



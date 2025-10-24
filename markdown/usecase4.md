actor:
1. คลิก “เมนูจัดตารางเวร”
3. คลิกเลือกเดือน/ปีที่ต้องการสร้างตารางเวร
6. กำหนดจำนวนพยาบาลต่อกะ
8.กดสร้างตารางเวร
11.เลือกวันที่และกะที่ต้องการจัดพยาบาล
12. เลือกพยาบาลแล้วคลิกจัดเวร
14. ทำซ้ำจนครบทุกกะ


system:
2. แสดงหน้าจัดการตารางเวร พร้อมปฏิทินเดือนปัจจุบัน
4. โหลดข้อมูลตารางเวรของเดือนที่เลือก 
sql code...
6.เก็บค่าที่ตั้งไว้สำหรับการสร้างตารางเวร
8.สร้างตารางเวรเปล่าสำหรับทั้งเดือน 
INSERT INTO schedules (date, shift_type, department_id, created_by, status, required_nurse, published_date)
VALUES
  ('2025-10-01', 'morning', :dept_id, :user_id, 'draft', :morning_count, NULL),
  ('2025-10-01', 'afternoon', :dept_id, :user_id, 'draft', :afternoon_count, NULL),
  ('2025-10-01', 'night', :dept_id, :user_id, 'draft', :night_count, NULL),
  -- ... ต่อไปจนครบทุกวันในเดือน
9.แสดงรายชื่อพยาบาลที่สามารถจัดเวรได้
SELECT user_id, name, email
FROM users
WHERE department_id = :dept_id
AND role IN ('nurse', 'head_nurse')
ORDER BY name;



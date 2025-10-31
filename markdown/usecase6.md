# Use Case 6: ดูตารางเวรของฉัน (พยาบาล)

## Actor Actions:
1. เข้าเมนู "ตารางเวรของฉัน"
3. เลือกเดือน/ปีที่ต้องการดู (ถ้าต้องการ)
5. คลิกที่เวรใดเวรหนึ่งเพื่อดูรายละเอียด

## System Actions:
2. ดึงตารางเวรของพยาบาลในเดือนที่เลือก
Q 6.1 : 
SELECT sa.assignment_id,s.schedules_id, s.date, s.shift_type, s.status, s.department_id
FROM shift_assignments sa
INNER JOIN schedules s ON sa.schedules_id = s.schedules_id
WHERE sa.user_id = {userId}
AND s.date >= '{firstDay}' 
AND s.date <= '{lastDay}'
AND s.status = 'published'
ORDER BY s.date
- (ดึงเพื่อนร่วมกะ)
Q 6.2 : 
SELECT sa.schedules_id,u.user_id, u.name, u.email
FROM shift_assignments sa
INNER JOIN users u ON sa.user_id = u.user_id
WHERE sa.schedules_id IN ({scheduleIds})
AND sa.user_id != {userId}
4. แสดงตารางเวรพร้อมคำนวณสถิติการทำงาน
   - แสดงปฏิทินพร้อมเวรที่ได้รับ
   - คำนวณสถิติ
   - กะทั้งหมด (totalShifts)
   -  กะเช้า/บ่าย/ดึก (morning/afternoon/nightShifts)
   - ชั่วโมงรวม (totalHours = totalShifts × 8)
   - วันทำงาน (workDays = จำนวนวันที่ไม่ซ้ำ)
   - วันหยุด (restDays = จำนวนวันในเดือน - workDays)
6. ดึงรายละเอียดเวรและเพื่อนร่วมงาน
   - แสดงข้อมูล:
   - วันที่และกะ
   - เวลาทำงาน
   - รายชื่อเพื่อนร่วมกะทั้งหมด



# Use Case 7: ขอแลกเวร (พยาบาล)

## Actor Actions:
1. คลิกเข้าเมนู "ขอแลกเวร"
3. เลือกเวรของตัวเองที่ต้องการแลกและกดปุ่ม “ถัดไป”
5. เลือกวันที่ของเพื่อนที่ต้องการแลก
และกดปุ่ม “ถัดไป”
7. เลือกเพื่อนที่ต้องการแลกเวรด้วย
และกดปุ่ม “ถัดไป”
9. ใส่เหตุผลของการแลกเวร
11. กดปุ่ม "ส่งคำขอแลกเวร"
14. ตรวจสอบสถานะคำขอ (คลิกแถบ "คำขอของฉัน")
16. ดูประวัติคำขอ (คลิกแถบ "ประวัติ")

## System Actions:
2. ดึงข้อมูลวันที่มีเวรของตัวเองในเดือนปัจจุบัน
Q 7.1 : 
SELECT s.schedules_id, s.date, s.shift_type, s.department_id, s.status, sa.assignment_id
FROM schedules s
INNER JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id
WHERE sa.user_id = {userId}
AND s.date >= '{monthStart}' 
AND s.date <= '{monthEnd}'
AND s.status = 'published'
ORDER BY s.date ASC
4. ดึงเวรที่สามารถแลกได้
Q 7.2 : 
SELECT s.schedules_id, s.date, s.shift_type,s.department_id, s.status,u.user_id, u.name, u.email, sa.assignment_id
FROM schedules s 
INNER JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id 
INNER JOIN users u ON sa.user_id = u.user_id
WHERE s.department_id = {departmentId}
AND s.date >= '{monthStart}' 
AND s.date <= '{monthEnd}'
AND s.status = 'published'
AND s.schedules_id NOT IN (SELECT schedules_id 
FROM shift_assignments WHERE user_id = {userId})
ORDER BY s.date ASC
6. แสดงรายชื่อพยาบาลในเวรที่เลือก
   - ใช้ข้อมูลจาก Query ข้อ 4
8. แสดงฟอร์มกรอกเหตุผล
- รอรับ input เหตุผลจากผู้ใช้
10. ตรวจสอบความถูกต้องของคำขอแลกเวร
- (เช็คว่ามีคำขอ pending อยู่หรือไม่)
Q 7.3 : 
SELECT exchange_id
FROM shift_exchange_requests
WHERE status = 'pending'
AND ((requester_id = {requesterId} 
AND original_schedule_id = {originalScheduleId})
OR (target_user_id = {requesterId} 
AND original_schedule_id = {originalScheduleId}))
- (เช็คว่าผู้ขอมีเวรซ้ำกับเวรปลายทางหรือไม่)
Q 7.4 : 
SELECT sa.assignment_id
FROM shift_assignments sa
INNER JOIN schedules s ON sa.schedules_id = s.schedules_id
WHERE sa.user_id = {requesterId}
AND s.date = '{targetDate}'
AND s.shift_type = '{targetShiftType}'
- (เช็คว่าเพื่อนมีเวรซ้ำกับเวรต้นทางหรือไม่)
Q 7.5 : 
SELECT sa.assignment_id
FROM shift_assignments sa
INNER JOIN schedules s ON sa.schedules_id = s.schedules_id
WHERE sa.user_id = {targetUserId}
AND s.date = '{originalDate}'
AND s.shift_type = '{originalShiftType}'
12. เพิ่มคำขอแลกเวรลงระบบ
Q 7.6 
INSERT INTO shift_exchange_requests (requester_id, target_user_id, original_schedule_id,target_schedule_id, request_date, reason, status)
VALUES (...)
13. แสดงข้อความว่าส่งคำขอสำเร็จ
15. แสดงคำขอทั้งหมดของตัวเอง
Q 7.7 :
SELECT exchange_id, requester_id, target_user_id, original_schedule_id, target_schedule_id,request_date, reason, status
FROM shift_exchange_requests
WHERE requester_id = {userId}
AND status = 'pending'
ORDER BY request_date DESC
17. แสดงประวัติคำขอที่ผ่านมา
- (คำขอที่ส่งไป)
Q 7.8 : 
SELECT exchange_id, requester_id, target_user_id, original_schedule_id, target_schedule_id, request_date, reason, status
FROM shift_exchange_requests
WHERE requester_id = {userId}
AND status IN ('approved', 'rejected')
ORDER BY request_date DESC
-  (คำขอที่ได้รับและตอบไปแล้ว):
Q 7.9 : 
SELECT exchange_id, requester_id, target_user_id,
original_schedule_id, target_schedule_id, request_date, reason, status
FROM shift_exchange_requests
WHERE target_user_id = {userId}
AND status IN ('approved', 'rejected')
ORDER BY request_date DESC


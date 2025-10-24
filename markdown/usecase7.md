acotor:
1. คลิกเข้าเมนู "ขอแลกเวร"
3. เลือกเดือนและวันที่ที่จะแลกเวร
4. กดปุ่ม "ถัดไป"


6. กดเวรที่ต้องการแลกของเพื่อน
7. กดปุ่ม "ถัดไป"
9. กดเลือกเพื่อนที่ต้องการแลกด้วย
10. กดปุ่ม "ถัดไป"
11. ใส่เหตุผลของการแลกเวรและกดปุ่ม "ส่งคำขอแลกเวร"


13. กลับไปทำตั้งแต่ข้อ 1 จนกว่าจะส่งคำขอแลกเวรได้
15. กดแถบ "คำขอของฉัน" เพื่อติดตามสถานะคำขอแลกเวร
17. กดแถบ "ประวัติ" เพื่อดูประวัติคำขอแลกเวรที่ผ่านมา

system:
2. ดึงข้อมูลวันที่มีเวรของตัวเองในเดือนปัจจุบัน
SELECT 
s.schedules_id, 
s.date, 
s.shift_type, 
s.department_id, 
s.status, 
sa.assignment_id FROM schedules s 
JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id 
WHERE sa.user_id = :userId 
AND s.date >= '2025-10-01' 
AND s.date <= '2025-10-31' 
AND s.status = 'published' 
ORDER BY s.date ASC;

5. แสดงข้อมูลเวรที่สามารถแลกได้ของเพื่อน
SELECT 
s.schedules_id, 
s.date, 
s.shift_type, 
s.department_id, 
s.status, 
json_agg( json_build_object( 'user_id', u.user_id, 'name', u.name, 'email', u.email, 'assignment_id', sa.assignment_id ) ) as nurses 
FROM schedules s 
JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id 
JOIN users u ON sa.user_id = u.user_id 
WHERE s.department_id = :departmentId 
AND s.date >= '2025-10-01' 
AND s.date <= '2025-10-31' 
AND s.status = 'published' 
AND s.schedules_id NOT IN 
(--ยกเว้นเวรที่ตัวเองอยู่ SELECT schedules_id FROM shift_assignments WHERE user_id = :excludeUserId ) 
GROUP BY s.schedules_id 
ORDER BY s.date ASC;

8.  แสดงรายชื่อพยาบาลในเวรที่เลือก
(ข้อมูลมาจาก query ในข้อ 5)


12. ระบบตรวจสอบความถูกต้องว่าสามารถส่งคำขอแลกเวรดังกล่าวได้ไหม
12a. ตรวจสอบว่ามีคำขอ pending อยู่แล้วหรือไม่
SELECT exchange_id 
FROM shift_exchange_requests 
WHERE status = 'pending' 
AND ( (requester_id = :requesterId 
AND original_schedule_id = :originalScheduleId) 
OR (target_user_id = :requesterId 
AND original_schedule_id = :originalScheduleId) );
12b. ตรวจสอบว่าผู้ขอมีเวรซ้ำกับเวรปลายทางหรือไม่
SELECT sa.assignment_id 
FROM shift_assignments sa 
JOIN schedules s ON sa.schedules_id = s.schedules_id 
WHERE sa.user_id = :requesterId 
AND s.date = :targetDate 
AND s.shift_type = :targetShiftType;
12c.  ตรวจสอบว่าพยาบาลที่ถูกขอมีเวรซ้ำกับเวรต้นทางหรือไม่
SELECT sa.assignment_id 
FROM shift_assignments sa 
JOIN schedules s ON sa.schedules_id = s.schedules_id 
WHERE sa.user_id = :targetUserId 
AND s.date = :originalDate 
AND s.shift_type = :originalShiftType;
14. ระบบแสดงข้อความว่าส่งคำขอสำเร็จ
16. ระบบแสดงคำขอทั้งหมดของตัวเอง
SELECT 
ser.exchange_id, 
ser.requester_id, 
ser.target_user_id, 
ser.original_schedule_id, ser.target_schedule_id, 
ser.request_date, 
ser.reason, 
ser.status, 
u.name as target_user_name, 
u.email as target_user_email, 
s1.date as original_date, 
s1.shift_type as original_shift_type, 
s2.date as target_date, 
s2.shift_type as target_shift_type 
FROM shift_exchange_requests ser 
JOIN users u ON ser.target_user_id = u.user_id JOIN schedules s1 ON ser.original_schedule_id = s1.schedules_id 
LEFT JOIN schedules s2 ON ser.target_schedule_id = s2.schedules_id 
WHERE ser.requester_id = :userId 
ORDER BY ser.request_date DESC;
18. แสดงรายการคำขอที่ผ่านมาที่ถูกอนุมัติหรือถูกปฏิเสธ
18a. ดึงประวัติคำขอของตัวเอง (ที่ส่งไป)
SELECT ser.exchange_id, 
ser.requester_id, 
ser.target_user_id, 
ser.request_date, 
ser.reason, 
ser.status, 
u.name as target_user_name, 
s1.date as original_date, 
s1.shift_type as original_shift_type, 
s2.date as target_date, 
s2.shift_type as target_shift_type, 'my' as type 
FROM shift_exchange_requests ser JOIN users u ON ser.target_user_id = u.user_id 
JOIN schedules s1 ON ser.original_schedule_id = s1.schedules_id 
LEFT JOIN schedules s2 ON ser.target_schedule_id = s2.schedules_id 
WHERE ser.requester_id = :userId 
AND ser.status IN ('approved', 'rejected') 
18b. ดึงประวัติคำขอที่ได้รับ (ที่ตอบไปแล้ว)
SELECT ser.exchange_id, 
ser.requester_id, 
ser.target_user_id, 
ser.request_date, 
ser.reason, 
ser.status, 
u.name as requester_name, 
s1.date as original_date, 
s1.shift_type as original_shift_type, 
s2.date as target_date, 
s2.shift_type as target_shift_type, 'incoming' as type 
FROM shift_exchange_requests ser 
JOIN users u ON ser.requester_id = u.user_id 
JOIN schedules s1 ON ser.original_schedule_id = s1.schedules_id 
LEFT JOIN schedules s2 ON ser.target_schedule_id = s2.schedules_id 
WHERE ser.target_user_id = :userId 
AND ser.status IN ('approved', 'rejected')


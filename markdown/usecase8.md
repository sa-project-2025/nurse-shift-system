actor:
1. คลิกเข้าเมนู "ขอแลกเวร" ที่มีแจ้งเตือนขึ้น
2. พยาบาลเปลี่ยนไปยัง tab "คำขอจากเพื่อน"
5. กดปุ่ม "ยอมรับ" หรือ "ปฏิเสธ" คำขอแลกเวร

system:

3. ดึงคำขอที่รอการตอบรับ
SELECT 
ser.exchange_id, 
ser.requester_id, 
ser.target_user_id, ser.original_schedule_id, ser.target_schedule_id, 
ser.request_date, 
ser.reason, 
ser.status, 
u.name as requester_name, 
u.email as requester_email, 
s1.date as original_date, 
s1.shift_type as original_shift_type, s2.date as target_date, 
s2.shift_type as target_shift_type 
FROM shift_exchange_requests ser 
JOIN users u ON ser.requester_id = u.user_id 
JOIN schedules s1 ON ser.original_schedule_id = s1.schedules_id LEFT JOIN schedules s2 ON ser.target_schedule_id = s2.schedules_id WHERE ser.target_user_id = :userId 
AND ser.status = 'pending' 
ORDER BY ser.request_date DESC;
4. แสดงคำขอที่ถูกส่งมาจากต้นทาง
6. ระบบเปลี่ยนสถานะคำขอแลกเวรตามที่กด
6a. กรณีกดปุ่ม "ยอมรับ" (approved)
UPDATE shift_exchange_requests 
SET status = 'approved' 
WHERE exchange_id = :exchangeId;
6a.1 ดึงข้อมูล assignment ทั้งสองฝ่าย 
-- ดึง assignment_id ของผู้ขอ (requester) SELECT assignment_id, user_id 
FROM shift_assignments 
WHERE schedules_id = :originalScheduleId 
AND user_id = :requesterId; 
-- ดึง assignment_id ของผู้ถูกขอ (target) 
SELECT assignment_id, user_id 
FROM shift_assignments 
WHERE schedules_id = :targetScheduleId 
AND user_id = :targetUserId;
6a.2 สลับ user_id ใน shift_assignments 
-- สลับ assignment ของผู้ขอ 
UPDATE shift_assignments S
ET user_id = :targetUserId 
WHERE assignment_id = :requesterAssignmentId; 
-- สลับ assignment ของผู้ถูกขอ 
UPDATE shift_assignments 
SET user_id = :requesterId 
WHERE assignment_id = :targetAssignmentId;
6a.3 ลบ work_reports ของทั้งสองคนในเดือนนั้นกรณีบันทึกการทำงานไปแล้ว  
-- ลบ work_report ของผู้ขอ 
DELETE FROM work_reports 
WHERE user_id = :requesterId 
AND report_month = :reportMonth; 
-- ลบ work_report ของผู้ถูกขอ 
DELETE FROM work_reports 
WHERE user_id = :targetUserId 
AND report_month = :reportMonth;
6b. กรณีกดปุ่ม "ปฏิเสธ" (rejected)
UPDATE shift_exchange_requests SET status = 'rejected' WHERE exchange_id = :exchangeId;
- shift_assignments ยังคงเดิม 
- work_reports ยังคงเดิม
7.แสดงข้อความทำรายการสำเร็จ


Actor :Head Nurse (หัวหน้าพยาบาล)
Precondition:
- มีคำขอลางานที่รอการอนุมัติ
- หัวหน้าพยาบาลได้รับการแจ้งเตือนที่เมนู 
"อนุมัติคำขอลางาน"


actor:
1. คลิกเข้าเมนู "อนุมัติคำขอลางาน"
3. กด "อนุมัติ" หรือ "ปฏิเสธ"    คำขอลาของพยาบาล
6. กดแถบ "อนุมัติแล้ว"
8. กดแถบ "ไม่อนุมัติ"
10. กดแถบ "ทั้งหมด"

system:
2. ดึงคำขอลาที่สถานะรอการอนุมัติมาแสดง
SELECT lr.leave_id, lr.user_id, lr.start_date, lr.end_date, lr.leave_days, lr.leave_type, 
lr.reason, lr.status, lr.request_date, 
u.name as requester_name, 
u.email as requester_email 
FROM leave_requests lr 
JOIN users u ON lr.user_id = u.user_id WHERE u.department_id = :departmentId AND lr.status = 'pending' 
ORDER BY lr.request_date ASC;
4. ระบบเปลี่ยนสถานะคำขอลาตามที่กด
4a. กรณีกดปุ่ม "อนุมัติ" (approved)
4a.1 อัปเดตสถานะคำขอ
UPDATE leave_requests 
SET status = 'approved', 
approved_by = :headNurseId, 
response_date = NOW() AT TIME ZONE 'Asia/Bangkok' 
WHERE leave_id = :leaveId;
4a.2 ดึงข้อมูลเวรที่ได้รับผลกระทบ
SELECT sa.assignment_id FROM shift_assignments sa JOIN schedules s ON sa.schedules_id = s.schedules_id WHERE sa.user_id = :userId AND s.date BETWEEN :startDate AND :endDate AND s.status = 'published';
4a.3 ลบเวรที่ได้รับผลกระทบ
DELETE FROM shift_assignments 
WHERE user_id = :userId 
AND schedules_id IN ( 
SELECT schedules_id 
FROM schedules 
WHERE date BETWEEN :startDate 
AND :endDate
AND status = 'published' );
4b. กรณีกดปุ่ม "ปฏิเสธ" (rejected)
UPDATE leave_requests 
SET status = 'rejected', 
approved_by = :headNurseId, 
response_date = NOW() AT TIME ZONE 'Asia/Bangkok', reason_reject = :reasonReject WHERE leave_id = :leaveId;
5. แสดงข้อความทำรายการสำเร็จ
7. ดึงคำขอที่อนุมัติแล้วมาแสดง
SELECT lr.leave_id, lr.user_id, lr.start_date, lr.end_date, lr.leave_days, lr.leave_type, lr.reason, lr.status, lr.request_date, lr.response_date, 
u.name as requester_name 
FROM leave_requests lr 
JOIN users u ON lr.user_id = u.user_id 
WHERE u.department_id = :departmentId 
AND lr.status = 'approved' 
ORDER BY lr.response_date DESC;
9. ดึงคำขอที่ปฏิเสธแล้ว 
SELECT lr.leave_id, lr.user_id, lr.start_date, lr.end_date, lr.leave_days, lr.leave_type, lr.reason, lr.reason_reject, lr.status, lr.request_date, lr.response_date, 
u.name as requester_name 
FROM leave_requests lr 
JOIN users u ON lr.user_id = u.user_id 
WHERE u.department_id = :departmentId 
AND lr.status = 'rejected' 
ORDER BY lr.response_date DESC;
11. ดึงคำขอทั้งหมด (ทุกสถานะ)
SELECT lr.leave_id, lr.user_id, lr.start_date, lr.end_date, lr.leave_days, lr.leave_type, lr.reason, lr.reason_reject, lr.status, lr.request_date, lr.response_date, 
u.name as requester_name 
FROM leave_requests lr 
JOIN users u ON lr.user_id = u.user_id 
WHERE u.department_id = :departmentId 
ORDER BY lr.request_date DESC;



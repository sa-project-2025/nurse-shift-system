actor:
1. คลิกเข้าเมนู "ขอลางาน"
3. กรอกข้อมูลคำขอลางาน:
    - เลือกประเภทการลา(sick/personal/vacation/other)
   - เลือกวันที่เริ่มต้นและสิ้นสุด
   - กรอกเหตุผล
6. กดปุ่ม "ส่งคำขอลางาน"
8. กลับไปทำข้อ3จนกว่าจะถูก
11. กดแถบ "รอการอนุมัติ"
13. กดแถบ "อนุมัติแล้ว"
15. กดแถบ "ไม่อนุมัติ"
17. กดแถบ "ทั้งหมด"


system:
2. แสดงแบบฟอร์มคำขอลางาน
4. ดึงเวรที่จะได้รับผลกระทบจากการลา
SELECT s.schedules_id, s.date, s.shift_type, s.status 
FROM schedules s 
INNER JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id 
WHERE sa.user_id = :userId 
AND s.date BETWEEN :startDate 
AND :endDate AND s.status = 'published';
5. แสดงจำนวนวันลาและเวรที่ได้รับผลกระทบ
7. ตรวจสอบว่าวันที่ซ้อนทับกับคำขอลาอันเก่าไหม
7a. ตรวจสอบข้อมูลครบถ้วน
- ต้องมี: userId, startDate, endDate, leaveType, reason
- วันที่สิ้นสุดต้องมากกว่าหรือเท่ากับวันที่เริ่มต้น
7b. ตรวจสอบคำขอที่ซ้อนทับโดยดึงคำขอที่รอการอนุมัติ
SELECT leave_id, start_date, end_date 
FROM leave_requests 
WHERE user_id = :userId 
AND status = 'pending';
7c. แสดงข้อความ error หากข้อมูลไม่ถูกต้อง
9. สร้างคำขอลางาน
INSERT INTO leave_requests ( 
user_id, start_date, end_date, leave_days, 
leave_type, reason, status, request_date ) 
VALUES ( 
:userId, :startDate, :endDate, :leaveDays, :leaveType, :reason, 'pending', NOW());
10.แสดงข้อความส่งคำขอสำเร็จ
12. ดึงคำขอที่รอการอนุมัติ 
SELECT lr.leave_id, lr.user_id, lr.start_date, lr.end_date, lr.leave_days, lr.leave_type, lr.reason, lr.status, lr.request_date, lr.response_date, lr.approved_by, u.name as approver_name 
FROM leave_requests lr 
LEFT JOIN users u ON lr.approved_by = u.user_id 
WHERE lr.user_id = :userId AND lr.status = 'pending' 
ORDER BY lr.request_date DESC;
14. ดึงคำขอที่อนุมัติแล้ว 
SELECT lr.leave_id, lr.user_id, lr.start_date, lr.end_date, lr.leave_days, lr.leave_type, lr.reason, lr.status, lr.request_date, lr.response_date, lr.approved_by, u.name as approver_name 
FROM leave_requests lr 
LEFT JOIN users u ON lr.approved_by = u.user_id 
WHERE lr.user_id = :userId AND lr.status = 'approved' 
ORDER BY lr.request_date DESC;
16. ดึงคำขอที่ไม่อนุมัติ 
SELECT lr.leave_id, lr.user_id, lr.start_date, lr.end_date, lr.leave_days, lr.leave_type, lr.reason, lr.reason_reject, lr.status, lr.request_date, lr.response_date, lr.approved_by, u.name as approver_name 
FROM leave_requests lr 
LEFT JOIN users u ON lr.approved_by = u.user_id WHERE lr.user_id = :userId AND lr.status = 'rejected' 
ORDER BY lr.request_date DESC;
18. ดึงคำขอทั้งหมด 
SELECT lr.leave_id, lr.user_id, lr.start_date, lr.end_date, lr.leave_days, lr.leave_type, lr.reason, lr.reason_reject, lr.status, lr.request_date, lr.response_date, lr.approved_by, u.name as approver_name 
FROM leave_requests lr 
LEFT JOIN users u ON lr.approved_by = u.user_id WHERE lr.user_id = :userId 
ORDER BY lr.request_date DESC;



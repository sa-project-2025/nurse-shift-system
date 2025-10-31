# Use Case 9: ขอลางาน (พยาบาล)

## Actor Actions:
1. คลิกเข้าเมนู "ขอลางาน"
3. กรอกข้อมูลคำขอลางาน:
    - เลือกประเภทการลา(sick/personal/vacation/other)
   - เลือกวันที่เริ่มต้นและสิ้นสุด
   - กรอกเหตุผล
5. ตรวจสอบเวรที่ได้รับผลกระทบ
7. กดปุ่ม "ส่งคำขอลางาน"
11. ดูคำขอที่รอการอนุมัติ (tab "รอการอนุมัติ")
13. ดูคำขอที่อนุมัติแล้ว (tab "อนุมัติแล้ว")
15. ดูคำขอที่ไม่อนุมัติ (tab "ไม่อนุมัติ")
17. ดูคำขอทั้งหมด (tab "ทั้งหมด")


## System Actions:
2. แสดงแบบฟอร์มคำขอลางาน
   - แสดงฟิลด์: ประเภทการลา, วันเริ่มต้น, วันสิ้นสุด, เหตุผล
4. ดึงเวรที่จะได้รับผลกระทบจากการลา
Q9.1 : 
SELECT s.schedules_id, s.date, s.shift_type, s.status
FROM schedules s
INNER JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id
WHERE sa.user_id = {userId}
AND s.date BETWEEN '{startDate}' AND '{endDate}'
AND s.status = 'published'
ORDER BY s.date, s.shift_type
6. แสดงจำนวนวันลาและเวรที่ได้รับผลกระทบ
   - คำนวณ: จำนวนวันลา = (endDate - startDate) + 1
   - แสดง: รายการเวรที่จะหายไป
8. ตรวจสอบความถูกต้องของคำขอ
- ต้องมี: userId, startDate, endDate, leaveType, reason
- endDate >= startDate
- (ตรวจสอบคำขอซ้อนทับ)
Q 9.2 : 
SELECT leave_id, start_date, end_date, leave_type
FROM leave_requests
WHERE user_id = {userId}
AND status = 'pending'
AND ((start_date <= '{endDate}' AND end_date >= '{startDate}'))
9. บันทึกคำขอลา
Q 9.3 : 
INSERT INTO leave_requests 
(user_id, start_date, end_date, leave_days,leave_type, reason, status, request_date)
VALUES (...)
10. แสดงข้อความส่งคำขอสำเร็จ
12. ดึงคำขอที่รอการอนุมัติ
Q 9.4 : 
SELECT leave_id, user_id, start_date, end_date, leave_days, leave_type, reason, status, request_date, response_date, approved_by
FROM leave_requests
WHERE user_id = {userId}
AND status = 'pending'
ORDER BY request_date DESC
14. ดึงคำขอที่รอการอนุมัติ
Q 9.4 : 
SELECT leave_id, user_id, start_date, end_date,
leave_days, leave_type, reason, status,
request_date, response_date, approved_by
FROM leave_requests
WHERE user_id = {userId}
AND status = 'approved'
ORDER BY request_date DESC
16. ดึงคำขอที่อนุมัติแล้ว 
Q 9.5 : 
SELECT leave_id, user_id, start_date, end_date,
leave_days, leave_type, reason, reason_reject, status, request_date, response_date, approved_by
FROM leave_requests
WHERE user_id = {userId}
AND status = 'rejected'
ORDER BY request_date DESC
18. ดึงคำขอทั้งหมด 
Q 9.6 : 
SELECT leave_id, user_id, start_date, end_date, leave_days, leave_type, reason, reason_reject, status, request_date, response_date, approved_by
FROM leave_requests
WHERE user_id = {userId}
ORDER BY request_date DESC



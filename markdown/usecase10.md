# Use Case 10: อนุมัติคำขอลางาน (หัวหน้าพยาบาล)

**Actor:** Head Nurse (หัวหน้าพยาบาล)

**Precondition:**
- มีคำขอลางานที่รอการอนุมัติ
- หัวหน้าพยาบาลได้รับการแจ้งเตือนที่เมนู "อนุมัติคำขอลางาน"

## Actor Actions:
1. คลิกเข้าเมนู "อนุมัติคำขอลางาน"
3. ดูรายละเอียดคำขอลา
5. กด "อนุมัติ" หรือ "ปฏิเสธ" คำขอลา
7. กดแถบ "อนุมัติแล้ว"
9. กดแถบ "ไม่อนุมัติ"
11. กดแถบ "ทั้งหมด"



## System Actions:
2. ดึงคำขอลาที่สถานะรอการอนุมัติมาแสดง
Q 10.1 : 
  SELECT leave_id, user_id, start_date, end_date,
          leave_days, leave_type, reason, status,
          request_date
   FROM leave_requests
   WHERE user_id IN (
     SELECT user_id
     FROM users
     WHERE department_id = {departmentId}
   )
     AND status = 'pending'
   ORDER BY request_date ASC
4. แสดงรายการคำขอพร้อมรายละเอียด
   - แสดง: ชื่อพยาบาล, วันที่ลา, ประเภท, เหตุผล
6. ดำเนินการตามคำตอบ
กรณี "อนุมัติ" (approved)
- (อัปเดตสถานะคำขอลาเป็น approved)
Q 10.2 : 
UPDATE leave_requests
SET status = 'approved',
         approved_by = {headNurseId},
         response_date = NOW()
WHERE leave_id = {leaveId}

- (ดึงเวรที่ได้รับผลกระทบ)
Q 10.3 : 
SELECT sa.assignment_id, sa.schedules_id,
            s.date, s.shift_type
FROM shift_assignments sa
INNER JOIN schedules s ON sa.schedules_id = s.schedules_id
WHERE sa.user_id = {userId}
AND s.date BETWEEN '{startDate}' AND '{endDate}'
AND s.status = 'published'
- (ลบเวรที่ได้รับผลกระทบ)
Q 10.4 : 
DELETE FROM shift_assignments
WHERE user_id = {userId}
AND schedules_id IN (
SELECT schedules_id
FROM schedules
WHERE date BETWEEN '{startDate}' AND '{endDate}'
ND status = 'published')
- (ลบ work_reports ถ้ามี เพราะเวรเปลี่ยน)
Q 10.5 : 
DELETE FROM work_reports
     WHERE user_id = {userId}
       AND report_month = '{reportMonth}'

กรณี "ปฏิเสธ" (rejected)
- อัปเดตสถานะคำขอ + เหตุผล
Q 10.6 : 
UPDATE leave_requests
SET status = 'rejected',
         approved_by = {headNurseId},
         response_date = NOW(),
         reason_reject = '{reasonReject}'
WHERE leave_id = {leaveId}
- ไม่มีการเปลี่ยนแปลง shift_assignments
- ไม่มีการเปลี่ยนแปลง work_reports
8. ดึงคำขอที่อนุมัติแล้ว (status = 'approved')
Q 10.7 : 
SELECT leave_id, user_id, start_date, end_date, leave_days, leave_type, reason, status,request_date, response_date
FROM leave_requests
WHERE user_id IN (SELECT user_id FROM users WHERE department_id = {departmentId})
AND status = 'approved'
ORDER BY response_date DESC
10. ดึงคำขอที่ปฏิเสธแล้ว (status = 'rejected')
Q 10.8 : 
SELECT leave_id, user_id, start_date, end_date,leave_days, leave_type, reason, reason_reject,status, request_date, response_date
FROM leave_requests
WHERE user_id IN (SELECT user_id FROM users WHERE department_id = {departmentId})
AND status = 'rejected'
ORDER BY response_date DESC
11. ดึงคำขอทั้งหมด (ทุกสถานะ)
Q10.9 : 
SELECT leave_id, user_id, start_date, end_date,leave_days, leave_type, reason, reason_reject,status, request_date, response_date
FROM leave_requests
WHERE user_id IN (SELECT user_id FROM users WHERE department_id = {departmentId})
ORDER BY request_date DESC



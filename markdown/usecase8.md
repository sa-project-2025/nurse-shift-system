# Use Case 8: ตอบรับ/ปฏิเสธคำขอแลกเวร (พยาบาล)

## Actor Actions:
1. คลิกเข้าเมนู "ขอแลกเวร" (เห็นแจ้งเตือนคำขอใหม่)
3. เปลี่ยนไปยัง tab "คำขอจากเพื่อน"
5. ดูรายละเอียดคำขอ
7. กดปุ่ม "ยอมรับ" หรือ "ปฏิเสธ"

## System Actions:
2. แสดงหน้าขอแลกเวร (รอเปลี่ยน tab)


4.ดึงคำขอที่รอการตอบรับ
Q 8.1 :
SELECT exchange_id, requester_id, target_user_id,
original_schedule_id, target_schedule_id,
request_date, reason, status
FROM shift_exchange_requests
WHERE target_user_id = {userId}
AND status = 'pending'
ORDER BY request_date DESC
6. แสดงคำขอทั้งหมดพร้อมรายละเอียด
   - แสดง: เวรต้นทาง, เวรปลายทาง, เหตุผล, วันที่ขอ
8. ดำเนินการตามคำตอบ
กรณี "ยอมรับ" (approved)
- (อัปเดตสถานะคำขอเป็น approved)
Q 8.2 : 
UPDATE shift_exchange_requests
SET status = 'approved', response_date = NOW()
WHERE exchange_id = {exchangeId}
- (ดึงข้อมูล assignment ทั้งสองฝ่าย
Q 8.3 : 
SELECT assignment_id, user_id
FROM shift_assignments
WHERE schedules_id = {originalScheduleId}
AND user_id = {requesterId}
Q8.4 : 
SELECT assignment_id, user_id
FROM shift_assignments
WHERE schedules_id = {targetScheduleId}
AND user_id = {targetUserId}
- (สลับ user_id ใน shift_assignments)
Q 8.5 : 
UPDATE shift_assignments
SET user_id = {targetUserId}
WHERE assignment_id = {requesterAssignmentId}
Q 8.6 : 
UPDATE shift_assignments
SET user_id = {requesterId}
WHERE assignment_id = {targetAssignmentId}
- (ลบ work_reports (ถ้ามี) เพราะตารางเวรเปลี่ยน)
Q 8.7 : 
DELETE FROM work_reports
WHERE user_id IN ({requesterId}, {targetUserId})
AND report_month = '{reportMonth}'
กรณี "ปฏิเสธ" (rejected)
- (อัปเดตสถานะคำขอเป็น rejected)
Q 8.8 : 
UPDATE shift_exchange_requests
SET status = 'rejected', response_date = NOW()
     WHERE exchange_id = {exchangeId}
9. แสดงข้อความทำรายการสำเร็จ



# Use Case 8: ตอบรับ/ปฏิเสธคำขอแลกเวร (พยาบาล)

## Actor Actions:
1. คลิกเข้าเมนู "ขอแลกเวร" (เห็นแจ้งเตือนคำขอใหม่)
3. เปลี่ยนไปยัง tab "คำขอจากเพื่อน"
5. ดูรายละเอียดคำขอ
7. กดปุ่ม "ยอมรับ" หรือ "ปฏิเสธ"

## System Actions:
2. แสดงหน้าขอแลกเวร (รอเปลี่ยน tab)

4. ดึงคำขอที่รอการตอบรับ (status = 'pending')
   ```sql
   SELECT ser.exchange_id, ser.requester_id, ser.target_user_id,
          ser.original_schedule_id, ser.target_schedule_id,
          ser.request_date, ser.reason, ser.status,
          u.name as requester_name, u.email as requester_email,
          s1.date as original_date, s1.shift_type as original_shift_type,
          s2.date as target_date, s2.shift_type as target_shift_type
   FROM shift_exchange_requests ser
   INNER JOIN users u ON ser.requester_id = u.user_id
   INNER JOIN schedules s1 ON ser.original_schedule_id = s1.schedules_id
   LEFT JOIN schedules s2 ON ser.target_schedule_id = s2.schedules_id
   WHERE ser.target_user_id = {userId}
     AND ser.status = 'pending'
   ORDER BY ser.request_date DESC
   ```

6. แสดงคำขอทั้งหมดพร้อมรายละเอียด
   - แสดง: เวรต้นทาง, เวรปลายทาง, เหตุผล, วันที่ขอ

8. ดำเนินการตามคำตอบ

   **กรณี "ยอมรับ" (approved):**

   - Step 8a: อัปเดตสถานะคำขอ
     ```sql
     UPDATE shift_exchange_requests
     SET status = 'approved', response_date = NOW()
     WHERE exchange_id = {exchangeId}
     ```

   - Step 8b: ดึงข้อมูล assignment ทั้งสองฝ่าย
     ```sql
     -- Assignment ของผู้ขอ (requester)
     SELECT assignment_id, user_id
     FROM shift_assignments
     WHERE schedules_id = {originalScheduleId}
       AND user_id = {requesterId}
     ```
     ```sql
     -- Assignment ของผู้ถูกขอ (target)
     SELECT assignment_id, user_id
     FROM shift_assignments
     WHERE schedules_id = {targetScheduleId}
       AND user_id = {targetUserId}
     ```

   - Step 8c: สลับ user_id ใน shift_assignments
     ```sql
     -- สลับ assignment ของผู้ขอ
     UPDATE shift_assignments
     SET user_id = {targetUserId}
     WHERE assignment_id = {requesterAssignmentId}
     ```
     ```sql
     -- สลับ assignment ของผู้ถูกขอ
     UPDATE shift_assignments
     SET user_id = {requesterId}
     WHERE assignment_id = {targetAssignmentId}
     ```

   - Step 8d: ลบ work_reports (ถ้ามี) เพราะตารางเวรเปลี่ยน
     ```sql
     DELETE FROM work_reports
     WHERE user_id IN ({requesterId}, {targetUserId})
       AND report_month = '{reportMonth}'
     ```

   **กรณี "ปฏิเสธ" (rejected):**

   - Step 8e: อัปเดตสถานะคำขอเท่านั้น
     ```sql
     UPDATE shift_exchange_requests
     SET status = 'rejected', response_date = NOW()
     WHERE exchange_id = {exchangeId}
     ```
   - ไม่มีการเปลี่ยนแปลง shift_assignments
   - ไม่มีการเปลี่ยนแปลง work_reports

9. แสดงข้อความทำรายการสำเร็จ
   - ถ้ายอมรับ: "ยอมรับคำขอแลกเวรสำเร็จ - เวรได้ถูกสลับแล้ว"
   - ถ้าปฏิเสธ: "ปฏิเสธคำขอแลกเวรแล้ว"

## Business Rules:
- ✅ ตอบได้เฉพาะคำขอที่ส่งมาหาตัวเอง
- ✅ ตอบได้เฉพาะคำขอ status = 'pending'
- ✅ เมื่อยอมรับ → สลับ user_id ใน shift_assignments
- ✅ เมื่อยอมรับ → ลบ work_reports ของทั้ง 2 คน (ถ้ามี)
- ✅ เมื่อปฏิเสธ → เปลี่ยนสถานะอย่างเดียว
- ⚠️ ตอบแล้วไม่สามารถเปลี่ยนใจได้

## Features:
- 🔔 **แจ้งเตือน**: เห็นคำขอใหม่ผ่านแจ้งเตือน
- 👀 **รายละเอียด**: ดูรายละเอียดคำขอก่อนตัดสินใจ
- ✅ **ยอมรับ**: แลกเวรอัตโนมัติ
- ❌ **ปฏิเสธ**: ปฏิเสธคำขอพร้อมเหตุผล (optional)
- 🔄 **อัปเดตอัตโนมัติ**: ระบบสลับเวรให้อัตโนมัติ

## Transaction Flow (กรณียอมรับ):
```
1. UPDATE shift_exchange_requests → approved
2. SELECT assignment ทั้ง 2 ฝ่าย
3. UPDATE shift_assignments (สลับ user_id)
4. DELETE work_reports (ของทั้ง 2 คน)
5. แสดงข้อความสำเร็จ
```

## Impact:
- 📅 **ตารางเวร**: เวรถูกสลับทันที
- 📊 **รายงาน**: work_reports ถูกลบ (ต้องส่งใหม่)
- 🔄 **ย้อนกลับไม่ได้**: เมื่อยอมรับแล้วจะยกเลิกไม่ได้

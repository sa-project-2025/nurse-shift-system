# Use Case 10: อนุมัติคำขอลางาน (หัวหน้าพยาบาล)

**Actor:** Head Nurse (หัวหน้าพยาบาล)

**Precondition:**
- มีคำขอลางานที่รอการอนุมัติ
- หัวหน้าพยาบาลได้รับการแจ้งเตือนที่เมนู "อนุมัติคำขอลางาน"

## Actor Actions:
1. คลิกเข้าเมนู "อนุมัติคำขอลางาน"
3. ดูรายละเอียดคำขอลา
5. กด "อนุมัติ" หรือ "ปฏิเสธ" คำขอลาของพยาบาล
7. กดแถบ "อนุมัติแล้ว"
9. กดแถบ "ไม่อนุมัติ"
11. กดแถบ "ทั้งหมด"

## System Actions:
2. ดึงคำขอลาที่สถานะรอการอนุมัติ (status = 'pending')
   ```sql
   SELECT lr.leave_id, lr.user_id, lr.start_date, lr.end_date,
          lr.leave_days, lr.leave_type, lr.reason, lr.status,
          lr.request_date,
          u.name as requester_name, u.email as requester_email
   FROM leave_requests lr
   INNER JOIN users u ON lr.user_id = u.user_id
   WHERE u.department_id = {departmentId}
     AND lr.status = 'pending'
   ORDER BY lr.request_date ASC
   ```

4. แสดงรายการคำขอพร้อมรายละเอียด
   - แสดง: ชื่อพยาบาล, วันที่ลา, ประเภท, เหตุผล

6. ดำเนินการตามคำตอบ

   **กรณี "อนุมัติ" (approved):**

   - Step 6a: อัปเดตสถานะคำขอ
     ```sql
     UPDATE leave_requests
     SET status = 'approved',
         approved_by = {headNurseId},
         response_date = NOW()
     WHERE leave_id = {leaveId}
     ```

   - Step 6b: ดึงเวรที่ได้รับผลกระทบ
     ```sql
     SELECT sa.assignment_id, sa.schedules_id,
            s.date, s.shift_type
     FROM shift_assignments sa
     INNER JOIN schedules s ON sa.schedules_id = s.schedules_id
     WHERE sa.user_id = {userId}
       AND s.date BETWEEN '{startDate}' AND '{endDate}'
       AND s.status = 'published'
     ```

   - Step 6c: ลบเวรที่ได้รับผลกระทบ (ยกเลิกเวร)
     ```sql
     DELETE FROM shift_assignments
     WHERE user_id = {userId}
       AND schedules_id IN (
         SELECT schedules_id
         FROM schedules
         WHERE date BETWEEN '{startDate}' AND '{endDate}'
           AND status = 'published'
       )
     ```

   - Step 6d: ลบ work_reports (ถ้ามี) เพราะเวรเปลี่ยน
     ```sql
     DELETE FROM work_reports
     WHERE user_id = {userId}
       AND report_month = '{reportMonth}'
     ```

   **กรณี "ปฏิเสธ" (rejected):**

   - Step 6e: อัปเดตสถานะคำขอ + เหตุผล
     ```sql
     UPDATE leave_requests
     SET status = 'rejected',
         approved_by = {headNurseId},
         response_date = NOW(),
         reason_reject = '{reasonReject}'
     WHERE leave_id = {leaveId}
     ```
   - ไม่มีการเปลี่ยนแปลง shift_assignments
   - ไม่มีการเปลี่ยนแปลง work_reports

7. แสดงข้อความทำรายการสำเร็จ
   - ถ้าอนุมัติ: "อนุมัติคำขอลาสำเร็จ - เวรได้ถูกยกเลิกแล้ว"
   - ถ้าปฏิเสธ: "ปฏิเสธคำขอลาแล้ว"

8. ดึงคำขอที่อนุมัติแล้ว (status = 'approved')
   ```sql
   SELECT lr.leave_id, lr.user_id, lr.start_date, lr.end_date,
          lr.leave_days, lr.leave_type, lr.reason, lr.status,
          lr.request_date, lr.response_date,
          u.name as requester_name
   FROM leave_requests lr
   INNER JOIN users u ON lr.user_id = u.user_id
   WHERE u.department_id = {departmentId}
     AND lr.status = 'approved'
   ORDER BY lr.response_date DESC
   ```

10. ดึงคำขอที่ปฏิเสธแล้ว (status = 'rejected')
    ```sql
    SELECT lr.leave_id, lr.user_id, lr.start_date, lr.end_date,
           lr.leave_days, lr.leave_type, lr.reason, lr.reason_reject,
           lr.status, lr.request_date, lr.response_date,
           u.name as requester_name
    FROM leave_requests lr
    INNER JOIN users u ON lr.user_id = u.user_id
    WHERE u.department_id = {departmentId}
      AND lr.status = 'rejected'
    ORDER BY lr.response_date DESC
    ```

12. ดึงคำขอทั้งหมด (all status)
    ```sql.
    SELECT lrleave_id, lr.user_id, lr.start_date, lr.end_date,
           lr.leave_days, lr.leave_type, lr.reason, lr.reason_reject,
           lr.status, lr.request_date, lr.response_date,
           u.name as requester_name
    FROM leave_requests lr
    INNER JOIN users u ON lr.user_id = u.user_id
    WHERE u.department_id = {departmentId}
    ORDER BY lr.request_date DESC
    ```

## Business Rules:
- ✅ อนุมัติได้เฉพาะคำขอในแผนกของตัวเอง
- ✅ อนุมัติได้เฉพาะคำขอ status = 'pending'
- ✅ เมื่อ **อนุมัติ** → ลบ shift_assignments + ลบ work_reports
- ✅ เมื่อ **ปฏิเสธ** → เปลี่ยนสถานะอย่างเดียว (เวรยังอยู่)
- ✅ ต้องระบุเหตุผลเมื่อปฏิเสธ (reason_reject)
- ⚠️ ตัดสินแล้วไม่สามารถเปลี่ยนใจได้

## Features:
- 🔔 **แจ้งเตือน**: เห็นคำขอใหม่ที่รอพิจารณา
- 👀 **รายละเอียด**: ดูข้อมูลพยาบาล + วันที่ลา + เหตุผล
- ✅ **อนุมัติ**: อนุมัติและยกเลิกเวรอัตโนมัติ
- ❌ **ปฏิเสธ**: ปฏิเสธพร้อมระบุเหตุผล
- 🔍 **กรองสถานะ**: ดูแยกตาม pending/approved/rejected/all
- 📊 **Dashboard**: ดูจำนวนคำขอรอพิจารณา

## Transaction Flow (กรณีอนุมัติ):
```
1. UPDATE leave_requests → approved
2. SELECT shift_assignments (ที่จะลบ)
3. DELETE shift_assignments (ยกเลิกเวร)
4. DELETE work_reports (ถ้ามี)
5. แสดงข้อความสำเร็จ
```

## Impact:
- 📅 **เวร**: เวรถูกยกเลิกทันที (อนุมัติ)
- 📊 **รายงาน**: work_reports ถูกลบ (ต้องส่งใหม่)
- 👥 **ทีม**: เวรที่ขาดคนต้องจัดเวรใหม่
- 🔄 **ย้อนกลับไม่ได้**: เมื่อตัดสินแล้วจะเปลี่ยนแปลงไม่ได้

## Note:
⚠️ **สำคัญ**: เมื่ออนุมัติคำขอลา หัวหน้าพยาบาลต้องจัดหาคนมาทดแทนเวรที่หายไปด้วย

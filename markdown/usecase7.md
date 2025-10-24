# Use Case 7: ขอแลกเวร (พยาบาล)

## Actor Actions:
1. คลิกเข้าเมนู "ขอแลกเวร"
3. เลือกเวรของตัวเองที่ต้องการแลก
5. เลือกวันที่ของเพื่อนที่ต้องการแลก
7. เลือกเพื่อนที่ต้องการแลกเวรด้วย
9. ใส่เหตุผลของการแลกเวร
11. กดปุ่ม "ส่งคำขอแลกเวร"
13. ตรวจสอบสถานะคำขอ (คลิกแถบ "คำขอของฉัน")
15. ดูประวัติคำขอ (คลิกแถบ "ประวัติ")

## System Actions:
2. ดึงข้อมูลเวรของตัวเองในเดือนปัจจุบัน
   ```sql
   SELECT s.schedules_id, s.date, s.shift_type,
          s.department_id, s.status, sa.assignment_id
   FROM schedules s
   INNER JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id
   WHERE sa.user_id = {userId}
     AND s.date >= '{monthStart}' AND s.date <= '{monthEnd}'
     AND s.status = 'published'
   ORDER BY s.date ASC
   ```

4. ดึงเวรที่สามารถแลกได้ (เวรของเพื่อน ๆ ในแผนกเดียวกัน)
   ```sql
   SELECT s.schedules_id, s.date, s.shift_type,
          s.department_id, s.status,
          u.user_id, u.name, u.email, sa.assignment_id
   FROM schedules s
   INNER JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id
   INNER JOIN users u ON sa.user_id = u.user_id
   WHERE s.department_id = {departmentId}
     AND s.date >= '{monthStart}' AND s.date <= '{monthEnd}'
     AND s.status = 'published'
     AND s.schedules_id NOT IN (
       SELECT schedules_id
       FROM shift_assignments
       WHERE user_id = {userId}
     )
   ORDER BY s.date ASC
   ```

6. แสดงรายชื่อพยาบาลในเวรที่เลือก
   - ใช้ข้อมูลจาก Query ข้อ 4

8. แสดงฟอร์มกรอกเหตุผล
   - รอรับ input เหตุผลจากผู้ใช้

10. ตรวจสอบความถูกต้องของคำขอแลกเวร
    - Query 10a (เช็คว่ามีคำขอ pending อยู่หรือไม่):
      ```sql
      SELECT exchange_id
      FROM shift_exchange_requests
      WHERE status = 'pending'
        AND (
          (requester_id = {requesterId} AND original_schedule_id = {originalScheduleId})
          OR (target_user_id = {requesterId} AND original_schedule_id = {originalScheduleId})
        )
      ```
    - Query 10b (เช็คว่าผู้ขอมีเวรซ้ำกับเวรปลายทางหรือไม่):
      ```sql
      SELECT sa.assignment_id
      FROM shift_assignments sa
      INNER JOIN schedules s ON sa.schedules_id = s.schedules_id
      WHERE sa.user_id = {requesterId}
        AND s.date = '{targetDate}'
        AND s.shift_type = '{targetShiftType}'
      ```
    - Query 10c (เช็คว่าเพื่อนมีเวรซ้ำกับเวรต้นทางหรือไม่):
      ```sql
      SELECT sa.assignment_id
      FROM shift_assignments sa
      INNER JOIN schedules s ON sa.schedules_id = s.schedules_id
      WHERE sa.user_id = {targetUserId}
        AND s.date = '{originalDate}'
        AND s.shift_type = '{originalShiftType}'
      ```
    - ถ้าผ่านทุกเงื่อนไข → บันทึกคำขอ:
      ```sql
      INSERT INTO shift_exchange_requests
        (requester_id, target_user_id, original_schedule_id,
         target_schedule_id, request_date, reason, status)
      VALUES
        ({requesterId}, {targetUserId}, {originalScheduleId},
         {targetScheduleId}, NOW(), '{reason}', 'pending')
      ```

12. แสดงข้อความว่าส่งคำขอสำเร็จ

14. แสดงคำขอทั้งหมดของตัวเอง (status = 'pending')
    ```sql
    SELECT ser.exchange_id, ser.requester_id, ser.target_user_id,
           ser.original_schedule_id, ser.target_schedule_id,
           ser.request_date, ser.reason, ser.status,
           u.name as target_user_name, u.email as target_user_email,
           s1.date as original_date, s1.shift_type as original_shift_type,
           s2.date as target_date, s2.shift_type as target_shift_type
    FROM shift_exchange_requests ser
    INNER JOIN users u ON ser.target_user_id = u.user_id
    INNER JOIN schedules s1 ON ser.original_schedule_id = s1.schedules_id
    LEFT JOIN schedules s2 ON ser.target_schedule_id = s2.schedules_id
    WHERE ser.requester_id = {userId}
      AND ser.status = 'pending'
    ORDER BY ser.request_date DESC
    ```

16. แสดงประวัติคำขอที่ผ่านมา (approved/rejected)
    - Query 16a (คำขอที่ส่งไป):
      ```sql
      SELECT ser.exchange_id, ser.requester_id, ser.target_user_id,
             ser.request_date, ser.reason, ser.status,
             u.name as target_user_name,
             s1.date as original_date, s1.shift_type as original_shift_type,
             s2.date as target_date, s2.shift_type as target_shift_type,
             'my' as type
      FROM shift_exchange_requests ser
      INNER JOIN users u ON ser.target_user_id = u.user_id
      INNER JOIN schedules s1 ON ser.original_schedule_id = s1.schedules_id
      LEFT JOIN schedules s2 ON ser.target_schedule_id = s2.schedules_id
      WHERE ser.requester_id = {userId}
        AND ser.status IN ('approved', 'rejected')
      ORDER BY ser.request_date DESC
      ```
    - Query 16b (คำขอที่ได้รับและตอบไปแล้ว):
      ```sql
      SELECT ser.exchange_id, ser.requester_id, ser.target_user_id,
             ser.request_date, ser.reason, ser.status,
             u.name as requester_name,
             s1.date as original_date, s1.shift_type as original_shift_type,
             s2.date as target_date, s2.shift_type as target_shift_type,
             'incoming' as type
      FROM shift_exchange_requests ser
      INNER JOIN users u ON ser.requester_id = u.user_id
      INNER JOIN schedules s1 ON ser.original_schedule_id = s1.schedules_id
      LEFT JOIN schedules s2 ON ser.target_schedule_id = s2.schedules_id
      WHERE ser.target_user_id = {userId}
        AND ser.status IN ('approved', 'rejected')
      ORDER BY ser.request_date DESC
      ```

## Business Rules:
- ✅ แลกได้เฉพาะเวรที่ประกาศแล้ว (status = 'published')
- ✅ แลกได้เฉพาะในแผนกเดียวกัน
- ✅ ไม่สามารถมีคำขอ pending ซ้ำสำหรับเวรเดียวกัน
- ✅ ผู้ขอต้องไม่มีเวรซ้ำกับเวรปลายทาง
- ✅ เพื่อนต้องไม่มีเวรซ้ำกับเวรต้นทาง
- ⚠️ ต้องรอเพื่อนอนุมัติก่อนจึงจะแลกเวรได้

## Features:
- 📤 **ส่งคำขอ**: ขอแลกเวรกับเพื่อนในแผนก
- 📋 **ติดตามสถานะ**: ดูสถานะคำขอแบบ real-time
- 📜 **ประวัติ**: ดูประวัติคำขอที่ผ่านมา (อนุมัติ/ปฏิเสธ)
- 🔄 **แลกสองทาง**: แลกเวรกันได้ (swap shifts)

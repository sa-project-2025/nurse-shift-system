# Use Case 9: ขอลางาน (พยาบาล)

## Actor Actions:
1. คลิกเข้าเมนู "ขอลางาน"
3. กรอกข้อมูลคำขอลางาน:
   - เลือกประเภทการลา (sick/personal/vacation/other)
   - เลือกวันที่เริ่มต้นและสิ้นสุด
   - กรอกเหตุผล
5. ตรวจสอบเวรที่ได้รับผลกระทบ
7. กดปุ่ม "ส่งคำขอลางาน"
9. ดูคำขอที่รอการอนุมัติ (tab "รอการอนุมัติ")
11. ดูคำขอที่อนุมัติแล้ว (tab "อนุมัติแล้ว")
13. ดูคำขอที่ไม่อนุมัติ (tab "ไม่อนุมัติ")
15. ดูคำขอทั้งหมด (tab "ทั้งหมด")
17. ดูรายละเอียดคำขอแต่ละรายการ

## System Actions:
2. แสดงแบบฟอร์มคำขอลางาน
   - แสดงฟิลด์: ประเภทการลา, วันเริ่มต้น, วันสิ้นสุด, เหตุผล

4. ดึงเวรที่จะได้รับผลกระทบจากการลา
   ```sql
   SELECT s.schedules_id, s.date, s.shift_type, s.status
   FROM schedules s
   INNER JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id
   WHERE sa.user_id = {userId}
     AND s.date BETWEEN '{startDate}' AND '{endDate}'
     AND s.status = 'published'
   ORDER BY s.date, s.shift_type
   ```

6. แสดงจำนวนวันลาและเวรที่ได้รับผลกระทบ
   - คำนวณ: จำนวนวันลา = (endDate - startDate) + 1
   - แสดง: รายการเวรที่จะหายไป

8. ตรวจสอบความถูกต้องของคำขอ
   - Validation 8a: ตรวจสอบข้อมูลครบถ้วน
     * ต้องมี: userId, startDate, endDate, leaveType, reason
     * endDate >= startDate

   - Validation 8b: ตรวจสอบคำขอซ้อนทับ
     ```sql
     SELECT leave_id, start_date, end_date, leave_type
     FROM leave_requests
     WHERE user_id = {userId}
       AND status = 'pending'
       AND (
         (start_date <= '{endDate}' AND end_date >= '{startDate}')
       )
     ```

   - ถ้าผ่านทุกเงื่อนไข → บันทึกคำขอ:
     ```sql
     INSERT INTO leave_requests
       (user_id, start_date, end_date, leave_days,
        leave_type, reason, status, request_date)
     VALUES
       ({userId}, '{startDate}', '{endDate}', {leaveDays},
        '{leaveType}', '{reason}', 'pending', NOW())
     ```

10. แสดงข้อความส่งคำขอสำเร็จ

12. ดึงคำขอที่รอการอนุมัติ (status = 'pending')
    ```sql
    SELECT leave_id, user_id, start_date, end_date,
           leave_days, leave_type, reason, status,
           request_date, response_date, approved_by
    FROM leave_requests
    WHERE user_id = {userId}
      AND status = 'pending'
    ORDER BY request_date DESC
    ```

14. ดึงคำขอที่อนุมัติแล้ว (status = 'approved')
    ```sql
    SELECT leave_id, user_id, start_date, end_date,
           leave_days, leave_type, reason, status,
           request_date, response_date, approved_by
    FROM leave_requests
    WHERE user_id = {userId}
      AND status = 'approved'
    ORDER BY request_date DESC
    ```

16. ดึงคำขอที่ไม่อนุมัติ (status = 'rejected')
    ```sql
    SELECT leave_id, user_id, start_date, end_date,
           leave_days, leave_type, reason, reason_reject,
           status, request_date, response_date, approved_by
    FROM leave_requests
    WHERE user_id = {userId}
      AND status = 'rejected'
    ORDER BY request_date DESC
    ```

17. แสดงรายการคำขอทั้งหมด
    - แสดงข้อมูลจาก Query ข้อ 12, 14, 16, หรือ 18 (ตาม tab ที่เลือก)

18. ดึงคำขอทั้งหมด (all status)
    ```sql
    SELECT leave_id, user_id, start_date, end_date,
           leave_days, leave_type, reason, reason_reject,
           status, request_date, response_date, approved_by
    FROM leave_requests
    WHERE user_id = {userId}
    ORDER BY request_date DESC
    ```

## Business Rules:
- ✅ วันสิ้นสุดต้อง >= วันเริ่มต้น
- ✅ ไม่สามารถมีคำขอ pending ซ้อนทับกัน
- ✅ ต้องกรอกข้อมูลครบถ้วน (ประเภท, วันที่, เหตุผล)
- ⚠️ แสดงเวรที่จะได้รับผลกระทบก่อนส่งคำขอ
- ⚠️ ส่งคำขอแล้วแก้ไขไม่ได้ (ต้องรอหัวหน้าพยาบาลพิจารณา)

## Features:
- 📝 **ฟอร์มขอลา**: เลือกประเภท, วันที่, เหตุผล
- 📊 **เวรที่ได้รับผลกระทบ**: ดูเวรที่จะหายไปก่อนส่งคำขอ
- 🔍 **กรองสถานะ**: ดูคำขอแยกตามสถานะ (pending/approved/rejected/all)
- 📅 **ประเภทการลา**:
  - sick (ลาป่วย)
  - personal (ลากิจ)
  - vacation (ลาพักร้อน)
  - other (อื่น ๆ)
- 📜 **ประวัติ**: ดูประวัติคำขอลาทั้งหมด

## Validation:
1. ✅ ข้อมูลครบถ้วน
2. ✅ วันที่ถูกต้อง (end >= start)
3. ✅ ไม่ซ้อนทับคำขอ pending
4. ✅ มีเวรในช่วงที่ขอลาหรือไม่ (optional warning)

## Status Flow:
```
pending → (รอหัวหน้าพยาบาลพิจารณา)
   ↓
approved (อนุมัติ) → เวรถูกยกเลิก
   หรือ
rejected (ไม่อนุมัติ) → เวรยังคงอยู่
```

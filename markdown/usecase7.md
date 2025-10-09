# Use Case 7: ส่งคำขอแลกเวร

## Actor
พยาบาล (Nurse)

## Precondition
- พยาบาลต้อง login เข้าสู่ระบบแล้ว
- พยาบาลต้องมีเวรที่ถูกประกาศแล้ว (published schedule)

## Main Flow

### 1. Actor: คลิกเข้าเมนู "ขอแลกเวร"
พยาบาลเข้าสู่หน้าจัดการคำขอแลกเวร

---

### 2. System: ดึงข้อมูลวันที่มีเวรของตัวเองในเดือนปัจจุบัน

**ตาราง:** `schedules`, `shift_assignments`, `users`

```sql
-- ดึงเวรของพยาบาลในเดือนปัจจุบัน
SELECT
  s.schedules_id,
  s.date,
  s.shift_type,
  s.department_id,
  s.status,
  sa.assignment_id
FROM schedules s
JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id
WHERE sa.user_id = :userId
  AND s.date >= '2025-10-01'
  AND s.date <= '2025-10-31'
  AND s.status = 'published'
ORDER BY s.date ASC;
```

---

### 3 Actor: เลือกเดือนและวันที่จะแลกเวรของตัวเอง 
### 4.กดปุ่ม "ถัดไป"
พยาบาลเลือกเวรของตัวเองที่ต้องการแลก (Step 1 ของ wizard UI)

---

### 5. System: แสดงข้อมูลเวรที่สามารถแลกได้ของเพื่อน

**ตาราง:** `schedules`, `shift_assignments`, `users`

```sql
-- ดึงเวรทั้งหมดในแผนกที่ไม่มีตัวเองอยู่
SELECT
  s.schedules_id,
  s.date,
  s.shift_type,
  s.department_id,
  s.status,
  json_agg(
    json_build_object(
      'user_id', u.user_id,
      'name', u.name,
      'email', u.email,
      'assignment_id', sa.assignment_id
    )
  ) as nurses
FROM schedules s
JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id
JOIN users u ON sa.user_id = u.user_id
WHERE s.department_id = :departmentId
  AND s.date >= '2025-10-01'
  AND s.date <= '2025-10-31'
  AND s.status = 'published'
  AND s.schedules_id NOT IN (
    -- ยกเว้นเวรที่ตัวเองอยู่
    SELECT schedules_id
    FROM shift_assignments
    WHERE user_id = :excludeUserId
  )
GROUP BY s.schedules_id
ORDER BY s.date ASC;
```

---

### 6. Actor: กดเวรที่ต้องการแลกของเพื่อน
### 7.กดปุ่ม "ถัดไป"
พยาบาลเลือกเวรปลายทางที่ต้องการแลก (Step 2 ของ wizard UI)

---

### 8. System: แสดงรายชื่อพยาบาลในเวรที่เลือก
ระบบแสดงรายชื่อพยาบาลที่ทำงานในเวรที่เลือก (ข้อมูลมาจาก query ในข้อ 5)

---

### 9. Actor: กดเลือกเพื่อนที่ต้องการแลกด้วย
### 10.Actor: กดปุ่ม "ถัดไป"
พยาบาลเลือกพยาบาลคนที่ต้องการแลกเวรด้วย (Step 3 ของ wizard UI)

---

### 11. Actor: ใส่เหตุผลของการแลกเวรและกดปุ่ม "ส่งคำขอแลกเวร"
พยาบาลกรอกเหตุผลในการขอแลกเวร (Step 4 ของ wizard UI)

---

### 12. System: 

**การตรวจสอบ:**

### 12a. **ตรวจสอบว่ามีคำขอ pending อยู่แล้วหรือไม่**
```sql
-- ตรวจสอบคำขอที่รอการอนุมัติ
SELECT exchange_id
FROM shift_exchange_requests
WHERE status = 'pending'
  AND (
    (requester_id = :requesterId AND original_schedule_id = :originalScheduleId)
    OR (target_user_id = :requesterId AND original_schedule_id = :originalScheduleId)
  );
```

### 12b. **ตรวจสอบว่าผู้ขอมีเวรซ้ำกับเวรปลายทางหรือไม่**
```sql
-- ตรวจสอบว่า requester มีเวรกะเดียวกันในวันเดียวกันหรือไม่
SELECT sa.assignment_id
FROM shift_assignments sa
JOIN schedules s ON sa.schedules_id = s.schedules_id
WHERE sa.user_id = :requesterId
  AND s.date = :targetDate
  AND s.shift_type = :targetShiftType;
```

### 12c. **ตรวจสอบว่าพยาบาลที่ถูกขอมีเวรซ้ำกับเวรต้นทางหรือไม่**
```sql
-- ตรวจสอบว่า target user มีเวรกะเดียวกันในวันเดียวกันหรือไม่
SELECT sa.assignment_id
FROM shift_assignments sa
JOIN schedules s ON sa.schedules_id = s.schedules_id
WHERE sa.user_id = :targetUserId
  AND s.date = :originalDate
  AND s.shift_type = :originalShiftType;
```

**ถ้าผ่านการตรวจสอบทั้งหมด:**

**ตาราง:** `shift_exchange_requests`

```sql
-- สร้างคำขอแลกเวร
INSERT INTO shift_exchange_requests (
  requester_id,
  target_user_id,
  original_schedule_id,
  target_schedule_id,
  request_date,
  reason,
  status
) VALUES (
  :requesterId,
  :targetUserId,
  :originalScheduleId,
  :targetScheduleId,
  NOW() AT TIME ZONE 'Asia/Bangkok', -- เวลาไทย GMT+7
  :reason,
  'pending'
);
```

---

### 13. Actor: กลับไปทำตั้งแต่ข้อ 10 จนกว่าจะส่งคำขอแลกเวรได้
หากการตรวจสอบไม่ผ่าน พยาบาลต้องแก้ไขข้อมูลและส่งใหม่

**ข้อความ error ที่อาจเกิด:**
- "คุณมีคำขอแลกเวรที่รอการอนุมัติอยู่แล้วสำหรับเวรนี้"
- "คุณมีเวรกะ morning อยู่แล้วในวันที่ 2025-10-15 ไม่สามารถแลกเวรได้"
- "พยาบาลที่คุณเลือกมีเวรกะ afternoon อยู่แล้วในวันที่ 2025-10-10 ไม่สามารถแลกเวรได้"

---

### 14. System: ระบบแสดงข้อความว่าส่งคำขอสำเร็จ
แสดง toast notification: "ส่งคำขอแลกเวรเรียบร้อยแล้ว"

---

### 15. Actor: กดแถบ "คำขอของฉัน" เพื่อติดตามสถานะคำขอแลกเวร
พยาบาลเปลี่ยนไปยัง tab "คำขอของฉัน"

---

### 16. System: ระบบแสดงคำขอทั้งหมดของตัวเอง

**ตาราง:** `shift_exchange_requests`, `users`, `schedules`

```sql
-- ดึงคำขอแลกเวรทั้งหมดของผู้ใช้
SELECT
  ser.exchange_id,
  ser.requester_id,
  ser.target_user_id,
  ser.original_schedule_id,
  ser.target_schedule_id,
  ser.request_date,
  ser.reason,
  ser.status,
  u.name as target_user_name,
  u.email as target_user_email,
  s1.date as original_date,
  s1.shift_type as original_shift_type,
  s2.date as target_date,
  s2.shift_type as target_shift_type
FROM shift_exchange_requests ser
JOIN users u ON ser.target_user_id = u.user_id
JOIN schedules s1 ON ser.original_schedule_id = s1.schedules_id
LEFT JOIN schedules s2 ON ser.target_schedule_id = s2.schedules_id
WHERE ser.requester_id = :userId
ORDER BY ser.request_date DESC;
```

แสดงสถานะ:
- 🟡 รอตอบรับ (pending)
- 🟢 อนุมัติ (approved)
- 🔴 ปฏิเสธ (rejected)

---

### 17. Actor: กดแถบ "ประวัติ" เพื่อดูประวัติคำขอแลกเวรที่ผ่านมา
พยาบาลเปลี่ยนไปยัง tab "ประวัติ"

---

### 18. System: แสดงรายการคำขอแลกเวรที่ผ่านมาที่ถูกอนุมัติหรือถูกปฏิเสธ

**ตาราง:** `shift_exchange_requests`, `users`, `schedules`
### 18a.ดึงประวัติคำขอของตัวเอง (ที่ส่งไป)
```sql
SELECT
  ser.exchange_id,
  ser.requester_id,
  ser.target_user_id,
  ser.request_date,
  ser.reason,
  ser.status,
  u.name as target_user_name,
  s1.date as original_date,
  s1.shift_type as original_shift_type,
  s2.date as target_date,
  s2.shift_type as target_shift_type,
  'my' as type
FROM shift_exchange_requests ser
JOIN users u ON ser.target_user_id = u.user_id
JOIN schedules s1 ON ser.original_schedule_id = s1.schedules_id
LEFT JOIN schedules s2 ON ser.target_schedule_id = s2.schedules_id
WHERE ser.requester_id = :userId
  AND ser.status IN ('approved', 'rejected')

UNION ALL
```
### 18b ดึงประวัติคำขอที่ได้รับ (ที่ตอบไปแล้ว)
```sql
SELECT
  ser.exchange_id,
  ser.requester_id,
  ser.target_user_id,
  ser.request_date,
  ser.reason,
  ser.status,
  u.name as requester_name,
  s1.date as original_date,
  s1.shift_type as original_shift_type,
  s2.date as target_date,
  s2.shift_type as target_shift_type,
  'incoming' as type
FROM shift_exchange_requests ser
JOIN users u ON ser.requester_id = u.user_id
JOIN schedules s1 ON ser.original_schedule_id = s1.schedules_id
LEFT JOIN schedules s2 ON ser.target_schedule_id = s2.schedules_id
WHERE ser.target_user_id = :userId
  AND ser.status IN ('approved', 'rejected')

ORDER BY request_date DESC;
```

แสดง:
- 📤 คำขอของฉัน - คำขอที่ตัวเองส่งไป
- 📥 คำขอที่ได้รับ - คำขอที่คนอื่นส่งมาและตัวเองตอบไปแล้ว
- เรียงตามเวลาล่าสุดก่อน

---

## Postcondition
- คำขอแลกเวรถูกบันทึกในระบบ
- พยาบาลที่ถูกขอแลกเวรได้รับการแจ้งเตือน (เห็นตัวเลขแจ้งเตือนที่เมนู "ขอแลกเวร")
- คำขอมีสถานะเป็น "pending" รอการอนุมัติ

---

## Alternative Flow

### A1: มีคำขอ pending อยู่แล้ว
- ระบบแสดงข้อความ: "คุณมีคำขอแลกเวรที่รอการอนุมัติอยู่แล้วสำหรับเวรนี้"
- ไม่สามารถส่งคำขอซ้ำได้

### A2: ผู้ขอมีเวรซ้ำกับเวรปลายทาง
- ระบบแสดงข้อความ: "คุณมีเวรกะ [shift_type] อยู่แล้วในวันที่ [date] ไม่สามารถแลกเวรได้"
- ต้องเลือกเวรอื่นที่ไม่ซ้ำกัน

### A3: พยาบาลที่ถูกขอมีเวรซ้ำกับเวรต้นทาง
- ระบบแสดงข้อความ: "พยาบาลที่คุณเลือกมีเวรกะ [shift_type] อยู่แล้วในวันที่ [date] ไม่สามารถแลกเวรได้"
- ต้องเลือกพยาบาลคนอื่น

---

## Business Rules
1. **ห้ามมีเวรซ้ำกัน:** พยาบาล 1 คนไม่สามารถมีเวรกะเดียวกันในวันเดียวกันได้ (แต่สามารถมีหลายกะในวันเดียวกันได้)
2. **ห้ามส่งคำขอซ้ำ:** ต้องรอการตอบรับคำขอเก่าก่อนจึงจะส่งคำขอใหม่ได้
3. **เวรต้องเป็น published:** สามารถแลกได้เฉพาะเวรที่ประกาศแล้วเท่านั้น
4. **บันทึกเวลาไทย:** `request_date` บันทึกเป็น timestamp ตามเวลาประเทศไทย (GMT+7)
5. **แสดงเวลาปัจจุบัน:** คำขอที่ส่งล่าสุดแสดงก่อนในทุก tab

---

## UI Components
- **Step Progress Bar:** แสดงขั้นตอนการแลกเวร (1-4)
- **Calendar View:** แสดงเวรในรูปแบบปฏิทิน
- **Shift Cards:** การ์ดแสดงข้อมูลเวร (เช้า/บ่าย/ดึก)
- **Nurse Selection Cards:** การ์ดเลือกพยาบาล
- **Toast Notification:** แจ้งเตือนสถานะการส่งคำขอ
- **Badge Notification:** แสดงจำนวนคำขอที่เมนู

---

## Related Files
- `/src/app/dashboard/nurse/shift-exchange/page.tsx` - หน้า UI หลัก
- `/src/app/api/nurse/shift-exchange/create/route.ts` - API สร้างคำขอ
- `/src/app/api/nurse/shift-exchange/my-requests/route.ts` - API ดึงคำขอของตัวเอง
- `/src/app/api/nurse/shift-exchange/incoming-history/route.ts` - API ดึงประวัติคำขอที่ได้รับ
- `/src/app/api/nurse/all-schedules/route.ts` - API ดึงเวรทั้งหมดในแผนก
- `/src/app/api/nurse/my-schedule/route.ts` - API ดึงเวรของตัวเอง

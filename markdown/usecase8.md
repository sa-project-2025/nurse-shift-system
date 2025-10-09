# Use Case 8: อนุมัติ/ปฏิเสธ การแลกเวร

## Actor
พยาบาล (Nurse) - ผู้ได้รับคำขอแลกเวร

## Precondition
- พยาบาลต้อง login เข้าสู่ระบบแล้ว
- มีคำขอแลกเวรที่รอการตอบรับ (status = 'pending')
- พยาบาลได้รับการแจ้งเตือนที่เมนู "ขอแลกเวร" (มี badge สีแดงแสดงจำนวน)

## Main Flow

### 1. Actor: คลิกเข้าเมนู "ขอแลกเวร" ที่มีแจ้งเตือนขึ้น
พยาบาลเห็น badge แจ้งเตือนและเข้าสู่หน้าจัดการคำขอแลกเวร

---

### 2. Actor: กดแถบ "คำขอจากเพื่อน"
พยาบาลเปลี่ยนไปยัง tab "คำขอจากเพื่อน"

---

### 3. System: แสดงคำขอที่ถูกส่งมาจากต้นทาง

**ตาราง:** `shift_exchange_requests`, `users`, `schedules`

```sql
-- ดึงคำขอที่รอการตอบรับ
SELECT
  ser.exchange_id,
  ser.requester_id,
  ser.target_user_id,
  ser.original_schedule_id,
  ser.target_schedule_id,
  ser.request_date,
  ser.reason,
  ser.status,
  u.name as requester_name,
  u.email as requester_email,
  s1.date as original_date,
  s1.shift_type as original_shift_type,
  s2.date as target_date,
  s2.shift_type as target_shift_type
FROM shift_exchange_requests ser
JOIN users u ON ser.requester_id = u.user_id
JOIN schedules s1 ON ser.original_schedule_id = s1.schedules_id
LEFT JOIN schedules s2 ON ser.target_schedule_id = s2.schedules_id
WHERE ser.target_user_id = :userId
  AND ser.status = 'pending'
ORDER BY ser.request_date DESC;
```

แสดงข้อมูล:
- ชื่อผู้ขอแลกเวร
- เวรที่ผู้ขอต้องการแลก
- เวรของตัวเองที่จะถูกแลก
- เหตุผลในการแลก
- เวลาที่ส่งคำขอ

---

### 4. Actor: กดปุ่ม "ยอมรับ" หรือ "ปฏิเสธ" คำขอแลกเวร
พยาบาลตัดสินใจตอบรับหรือปฏิเสธคำขอ

---

### 5. System: ระบบเปลี่ยนสถานะคำขอแลกเวรตามที่กด

#### 5a. กรณีกดปุ่ม "ยอมรับ" (approved)

**ตาราง:** `shift_exchange_requests`, `shift_assignments`, `work_reports`

**5a.1 อัปเดตสถานะคำขอ**
```sql
-- อัปเดตสถานะเป็น approved
UPDATE shift_exchange_requests
SET status = 'approved'
WHERE exchange_id = :exchangeId;
```

**5a.2 ดึงข้อมูล assignment ทั้งสองฝ่าย**
```sql
-- ดึง assignment_id ของผู้ขอ (requester)
SELECT assignment_id, user_id
FROM shift_assignments
WHERE schedules_id = :originalScheduleId
  AND user_id = :requesterId;

-- ดึง assignment_id ของผู้ถูกขอ (target)
SELECT assignment_id, user_id
FROM shift_assignments
WHERE schedules_id = :targetScheduleId
  AND user_id = :targetUserId;
```

**5a.3 สลับ user_id ใน shift_assignments**
```sql
-- สลับ assignment ของผู้ขอ
UPDATE shift_assignments
SET user_id = :targetUserId
WHERE assignment_id = :requesterAssignmentId;

-- สลับ assignment ของผู้ถูกขอ
UPDATE shift_assignments
SET user_id = :requesterId
WHERE assignment_id = :targetAssignmentId;
```

**5a.4 ลบ work_reports ของทั้งสองคนในเดือนนั้น**
```sql
-- ลบ work_report ของผู้ขอ
DELETE FROM work_reports
WHERE user_id = :requesterId
  AND report_month = :reportMonth; -- เดือนของเวรที่แลก (YYYY-MM)

-- ลบ work_report ของผู้ถูกขอ
DELETE FROM work_reports
WHERE user_id = :targetUserId
  AND report_month = :reportMonth;
```

**เหตุผล:** เมื่อเวรถูกแลก พยาบาลต้องบันทึกการทำงานใหม่ตามเวรที่ได้รับมอบหมายใหม่

---

#### 5b. กรณีกดปุ่ม "ปฏิเสธ" (rejected)

**ตาราง:** `shift_exchange_requests`

```sql
-- อัปเดตสถานะเป็น rejected
UPDATE shift_exchange_requests
SET status = 'rejected'
WHERE exchange_id = :exchangeId;
```

**ไม่มีการเปลี่ยนแปลง:**
- shift_assignments ยังคงเดิม
- work_reports ยังคงเดิม

---

### 6. System: แสดงผลการดำเนินการ

**กรณียอมรับ:**
- แสดง toast notification: "ยอมรับคำขอแลกเวรเรียบร้อยแล้ว"
- คำขอหายจาก tab "คำขอจากเพื่อน"
- เวรในปฏิทินถูกอัปเดต
- work_report ของเดือนนั้นถูกลบ (ต้องบันทึกใหม่)

**กรณีปฏิเสธ:**
- แสดง toast notification: "ปฏิเสธคำขอแลกเวรเรียบร้อยแล้ว"
- คำขอหายจาก tab "คำขอจากเพื่อน"
- เวรคงเดิม (ไม่มีการเปลี่ยนแปลง)

---

### 7. System: อัปเดต badge notification
- ลดจำนวน badge ที่เมนู "ขอแลกเวร" ลง 1
- รีเฟรชรายการคำขอที่รอการตอบรับ

---

### 8. Actor: ตรวจสอบประวัติการตอบรับ
พยาบาลสามารถดูประวัติการตอบรับคำขอได้ที่ tab "ประวัติ"

**ตาราง:** `shift_exchange_requests`, `users`, `schedules`

```sql
-- ดึงประวัติคำขอที่ได้รับและตอบรับไปแล้ว
SELECT
  ser.exchange_id,
  ser.requester_id,
  ser.target_user_id,
  ser.request_date,
  ser.reason,
  ser.status,
  u.name as requester_name,
  u.email as requester_email,
  s1.date as original_date,
  s1.shift_type as original_shift_type,
  s2.date as target_date,
  s2.shift_type as target_shift_type
FROM shift_exchange_requests ser
JOIN users u ON ser.requester_id = u.user_id
JOIN schedules s1 ON ser.original_schedule_id = s1.schedules_id
LEFT JOIN schedules s2 ON ser.target_schedule_id = s2.schedules_id
WHERE ser.target_user_id = :userId
  AND ser.status IN ('approved', 'rejected')
ORDER BY ser.request_date DESC;
```

แสดง:
- 📥 คำขอที่ได้รับ
- 🟢 อนุมัติ หรือ 🔴 ปฏิเสธ
- เรียงตามเวลาล่าสุดก่อน

---

## Postcondition

**กรณีอนุมัติ:**
- คำขอมีสถานะเป็น "approved"
- shift_assignments ถูกสลับ (ผู้ขอและผู้ถูกขอแลกเวรกัน)
- work_reports ของทั้งสองคนในเดือนนั้นถูกลบ
- ผู้ขอได้รับแจ้งว่าคำขอได้รับการอนุมัติ

**กรณีปฏิเสธ:**
- คำขอมีสถานะเป็น "rejected"
- shift_assignments ยังคงเดิม (ไม่มีการเปลี่ยนแปลง)
- work_reports ยังคงเดิม
- ผู้ขอได้รับแจ้งว่าคำขอถูกปฏิเสธ

---

## Alternative Flow

### A1: ไม่มีคำขอที่รอการตอบรับ
- แสดงข้อความ: "ไม่มีคำขอแลกเวรจากเพื่อน"
- Badge notification แสดง 0

### A2: คำขอถูกยกเลิกโดยผู้ขอก่อนที่จะตอบรับ
- แสดงข้อความ error: "คำขอนี้ถูกยกเลิกแล้ว"
- รีเฟรชรายการคำขอ

---

## Business Rules

1. **เฉพาะคำขอ pending:** สามารถตอบรับได้เฉพาะคำขอที่มีสถานะ pending เท่านั้น
2. **ลบ work_report เมื่ออนุมัติ:** เมื่อแลกเวรสำเร็จ work_report ของทั้งสองคนในเดือนนั้นจะถูกลบ เพราะเวรเปลี่ยนแล้ว
3. **ห้ามแก้ไขหลังตอบรับ:** เมื่อตอบรับ (approved/rejected) แล้วไม่สามารถเปลี่ยนใจได้
4. **สลับเฉพาะ assignment:** ระบบสลับเฉพาะ user_id ใน shift_assignments ไม่ได้สร้าง assignment ใหม่
5. **Real-time notification:** Badge แสดงจำนวนคำขอที่รอการตอบรับแบบ real-time (รีเฟรชทุก 30 วินาที)

---

## UI Components

- **Badge Notification:** แสดงจำนวนคำขอที่เมนู "ขอแลกเวร"
- **Request Cards:** การ์ดแสดงรายละเอียดคำขอแลกเวร
- **Action Buttons:** ปุ่ม "ยอมรับ" (สีเขียว) และ "ปฏิเสธ" (สีแดง)
- **Toast Notification:** แจ้งเตือนผลการดำเนินการ
- **Confirm Dialog:** ยืนยันการตอบรับคำขอ
- **Loading Overlay:** แสดงระหว่างประมวลผล

---

## Related Files

- `/src/app/dashboard/nurse/shift-exchange/page.tsx` - หน้า UI หลัก
- `/src/app/dashboard/nurse/layout.tsx` - Badge notification ที่เมนู
- `/src/app/api/nurse/shift-exchange/incoming-requests/route.ts` - API ดึงคำขอที่รอตอบรับ
- `/src/app/api/nurse/shift-exchange/respond/route.ts` - API ตอบรับคำขอ (approve/reject)
- `/src/app/api/nurse/shift-exchange/incoming-history/route.ts` - API ดึงประวัติคำขอที่ได้รับ

---

## Sequence Flow Summary

```
Nurse → กดเมนู "ขอแลกเวร" (เห็น badge)
     → กด tab "คำขอจากเพื่อน"
     → System แสดงรายการคำขอ pending
     → Nurse กด "ยอมรับ" หรือ "ปฏิเสธ"
     → System อัปเดตสถานะคำขอ
        ├─ approved → สลับ assignments + ลบ work_reports
        └─ rejected → ไม่เปลี่ยนแปลงอะไร
     → System แสดง toast notification
     → System อัปเดต badge (-1)
     → Nurse ดูประวัติได้ที่ tab "ประวัติ"
```

---

## Data Flow

**Input:**
- `exchange_id` - ID ของคำขอแลกเวร
- `response` - การตอบรับ ('approved' หรือ 'rejected')

**Output (กรณี approved):**
- อัปเดต `shift_exchange_requests.status = 'approved'`
- สลับ `shift_assignments.user_id` ทั้งสองฝ่าย
- ลบ `work_reports` ของทั้งสองคนในเดือนนั้น

**Output (กรณี rejected):**
- อัปเดต `shift_exchange_requests.status = 'rejected'`
- ไม่มีการเปลี่ยนแปลงอื่น

---

## Error Handling

1. **คำขอไม่ถูกต้อง:** แสดง "ไม่พบคำขอแลกเวรนี้"
2. **สถานะไม่ใช่ pending:** แสดง "คำขอนี้ถูกตอบรับไปแล้ว"
3. **ข้อผิดพลาดในการสลับเวร:** แสดง "ไม่สามารถสลับเวรได้ กรุณาลองใหม่อีกครั้ง"
4. **Database error:** แสดง "เกิดข้อผิดพลาดในระบบ"

---

## Performance Considerations

- ใช้ transaction เมื่ออนุมัติคำขอเพื่อให้การสลับเวรและลบ work_report เกิดขึ้นพร้อมกัน
- Badge notification โหลดแบบ async ไม่บล็อก UI
- รีเฟรชรายการคำขอหลังตอบรับเสร็จเพื่อแสดงข้อมูลล่าสุด

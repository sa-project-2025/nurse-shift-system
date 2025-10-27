# Use Case 5: ประกาศตารางเวร (หัวหน้าพยาบาล)

## Actor Actions:
1. ตรวจสอบว่าจัดเวรครบทุกกะแล้ว
2. กดปุ่ม "ประกาศตารางเวร"


## System Actions:
3. อัปเดตสถานะตารางเวรเป็น published
4. แสดงข้อความยืนยันประกาศตารางเวรสำเร็จ
Q5.1 :
SELECT schedules_id, created_by, status
FROM schedules
WHERE schedules_id IN ({scheduleIds})
AND created_by = {userId}
AND status = 'draft'
- (อัปเดตสถานะ)
Q5.2 :
UPDATE schedules
SET status = 'published',
published_date = NOW()
WHERE schedules_id IN ({scheduleIds})
AND status = 'draft'
5. แสดงข้อความยืนยันประกาศตารางเวรสำเร็จ




# Use Case 5: ประกาศตารางเวร (หัวหน้าพยาบาล)

## Actor Actions:
1. ตรวจสอบว่าจัดเวรครบทุกกะแล้ว
3. กดปุ่ม "ประกาศตารางเวร"
5. ยืนยันการประกาศ

## System Actions:
2. ตรวจสอบความพร้อมของตารางเวร
   - Query 1 (ดึงตารางเวรแบบ draft):
     ```sql
     SELECT schedules_id, required_nurse, status
     FROM schedules
     WHERE department_id = {dept_id}
       AND date >= '{monthStart}' AND date <= '{monthEnd}'
       AND status = 'draft'
     ```
   - Query 2 (นับพยาบาลที่จัดในแต่ละกะ):
     ```sql
     SELECT schedules_id, COUNT(*) as assigned_count
     FROM shift_assignments
     WHERE schedules_id IN ({scheduleIds})
     GROUP BY schedules_id
     ```
   - เช็คว่า: `assigned_count >= required_nurse` ทุกกะ
   - ถ้ายังไม่ครบ → แสดงข้อความเตือน "ยังมีตารางเวรที่ไม่ครบ X รายการ"

4. อัปเดตสถานะตารางเวรเป็น published
   - Query 1 (ตรวจสอบสิทธิ์):
     ```sql
     SELECT schedules_id, created_by, status
     FROM schedules
     WHERE schedules_id IN ({scheduleIds})
       AND created_by = {userId}
       AND status = 'draft'
     ```
   - Query 2 (อัปเดตสถานะ):
     ```sql
     UPDATE schedules
     SET status = 'published',
         published_date = NOW()
     WHERE schedules_id IN ({scheduleIds})
       AND status = 'draft'
     ```

6. แสดงข้อความยืนยัน "ประกาศตารางเวรสำเร็จ X รายการ"
   - พยาบาลสามารถดูตารางเวรได้ทันที
   - ตารางเวรที่ประกาศแล้วไม่สามารถแก้ไขได้

## Business Rules:
- ✅ ต้องจัดเวรครบทุกกะตามจำนวนที่กำหนด
- ✅ เฉพาะหัวหน้าพยาบาลที่สร้างตารางเท่านั้นที่ประกาศได้
- ✅ ประกาศได้เฉพาะตารางสถานะ "draft" เท่านั้น
- ⚠️ หลังประกาศแล้วไม่สามารถแก้ไขได้

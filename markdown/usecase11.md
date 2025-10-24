# Use Case 11: บันทึกการทำงานตามเวร (พยาบาล)

## Actor Actions:
1. คลิกปุ่ม "บันทึกการทำงาน" (ในหน้าตารางเวรของฉัน)
3. ตรวจสอบข้อมูลสรุปการทำงาน
5. กดยืนยันการบันทึก

## System Actions:
2. ดึงข้อมูลสรุปการทำงานเดือนปัจจุบัน
   - คำนวณจากตารางเวรที่ได้รับมอบหมาย
   - แสดง preview:
     * วันทำงาน
     * กะทั้งหมด (แยกเช้า/บ่าย/ดึก)
     * ชั่วโมงรวม
     * วันหยุด

4. ตรวจสอบว่ายังไม่มีรายงานซ้ำ
   ```sql
   SELECT work_report_id
   FROM work_reports
   WHERE user_id = {userId}
     AND report_month = '{reportMonth}'
   ```
   - ถ้ามีแล้ว → แสดงข้อความ "คุณได้บันทึกรายงานเดือนนี้แล้ว"
   - ถ้ายังไม่มี → ดำเนินการต่อ

6. คำนวณและบันทึกรายงานการทำงาน

   - Step 6a: คำนวณข้อมูลสรุป
     ```sql
     SELECT
       COUNT(DISTINCT s.date) as work_days_count,
       COUNT(sa.assignment_id) as shifts_count,
       COUNT(sa.assignment_id) * 8 as total_hours,
       SUM(CASE WHEN s.shift_type = 'morning' THEN 1 ELSE 0 END) as morning_shifts,
       SUM(CASE WHEN s.shift_type = 'afternoon' THEN 1 ELSE 0 END) as afternoon_shifts,
       SUM(CASE WHEN s.shift_type = 'night' THEN 1 ELSE 0 END) as night_shifts
     FROM shift_assignments sa
     INNER JOIN schedules s ON sa.schedules_id = s.schedules_id
     WHERE sa.user_id = {userId}
       AND s.date >= '{monthStart}'
       AND s.date <= '{monthEnd}'
       AND s.status = 'published'
     ```
     - คำนวณวันหยุด: `rest_days = จำนวนวันในเดือน - work_days_count`

   - Step 6b: บันทึกรายงานการทำงาน
     ```sql
     INSERT INTO work_reports (
       user_id, report_month, work_days_count, shifts_count,
       total_hours, morning_shifts, afternoon_shifts, night_shifts,
       rest_days, submitted_at
     )
     VALUES (
       {userId}, '{reportMonth}', {workDaysCount}, {shiftsCount},
       {totalHours}, {morningShifts}, {afternoonShifts}, {nightShifts},
       {restDays}, NOW()
     )
     ```

8. แสดงข้อความบันทึกสำเร็จ
   - "บันทึกรายงานการทำงานสำเร็จ!"
   - "สามารถดูรายงานได้ที่เมนู 'รายงานเวรของฉัน'"

## Business Rules:
- ✅ บันทึกได้เดือนละ 1 ครั้ง (ไม่สามารถบันทึกซ้ำ)
- ✅ คำนวณจากเวรที่ประกาศแล้ว (status = 'published')
- ✅ แต่ละกะ = 8 ชั่วโมง
- ✅ ต้องมีเวรในเดือนนั้นจึงจะบันทึกได้
- ⚠️ บันทึกแล้วแก้ไขไม่ได้
- ⚠️ ถ้าแลกเวรหลังบันทึก → รายงานจะถูกลบ (ต้องส่งใหม่)

## Features:
- 📊 **คำนวณอัตโนมัติ**: ระบบคำนวณสถิติให้อัตโนมัติ
- 👀 **Preview**: ดูข้อมูลก่อนยืนยัน
- ✅ **ยืนยันครั้งเดียว**: บันทึกแล้วเสร็จ
- 📜 **ประวัติ**: เก็บประวัติรายงานทุกเดือน
- 🔒 **ไม่ซ้ำ**: บันทึกได้เดือนละครั้ง

## Data Calculated:
- **work_days_count**: จำนวนวันที่ทำงาน (นับวันไม่ซ้ำ)
- **shifts_count**: จำนวนกะทั้งหมด
- **total_hours**: ชั่วโมงรวม (shifts_count × 8)
- **morning_shifts**: จำนวนกะเช้า
- **afternoon_shifts**: จำนวนกะบ่าย
- **night_shifts**: จำนวนกะดึก
- **rest_days**: จำนวนวันหยุด (วันในเดือน - work_days_count)

## Usage:
พยาบาลควรบันทึกรายงานในช่วงปลายเดือน เพื่อยืนยันว่าทำงานตามตารางเวรครบถ้วน

## Note:
⚠️ **สำคัญ**:
- ถ้ามีการแลกเวรหลังจากบันทึกแล้ว → รายงานจะถูกลบอัตโนมัติ
- ถ้ามีการอนุมัติลางานหลังจากบันทึกแล้ว → รายงานจะถูกลบอัตโนมัติ
- ต้องบันทึกรายงานใหม่หลังจากเวรเปลี่ยนแปลง

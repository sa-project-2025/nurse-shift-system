# Use Case 12: ดูรายงานของฉัน (พยาบาล)

## Actor Actions:
1. คลิกเมนู "รายงานของฉัน"
3. เลือกเดือนที่ต้องการดูรายงาน (optional)
5. คลิกปุ่ม "Export PDF" (ถ้าต้องการ)

## System Actions:
2. ดึงรายงานการทำงานของเดือนปัจจุบัน
   ```sql
   SELECT work_report_id, user_id, report_month,
          work_days_count, shifts_count, total_hours,
          morning_shifts, afternoon_shifts, night_shifts,
          rest_days, submitted_at
   FROM work_reports
   WHERE user_id = {userId}
     AND report_month = '{currentMonth}'
   ORDER BY report_month DESC
   ```
   - ถ้ายังไม่ได้บันทึก → แสดงข้อความ "ยังไม่มีรายงานในเดือนนี้"
   - ถ้ามีแล้ว → แสดงข้อมูลรายงาน

4. ดึงรายงานการทำงานของเดือนที่เลือก
   ```sql
   SELECT work_report_id, user_id, report_month,
          work_days_count, shifts_count, total_hours,
          morning_shifts, afternoon_shifts, night_shifts,
          rest_days, submitted_at
   FROM work_reports
   WHERE user_id = {userId}
     AND report_month = '{selectedMonth}'
   ```
   - พร้อมดึงรายละเอียดเวรที่ทำในเดือนนั้น:
     ```sql
     SELECT s.date, s.shift_type, sa.assignment_id
     FROM shift_assignments sa
     INNER JOIN schedules s ON sa.schedules_id = s.schedules_id
     WHERE sa.user_id = {userId}
       AND s.date >= '{monthStart}'
       AND s.date <= '{monthEnd}'
       AND s.status = 'published'
     ORDER BY s.date, s.shift_type
     ```

6. แสดงรายงานพร้อมสถิติ
   - แสดงข้อมูล:
     * เดือน/ปี
     * วันทำงาน
     * กะทั้งหมด (แยกเช้า/บ่าย/ดึก)
     * ชั่วโมงรวม
     * วันหยุด
     * วันที่บันทึก
   - แสดงกราฟ/แผนภูมิ (optional):
     * สัดส่วนกะเช้า/บ่าย/ดึก
     * เปรียบเทียบชั่วโมงกับเดือนก่อน

8. สร้างไฟล์ PDF ของสรุปรายงาน พร้อม download
   - สร้าง PDF ที่มี:
     * ข้อมูลส่วนตัว (ชื่อ, แผนก)
     * สรุปการทำงาน
     * ตารางรายละเอียดวันที่ทำงาน
     * กราฟสถิติ
   - Download ไฟล์: `WorkReport_{name}_{month}.pdf`

## Business Rules:
- ✅ ดูได้เฉพาะรายงานของตัวเอง
- ✅ ดูได้เฉพาะเดือนที่ได้บันทึกรายงานแล้ว
- ✅ สามารถดูย้อนหลังได้ทุกเดือน
- 📊 Export PDF ได้ทุกรายงาน

## Features:
- 📅 **เลือกเดือน**: ดูรายงานเดือนไหนก็ได้
- 📊 **สถิติ**: ดูสถิติการทำงานแบบละเอียด
- 📈 **กราฟ**: แสดงกราฟสัดส่วนกะต่าง ๆ
- 📄 **Export PDF**: ดาวน์โหลดรายงานเป็น PDF
- 🔍 **รายละเอียด**: ดูรายละเอียดเวรแต่ละวัน
- 📜 **ประวัติ**: เก็บประวัติรายงานทุกเดือน

## Display Information:
- **Header**: ชื่อ, แผนก, เดือน/ปี
- **Summary Stats**:
  - วันทำงาน: X วัน
  - กะทั้งหมด: X กะ
  - ชั่วโมงรวม: X ชม.
  - กะเช้า/บ่าย/ดึก: X/X/X กะ
  - วันหยุด: X วัน
- **Detail**: รายการเวรแต่ละวัน
- **Submitted**: วันที่บันทึก

## PDF Export Features:
- 📄 Header: ชื่อ + แผนก + เดือน
- 📊 สถิติแบบตาราง
- 📈 กราฟแท่ง/วงกลม
- 🗓️ รายการเวรทุกวัน
- ✅ ลายเซ็นอิเล็กทรอนิกส์ (timestamp)

## Use Cases:
- ตรวจสอบชั่วโมงทำงานประจำเดือน
- เตรียมเอกสารสำหรับเคลม
- ส่งรายงานให้ผู้บังคับบัญชา
- เก็บเป็นหลักฐานการทำงาน

# Use Case 12: ดูรายงานของฉัน (พยาบาล)

## Actor Actions:
1. คลิกเมนู "รายงานของฉัน"
3. เลือกเดือนที่ต้องการดูรายงาน
5.คลิกปุ่ม "Export PDF"



## System Actions:
2.ดึงสรุปรายงานการทำงานของเดือนปัจจุบัน
Q 12.1 : 
SELECT work_report_id, user_id, report_month, work_days_count, shifts_count, total_hours, morning_shifts, afternoon_shifts, night_shifts, rest_days, submitted_at
FROM work_reports
WHERE user_id = {userId}
AND report_month = '{currentMonth}'
ORDER BY report_month DESC
3. แสดงรายงานพร้อมสถิติ
แสดงข้อมูล
เดือน/ปี
วันทำงาน
กะทั้งหมด (แยกเช้า/บ่าย/ดึก)
ชั่วโมงรวม
วันหยุด
วันที่บันทึก
แสดงกราฟ/แผนภูมิ
สัดส่วนกะเช้า/บ่าย/ดึก
เปรียบเทียบชั่วโมงกับเดือนก่อน
4. แสดงรายงานของเดือนที่เลือก
6. สร้างไฟล์ PDF ของสรุปรายงาน พร้อม download



# Use Case 11: บันทึกการทำงานตามเวร (พยาบาล)

## Actor Actions:
1. คลิกปุ่ม “บันทึกการทำงาน”
3. ตรวจสอบข้อมูลสรุปการทำงาน
5. กดยืนยันการบันทึก

## System Actions:
2. ดึงข้อมูลสรุปการทำงานเดือนปัจจุบัน
คำนวณจากตารางเวรที่ได้รับมอบหมาย
แสดง preview : 
วันทำงาน
กะทั้งหมด (แยกเช้า/บ่าย/ดึก)
ชั่วโมงรวม
วันหยุด


4. ตรวจสอบว่ายังไม่มีรายงานซ้ำ
Q11.1 : 
SELECT work_report_id
FROM work_reports
WHERE user_id = {userId}
 AND report_month = '{reportMonth}'
- ถ้ามีแล้ว -> แสดงข้อความ "คุณได้บันทึกรายงานเดือนนี้แล้ว"
- ถ้ายังไม่มี -> ดำเนินการต่อ
6. บันทึกรายงานการทำงาน
Q 11.2 :
INSERT INTO work_reports (
user_id, report_month, work_days_count, shifts_count,total_hours, morning_shifts, afternoon_shifts, night_shifts,rest_days, submitted_at)
VALUES (...)

7. แสดงข้อความบันทึกสำเร็จ
"บันทึกรายงานการทำงานสำเร็จ"
"สามารถดูรายงานได้ที่เมนู รายงานเวรของฉัน'"



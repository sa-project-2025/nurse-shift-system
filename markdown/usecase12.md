actor:
1. คลิกเมนู "รายงานของฉัน"
3. เลือกเดือนที่ต้องการดูรายงาน
5.คลิกปุ่ม "Export PDF"

system:
2.ดึงสรุปรายงานการทำงานของเดือนปัจจุบัน
 SELECT
    report_id,
    user_id,
    report_month,
    work_days_count,
    shifts_count,
    total_hours,
    morning_shifts,
    afternoon_shifts,
    night_shifts,
    rest_days,
    submitted_at
  FROM work_reports
  WHERE user_id = :user_id
  AND report_month = DATE_FORMAT(CURDATE(), '%Y-%m')
  ORDER BY report_month DESC;
4. ดึงสรุปรายงานการทำงานของเดือนที่เลือก
 SELECT
    report_id,
    user_id,
    report_month,
    work_days_count,
    shifts_count,
    total_hours,
    morning_shifts,
    afternoon_shifts,
    night_shifts,
    rest_days,
    submitted_at
  FROM work_reports
  WHERE user_id = :user_id
  AND report_month = :report_month
  ORDER BY report_month DESC;
6. สร้างไฟล์ PDF ของสรุปรายงาน พร้อม dowload


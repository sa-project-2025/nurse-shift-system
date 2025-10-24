actor:
1. คลิกเมนู"รายงานพยาบาล"
3. เลือกเดือน/ปีที่ต้องการวิเคราะห์
5. ดูภาพรวมสถิติของแผนกทั้งหมด
6. คลิกปุ่ม "Export PDF"


system:
2. ดึงรายงานของพยาบาลทั้งหมดในแผนกของเดือนปัจจุบัน
SELECT 
    u.user_id,
    u.name AS nurse_name,
    d.department_name,
    w.report_month,
    w.work_days_count,
    w.shifts_count,
    w.total_hours,
    w.morning_shifts,
    w.afternoon_shifts,
    w.night_shifts,
    w.rest_days,
    w.submitted_at
FROM work_reports w
LEFT JOIN users u 
    ON w.user_id = u.user_id
LEFT JOIN departments d 
    ON u.department_id = d.department_id
WHERE u.department_id = (
    SELECT department_id 
    FROM users 
    WHERE role = '<head_nurse_id>'
)
  AND u.role = 'nurse'
  AND w.report_month = TO_CHAR(CURRENT_DATE, 'YYYY-MM');
4. ดึงรายงานของพยาบาลทั้งหมดในแผนกของเดือนที่เลือก
SELECT 
    u.user_id,
    u.name AS nurse_name,
    d.department_name,
    w.report_month,
    w.work_days_count,
    w.shifts_count,
    w.total_hours,
    w.morning_shifts,
    w.afternoon_shifts,
    w.night_shifts,
    w.rest_days,
    w.submitted_at
FROM work_reports w
LEFT JOIN users u 
    ON w.user_id = u.user_id
LEFT JOIN departments d 
    ON u.department_id = d.department_id
WHERE u.department_id = (
    SELECT department_id 
    FROM users 
    WHERE role = 'head_nurse_id'
)
  AND u.role = 'nurse'
  AND w.report_month = '<เลือกเดือน>';

7.สร้างไฟล์ PDF ของสรุปรายงาน พร้อม dowload



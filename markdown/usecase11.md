actor:
1. คลิกปุ่ม “บันทึกการทำงาน”
3. กดยืนยันการทำงานตามเวร

system:
2. ระบบแสดง popup เพื่อให้กดยืนยัน
4. ตรวจสอบว่ายังไม่มีรายงานซ้ำ
SELECT COUNT(*) as report_exists
FROM work_reports
WHERE user_id = :user_id
AND report_month = :report_month;  
5a: คำนวณข้อมูลสรุป
  SELECT
    :user_id as user_id,
    :report_month as report_month,
    COUNT(DISTINCT s.date) as work_days_count,
    COUNT(sa.assignment_id) as shifts_count,
    COUNT(sa.assignment_id) * 8 as total_hours,
    SUM(CASE WHEN s.shift_type = 'morning' THEN 1 ELSE 0
  END) as morning_shifts,
    SUM(CASE WHEN s.shift_type = 'afternoon' THEN 1 ELSE
  0 END) as afternoon_shifts,
    SUM(CASE WHEN s.shift_type = 'night' THEN 1 ELSE 0
  END) as night_shifts,
    (DAY(LAST_DAY(:month_start)) - COUNT(DISTINCT
  s.date)) as rest_days
  FROM shift_assignments sa
  JOIN schedules s ON sa.schedules_id = s.schedules_id
  WHERE sa.user_id = :user_id
  AND s.date >= :month_start
  AND s.date <= :month_end
  AND s.status = 'published';
5b. บันทึกรายงานการทำงาน
INSERT INTO work_reports (
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
  )
  VALUES (
    :user_id,
    :report_month,
    :work_days_count,
    :shifts_count,
    :total_hours,
    :morning_shifts,
    :afternoon_shifts,
    :night_shifts,
    :rest_days,
    NOW()
  );
6. แสดงผลการบันทึก



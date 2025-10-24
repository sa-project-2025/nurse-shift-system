actor:
1. เข้าเมนูตารางเวรของฉัน


4 .คลิกที่เวรใดเวรหนึ่งเพื่อดูรายละเอียด



system:
2. ดึงตารางเวรของพยาบาลในเดือนที่เลือก
SELECT
  s.schedules_id,
  s.date,
  s.shift_type,
  s.status,
  sa.assignment_id,
  wr.report_id,
  wr.status as report_status
FROM schedules s
JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id
LEFT JOIN work_reports wr ON sa.assignment_id = wr.assignment_id
WHERE sa.user_id = :user_id
AND s.date >= :selected_month_start
AND s.date <= :selected_month_end
ORDER BY s.date, s.shift_type;
3.โหลดตารางเวรของเดือนที่เลือก
5. ดึงรายละเอียดเวรและพยาบาลคนอื่นในเวรเดียวกัน
SELECT
  s.schedules_id,
  s.date,
  s.shift_type,
  s.required_nurse,
  u.user_id,
  u.name as nurse_name,
  sa.assignment_id,
  wr.report_id,
  wr.status as report_status
FROM schedules s
JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id
JOIN users u ON sa.user_id = u.user_id
LEFT JOIN work_reports wr ON sa.assignment_id = wr.assignment_id AND wr.user_id = :user_id
WHERE s.schedules_id = :schedule_id
ORDER BY u.name;
6. แสดงรายละเอียดของเวรนั้น รวมถึงพยาบาลคนอื่นที่เวรเดียวกัน


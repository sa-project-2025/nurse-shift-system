1. ตรวจสอบว่าจัดเวรครบทุกกะแล้ว
2. กดประกาศเวร

3. อัปเดตสถานะตารางเวรเป็น published
UPDATE schedules
SET status = 'published',
    published_date = NOW(),
    published_by = :head_nurse_id
WHERE department_id = :dept_id
AND date >= :month_start
AND date <= :month_end
AND status = 'draft';


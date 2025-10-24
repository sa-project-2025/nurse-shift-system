# Use Case 4: จัดตารางเวร (หัวหน้าพยาบาล)

## Actor Actions:
1. คลิก "เมนูจัดตารางเวร"
3. คลิกเลือกเดือน/ปีที่ต้องการสร้างตารางเวร
5. กำหนดจำนวนพยาบาลต่อกะ (เช้า/บ่าย/ดึก)
7. กดสร้างตารางเวร
9. เลือกวันที่และกะที่ต้องการจัดพยาบาล
10. เลือกพยาบาลแล้วคลิกจัดเวร (หรือใช้ Drag & Drop)
12. ทำซ้ำจนครบทุกกะ
13. กดปุ่ม "ประกาศตารางเวร"

## System Actions:
2. แสดงหน้าจัดการตารางเวร พร้อมปฏิทินเดือนปัจจุบัน
   - Query: `SELECT department_id FROM departments WHERE head_nurse_id = {userId}`

4. โหลดข้อมูลตารางเวรของเดือนที่เลือก
   - Query 1:
     ```sql
     SELECT schedules_id, date, shift_type, status, required_nurse,
            department_id, created_by, published_date
     FROM schedules
     WHERE department_id = {dept_id}
       AND date >= '{startDate}' AND date <= '{endDate}'
       AND status IN ('draft', 'published')
     ORDER BY date
     ```
   - Query 2 (ดึงพยาบาลที่จัดแล้ว):
     ```sql
     SELECT sa.assignment_id, sa.schedules_id,
            u.user_id, u.name, u.email
     FROM shift_assignments sa
     INNER JOIN users u ON sa.user_id = u.user_id
     WHERE sa.schedules_id IN ({scheduleIds})
     ```

6. เก็บค่าที่ตั้งไว้สำหรับการสร้างตารางเวร
   - เก็บค่า: morning_required, afternoon_required, night_required

8. สร้างตารางเวรเปล่าสำหรับทั้งเดือน
   - สร้างตารางสำหรับทุกวัน × 3 กะ (เช้า/บ่าย/ดึก)
   - Query:
     ```sql
     INSERT INTO schedules (date, shift_type, department_id, created_by,
                           status, required_nurse, published_date)
     VALUES
       ('{date}', 'morning', {dept_id}, {user_id}, 'draft', {morning_req}, NULL),
       ('{date}', 'afternoon', {dept_id}, {user_id}, 'draft', {afternoon_req}, NULL),
       ('{date}', 'night', {dept_id}, {user_id}, 'draft', {night_req}, NULL)
       -- ทำซ้ำสำหรับทุกวันในเดือน
     ```

9. แสดงรายชื่อพยาบาลที่สามารถจัดเวรได้
   - Query:
     ```sql
     SELECT user_id, name, email
     FROM users
     WHERE department_id = {dept_id}
       AND role = 'nurse'
     ORDER BY name
     ```

11. จัดเวรพยาบาล
    - ตรวจสอบ business rules:
      * Query 1 (เช็คว่าจัดไปแล้วหรือยัง):
        ```sql
        SELECT assignment_id
        FROM shift_assignments
        WHERE schedules_id = {schedule_id} AND user_id = {nurse_id}
        ```
      * Query 2 (เช็คชั่วโมงรายเดือน - ต้องไม่เกิน 176 ชม.):
        ```sql
        SELECT sa.assignment_id
        FROM shift_assignments sa
        INNER JOIN schedules s ON sa.schedules_id = s.schedules_id
        WHERE sa.user_id = {nurse_id}
          AND s.date >= '{monthStart}' AND s.date <= '{monthEnd}'
        ```
      * Query 3 (นับคนในกะ - ต้องไม่เกินที่กำหนด):
        ```sql
        SELECT COUNT(*) as count
        FROM shift_assignments
        WHERE schedules_id = {schedule_id}
        ```
    - ถ้าผ่านทุก rule → บันทึกการจัดเวร:
      ```sql
      INSERT INTO shift_assignments (user_id, schedules_id, assigned_by, assigned_date)
      VALUES ({nurse_id}, {schedule_id}, {head_nurse_id}, NOW())
      ```

14. ประกาศตารางเวร (เปลี่ยนสถานะจาก draft → published)
    - Query:
      ```sql
      UPDATE schedules
      SET status = 'published', published_date = NOW()
      WHERE schedules_id IN ({scheduleIds})
        AND status = 'draft'
      ```

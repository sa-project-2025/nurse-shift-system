Precondition
- มีบัญชีผู้ใช้ในระบบ

actor:
1. เข้าหน้า Login
2. กรอกอีเมลและรหัสผ่าน
3. กดปุ่ม "เข้าสู่ระบบ"

system
4. ตรวจสอบข้อมูล email และ password
SELECT user_id, name, role, department_id
FROM users
WHERE email = 'example@email.com'
  AND password = crypt('MyPassword123', password);
5. Redirect ไปหน้า Dashboard


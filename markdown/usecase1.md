Precondition
- ยังไมมีบัญชีในระบบ
actor:
1. เข้าหน้าลงทะเบียน
5. กรอกข้อมูล:
- ชื่อ-นามสกุล
- อีเมล
- รหัสผ่าน
- เบอร์โทร
- เลือกแผนก
- เลือกบทบาท (nurse/head_nurse)
6. กดปุ่ม "ลงทะเบียน"

system:
2. แสดงฟอร์มลงทะเบียน
3. ดึงข้อมูลแผนก
SELECT department_id,department_name FROM departments
4. แสดงข้อมูลแผนก


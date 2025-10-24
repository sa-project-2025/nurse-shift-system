# CRUD Table Analysis

ตารางวิเคราะห์การทำงาน CRUD (Create, Read, Update, Delete) ของแต่ละ Use Case กับ Entity ต่างๆ

## CRUD Matrix

| Use Case | users | departments | schedules | shift_assignments | shift_exchange_requests | leave_requests | work_reports |
|----------|-------|-------------|-----------|-------------------|------------------------|----------------|--------------|
| **UC1: ลงทะเบียน** | C | R | - | - | - | - | - |
| **UC2: เข้าสู่ระบบ** | R | - | - | - | - | - | - |
| **UC3: รายงานพยาบาล (หัวหน้า)** | R | R | - | - | - | - | R |
| **UC4: จัดตารางเวร** | R | - | C | C | - | - | - |
| **UC5: ประกาศเวร** | - | - | U | - | - | - | - |
| **UC6: ดูตารางเวร** | R | - | R | R | - | - | R |
| **UC7: ขอแลกเวร** | R | - | R | R | C,R | - | - |
| **UC8: อนุมัติแลกเวร** | R | - | - | U | U,R | - | D |
| **UC9: ขอลางาน** | - | - | R | R | - | C,R | - |
| **UC10: อนุมัติลางาน** | R | - | R | D | - | U,R | - |
| **UC11: บันทึกการทำงาน** | - | - | R | R | - | - | C,R |
| **UC12: รายงานของฉัน** | - | - | - | - | - | - | R |

**สัญลักษณ์:**
- C = Create (สร้าง)
- R = Read (อ่าน)
- U = Update (แก้ไข)
- D = Delete (ลบ)
- \- = ไม่มีการทำงาน

### Main Tables

#### users
```sql
user_id (PK)
name
email
password
role (nurse | head_nurse )
phone
department_id (FK)
```

#### departments
```sql
department_id (PK)
department_name
head_nurse_id (FK)
```

#### schedules
```sql
schedules_id (PK)
date
shift_type (morning | afternoon | night)
created_by (FK)
department_id (FK)
status (draft | published)
published_date
required_nurse
```

#### shift_assignments
```sql
assignment_id (PK)
user_id (FK)
schedules_id (FK)
assigned_by (FK)
assigned_date
```

#### shift_exchange_requests
```sql
exchange_id (PK)
requester_id (FK)
target_user_id (FK)
original_schedule_id (FK)
target_schedule_id (FK)
request_date
reason
status (pending | approved | rejected)
```

#### leave_requests
```sql
leave_id (PK)
user_id (FK)
start_date
end_date
leave_days
leave_type (sick | personal | vacation | other)
reason
reason_reject
request_date
status (pending | approved | rejected)
approved_by (FK)
response_date
```

#### work_reports
```sql
report_id (PK)
user_id (FK)
report_month
work_days_count
shifts_count
total_hours
morning_shifts
afternoon_shifts
night_shifts
rest_days
submitted_at
```
sequenceDiagram
    actor User as Head Nurse/Nurse
    participant UI as Registration UI
    participant Controller as Registration Controller
    participant API as Register API
    participant Service as Registration Service
    participant DB as Database

    User->>UI: 1. เข้าหน้าลงทะเบียน
    UI->>Controller: Load registration page
    Controller->>API: 2. GET /register
    API->>DB: 3. SELECT departments
    DB-->>API: Department list
    API-->>Controller: Form data + departments
    Controller-->>UI: 4. แสดงฟอร์ม + ข้อมูลแผนก
    UI-->>User: Display registration form

    User->>UI: 5. กรอกข้อมูล<br/>(ชื่อ, อีเมล, รหัสผ่าน, เบอร์, แผนก, บทบาท)
    User->>UI: 6. กดปุ่ม "ลงทะเบียน"

    UI->>Controller: Submit registration data
    Controller->>API: POST /api/auth/register
    API->>Service: Validate registration data
    Service->>DB: 7. Check duplicates<br/>SELECT email, phone
    DB-->>Service: Validation result

    alt ข้อมูลไม่ถูกต้อง
        Service-->>API: Validation error
        API-->>Controller: Error response
        Controller-->>UI: แสดงข้อความ error
        UI-->>User: แจ้งข้อผิดพลาด
    else ข้อมูลถูกต้อง
        Service->>Service: 8. Hash password (bcrypt)
        Service->>DB: 9. INSERT INTO users
        DB-->>Service: User created
        Service-->>API: Success response
        API-->>Controller: Registration success
        Controller-->>UI: 10. แสดงข้อความสำเร็จ
        UI-->>User: ลงทะเบียนสำเร็จ
    end


# Sequence Diagram: Use Case 2 - Login (เข้าสู่ระบบ)

```mermaid
sequenceDiagram
    actor User
    participant UI as :loginUI
    participant API as :loginAPI
    participant DB as :database

    User->>UI: เข้าหน้า Login
    activate UI
    deactivate UI

    User->>UI: กรอกอีเมลและรหัสผ่าน
    User->>UI: กดปุ่ม เข้าสู่ระบบ

    activate UI
    UI->>API: POST /api/auth/login
    deactivate UI
    activate API

    API->>DB: SELECT * FROM users<br/>WHERE email = ?
    activate DB
    DB-->>API: user data
    deactivate DB

    alt user not found
        API-->>UI: error ไม่พบผู้ใช้
        activate UI
        UI->>UI: แสดง error
        deactivate UI
    end

    API->>API: ตรวจสอบ password

    alt password ไม่ถูกต้อง
        API-->>UI: error รหัสผ่านไม่ถูกต้อง
        activate UI
        UI->>UI: แสดง error
        deactivate UI
    end

    API-->>UI: success + user + profile
    deactivate API

    activate UI
    UI->>UI: เก็บ session ใน localStorage

    alt role = nurse
        UI->>UI: redirect /dashboard/nurse
    else role = head_nurse
        UI->>UI: redirect /dashboard/head-nurse
    end
    deactivate UI
```

## Layer Architecture

| Layer | Component | Technology |
|-------|-----------|------------|
| User | ผู้ใช้งาน | Browser |
| :loginUI | UI Layer | Next.js Client Component |
| :loginAPI | API Layer | /api/auth/login |
| :database | Database | PostgreSQL (Supabase) |

## Key Points

### Authentication Flow
- ตรวจสอบ email จาก users table
- เปรียบเทียบ password แบบ plaintext
- สร้าง session token (base64)
- เก็บ user + profile ใน localStorage

### Error Handling
- ไม่พบ user → error "ไม่พบข้อมูลผู้ใช้"
- password ไม่ถูกต้อง → error "รหัสผ่านไม่ถูกต้อง"

### Role-based Redirect
- nurse → /dashboard/nurse
- head_nurse → /dashboard/head-nurse

## API Endpoints

**POST /api/auth/login**
- รับ: { email, password }
- ตรวจสอบ credentials จาก users table
- คืนค่า: { success, user, profile }

## Database Tables

**users** - user profile และ authentication
- Query: `SELECT * FROM users WHERE email = ?`
- เปรียบเทียบ: `password === inputPassword`

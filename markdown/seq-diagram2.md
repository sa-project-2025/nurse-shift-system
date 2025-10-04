sequenceDiagram
    actor User as Head Nurse/Nurse
    participant UI as Login UI
    participant Controller as Login Controller
    participant API as Login API
    participant Service as Authentication Service
    participant DB as Database

    User->>UI: 1. เข้าหน้า Login
    UI->>Controller: Load login page
    Controller-->>UI: Render login form
    UI-->>User: แสดงฟอร์ม Login

    User->>UI: 2. กรอกอีเมลและรหัสผ่าน
    User->>UI: 3. กดปุ่ม "เข้าสู่ระบบ"

    UI->>Controller: Submit login credentials
    Controller->>API: POST /api/auth/login
    API->>Service: Authenticate user
    Service->>DB: 4. SELECT user WHERE email
    DB-->>Service: User data (if exists)
    Service->>Service: Verify password (bcrypt)

    alt Authentication Failed
        Service-->>API: Authentication error
        API-->>Controller: Login failed response
        Controller-->>UI: Display error message
        UI-->>User: แสดงข้อความ error
    else Authentication Success
        Service->>Service: Create session/token
        Service-->>API: User profile + token
        API-->>Controller: 5. Login success + user data
        Controller->>Controller: Store session in localStorage
        Controller-->>UI: Redirect to Dashboard
        UI-->>User: แสดงหน้า Dashboard
    end
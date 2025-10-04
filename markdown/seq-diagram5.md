
sequenceDiagram
    actor HN as Head Nurse
    participant UI as Schedule Management UI
    participant Controller as Publish Controller
    participant API as Publish API
    participant Service as Publishing Service
    participant DB as Database

    Note over HN,DB: Precondition: มีตารางเวร draft ที่สมบูรณ์

    HN->>UI: 1. ตรวจสอบความครบถ้วน
    UI->>Controller: Check schedule completion
    Controller->>API: GET /api/schedules/validate
    API->>Service: Validate schedule completeness
    Service->>DB: SELECT schedules WHERE status='draft'<br/>JOIN shift_assignments
    DB-->>Service: Schedule data with assignments
    Service->>Service: Calculate completion status

    alt ตารางไม่สมบูรณ์
        Service-->>API: Validation failed
        API-->>Controller: Incomplete shifts list
        Controller-->>UI: แสดง error + missing shifts
        UI-->>HN: แจ้งว่ายังจัดเวรไม่ครบ
    else ตารางสมบูรณ์
        Service-->>API: Validation passed
        API-->>Controller: Ready to publish
        Controller-->>UI: Enable publish button

        HN->>UI: 2. กดประกาศเวร
        UI->>Controller: Publish schedule
        Controller->>API: POST /api/schedules/publish
        API->>Service: Publish schedule
        Service->>DB: 3. UPDATE schedules<br/>SET status='published'<br/>published_date=NOW()
        DB-->>Service: Update successful
        Service->>DB: INSERT INTO schedule_logs
        DB-->>Service: Log created
        Service-->>API: Publish success
        API-->>Controller: Schedule published
        Controller-->>UI: แสดงสถานะ published
        UI-->>HN: ตารางถูกประกาศแล้ว
    end
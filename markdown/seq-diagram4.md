
sequenceDiagram
    actor HN as Head Nurse
    participant UI as Schedule Management UI
    participant Controller as Schedule Controller
    participant API as Schedule API
    participant Service as Schedule Management Service
    participant DB as Database

    HN->>UI: 1. เข้าเมนูจัดตารางเวร
    UI->>Controller: Load schedule page
    Controller->>API: GET /dashboard/head-nurse/schedule-management
    API->>DB: SELECT current schedules
    DB-->>API: Schedule data
    API-->>Controller: Schedule + Nurse data
    Controller-->>UI: 2. แสดงหน้าจัดการตาราง + ปฏิทิน
    UI-->>HN: แสดงหน้าจัดการ

    HN->>UI: 3. คลิกเลือกเดือน/ปี
    UI->>Controller: Request schedule for month
    Controller->>API: POST /api/schedules/monthly
    API->>DB: 5. SELECT schedules WHERE month
    DB-->>API: Schedule data (if exists)
    API-->>Controller: Schedule list
    Controller-->>UI: 4. โหลดข้อมูลตาราง
    UI-->>HN: แสดงปฏิทินเดือนที่เลือก

    HN->>UI: 6. กำหนดจำนวนพยาบาลต่อกะ<br/>(เช้า, บ่าย, ดึก)
    UI->>Controller: 7. เก็บค่า configuration
    Controller->>Controller: Store shift requirements

    HN->>UI: 8. กดสร้างตารางเวร
    UI->>Controller: Create schedule request
    Controller->>API: POST /api/schedules/create-bulk
    API->>Service: Validate schedule creation
    Service->>DB: Check existing schedules
    DB-->>Service: Validation result
    Service->>DB: 9. INSERT schedules<br/>(ทั้งเดือน, status=draft)
    DB-->>Service: Schedules created (~93 records)
    Service-->>API: Creation success
    API->>DB: 10. SELECT nurses WHERE department
    DB-->>API: Nurse list
    API-->>Controller: แสดงตารางเวรเปล่า + รายชื่อพยาบาล
    Controller-->>UI: Render calendar + nurses
    UI-->>HN: แสดงตารางและรายชื่อ

    loop จัดเวรแต่ละกะ
        HN->>UI: 11. เลือกวันที่และกะ
        UI->>Controller: Select date & shift
        Controller->>Controller: Highlight selected shift

        HN->>UI: 12. เลือกพยาบาลและคลิกจัดเวร
        UI->>Controller: Assign nurse request
        Controller->>API: POST /api/schedules/assign
        API->>Service: Validate assignment rules
        Service->>DB: Check monthly hours
        DB-->>Service: Current hours count
        Service->>DB: Check rest days
        DB-->>Service: Rest days count
        Service->>DB: Check duplicates
        DB-->>Service: No duplicates

        alt Validation Passed
            Service->>DB: 13. INSERT shift_assignment
            DB-->>Service: Assignment created
            Service-->>API: Success response
            API-->>Controller: Assignment data
            Controller-->>UI: อัปเดตตาราง
            UI-->>HN: 14. แสดงการจัดเวรบนตาราง
        else Validation Failed
            Service-->>API: Error response
            API-->>Controller: Validation error
            Controller-->>UI: แสดงข้อความเตือน
            UI-->>HN: แสดง error message
        end
    end
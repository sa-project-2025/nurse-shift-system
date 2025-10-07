sequenceDiagram
    actor N as Nurse
    participant UI as My Schedule UI
    participant Controller as Schedule Controller
    participant API as Schedule API
    participant Service as Schedule Service
    participant DB as Database

    N->>UI: 1. เข้าเมนู "ตารางเวรของฉัน"
    UI->>Controller: Load my schedule page
    Controller->>API: GET /api/nurse/my-schedule
    API-->>Controller: Schedule page data
    Controller-->>UI: Render schedule page
    UI-->>N: แสดงหน้าตารางเวร + เลือกเดือน

    UI->>Controller: 2. Load schedule for month
    Controller->>API: POST /api/nurse/my-schedule<br/>{userId, month}
    API->>Service: Get nurse schedules
    Service->>DB: SELECT schedules + shift_assignments<br/>WHERE user_id & month
    DB-->>Service: ตารางเวรของพยาบาล
    Service-->>API: Formatted shifts data
    API-->>Controller: 3. {shifts: [...]}
    Controller-->>UI: Update schedule display
    UI-->>N: แสดงตารางเวรของเดือนที่เลือก<br/>(วันที่, กะ, สถานะ)

    N->>UI: 4. คลิกที่เวรใดเวรหนึ่ง<br/>เพื่อดูรายละเอียด
    UI->>Controller: Request shift details
    Controller->>API: GET /api/schedules/:scheduleId/details
    API->>Service: Get shift details with co-workers
    Service->>DB: 5. SELECT shift details<br/>+ พยาบาลคนอื่นในเวรเดียวกัน<br/>JOIN users, shift_assignments
    DB-->>Service: รายละเอียดเวร + รายชื่อพยาบาล
    Service-->>API: Processed shift data
    API-->>Controller: 6. {shift: {...}, nurses: [...]}
    Controller-->>UI: Display shift details
    UI-->>N: แสดงข้อมูลเวร:<br/>- วันที่และกะ<br/>- พยาบาลที่เวรด้วยกัน<br/>

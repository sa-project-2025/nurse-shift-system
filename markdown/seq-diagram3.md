:::mermaid
sequenceDiagram
    actor HN as Head Nurse
    participant UI as Report UI
    participant Controller as Report Controller
    participant API as Report API
    participant Service as Report Generation Service
    participant DB as Database

    HN->>UI: 1. เข้าเมนูรายงาน
    UI->>Controller: Load report page
    Controller->>API: GET /api/reports/summary
    API->>Service: Calculate monthly reports
    Service->>DB: 2. SELECT shift_assignments<br/>GROUP BY user, COUNT shifts<br/>WHERE last month
    DB-->>Service: Aggregated report data
    Service->>Service: Calculate hours, rest days
    Service-->>API: Report summary list
    API-->>Controller: Report data
    Controller-->>UI: Render report list
    UI-->>HN: แสดงรายชื่อ reports

    HN->>UI: 3. กดเข้าดูรายละเอียด report
    UI->>Controller: Request report details (user_id)
    Controller->>API: GET /api/reports/details?user_id=X
    API->>Service: Generate detailed report
    Service->>DB: 4. SELECT วันทำงาน, กะ, ชั่วโมง<br/>WHERE user_id & last month
    DB-->>Service: Detailed shift data
    Service->>Service: Calculate statistics
    Service-->>API: Detailed report data
    API-->>Controller: Report details
    Controller-->>UI: Render detailed view
    UI-->>HN: แสดงวันทำงาน, กะ, ชั่วโมง

    Note over HN: วิเคราะห์ข้อมูล<br/>เพื่อวางแผนเดือนถัดไป


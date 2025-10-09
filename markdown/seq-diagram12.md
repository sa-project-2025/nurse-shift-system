sequenceDiagram
    actor N as Nurse
    participant UI as My Reports UI
    participant Controller as Reports Controller
    participant API as Reports API
    participant Service as Reports Service
    participant DB as Database

    N->>UI: 1. คลิกเมนู "รายงานของฉัน"
    UI->>Controller: Load my reports page
    Controller->>API: GET /api/nurse/my-reports
    API->>Service: Get current month report
    Service->>DB: 2. ดึงรายงานเดือนปัจจุบัน<br/>SELECT report_id, user_id, report_month,<br/>work_days_count, shifts_count, total_hours,<br/>morning/afternoon/night_shifts, rest_days<br/>WHERE user_id = :user_id<br/>AND report_month = DATE_FORMAT(CURDATE(), '%Y-%m')
    DB-->>Service: รายงานเดือนปัจจุบัน
    Service-->>API: Report data
    API-->>Controller: {reports: [...]}
    Controller-->>UI: Render reports page
    UI-->>N: แสดงรายงานเดือนปัจจุบัน<br/>(วันทำงาน, กะ, ชั่วโมง, วันหยุด)

    N->>UI: 3. เลือกเดือนที่ต้องการดูรายงาน
    UI->>Controller: Request selected month report
    Controller->>API: POST /api/nurse/work-reports<br/>{userId, reportMonth}
    API->>Service: Get report for selected month
    Service->>DB: 4. ดึงรายงานเดือนที่เลือก<br/>SELECT report_id, user_id, report_month,<br/>work_days_count, shifts_count, total_hours,<br/>morning/afternoon/night_shifts, rest_days<br/>WHERE user_id = :user_id<br/>AND report_month = :report_month
    DB-->>Service: รายงานเดือนที่เลือก
    Service-->>API: Report data
    API-->>Controller: {reports: [...]}
    Controller-->>UI: Update reports display
    UI-->>N: แสดงรายงานเดือนที่เลือก<br/>(วันทำงาน, กะ, ชั่วโมง, วันหยุด)

    N->>UI: 5. คลิกปุ่ม "Export PDF"
    UI->>UI: 6. window.print()<br/>(สร้าง PDF จาก browser)
    UI-->>N: Download PDF รายงานของฉัน

    
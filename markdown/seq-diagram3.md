sequenceDiagram
    actor HN as Head Nurse
    participant UI as Nurse Reports UI
    participant Controller as Reports Controller
    participant API as Reports API
    participant Service as Reports Service
    participant DB as Database

    HN->>UI: 1. คลิกเมนู "รายงานพยาบาล"
    UI->>Controller: Load nurse reports page
    Controller->>API: GET /api/head-nurse/nurse-reports
    API->>Service: Get department nurses reports
    Service->>DB: 2. SELECT users + work_reports<br/>LEFT JOIN WHERE department<br/>AND report_month = เดือนปัจจุบัน
    DB-->>Service: รายงานพยาบาลทั้งหมด (เดือนปัจจุบัน)
    Service->>Service: Calculate department statistics
    Service-->>API: Nurses data + stats
    API-->>Controller: {nurses: [...], stats: {...}}
    Controller-->>UI: Render reports page
    UI-->>HN: แสดงรายงานเดือนปัจจุบัน<br/>(วันทำงาน, กะ, ชั่วโมง, สถานะส่ง)

    HN->>UI: 3. เลือกเดือน/ปีที่ต้องการวิเคราะห์
    UI->>Controller: Request month change
    Controller->>API: POST /api/head-nurse/nurse-reports<br/>{userId, monthYear}
    API->>Service: Get reports for selected month
    Service->>DB: 4. SELECT users + work_reports<br/>LEFT JOIN WHERE department<br/>AND report_month = :selected_month
    DB-->>Service: รายงานพยาบาลของเดือนที่เลือก
    Service->>Service: Calculate statistics
    Service-->>API: Processed reports data
    API-->>Controller: {nurses: [...]}
    Controller-->>UI: Update reports display
    UI-->>HN: 5. ดูภาพรวมสถิติแผนก<br/>(เช้า/บ่าย/ดึก, วันหยุด)

    HN->>UI: 6. คลิกปุ่ม "Export PDF"
    UI->>UI: 7. window.print()<br/>(สร้าง PDF จาก browser)
    UI-->>HN: Download PDF สรุปรายงาน


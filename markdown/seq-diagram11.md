sequenceDiagram
    actor N as Nurse
    participant UI as Work Report UI
    participant Controller as Report Controller
    participant API as Work Report API
    participant Service as Work Report Service
    participant DB as Database

    Note over N,DB: Precondition: ตรวจสอบเวรครบถ้วนแล้ว

    N->>UI: 1. คลิกปุ่ม "บันทึกการทำงาน"
    UI->>UI: 2. แสดง popup ยืนยัน
    UI-->>N: "ยืนยันการบันทึกการทำงานเดือนนี้?"

    N->>UI: 3. กดยืนยันการทำงานตามเวร
    UI->>Controller: Submit work report
    Controller->>API: POST /api/nurse/work-reports<br/>{userId, reportMonth}
    API->>Service: Create monthly work report
    Service->>DB: 4. ตรวจสอบรายงานซ้ำ<br/>SELECT COUNT(*)<br/>WHERE user_id & report_month
    DB-->>Service: report_exists count

    alt มีรายงานซ้ำอยู่แล้ว
        Service-->>API: Validation error
        API-->>Controller: {error: "มีรายงานเดือนนี้แล้ว"}
        Controller-->>UI: Display error
        UI-->>N: แจ้งเตือนไม่สามารถบันทึกซ้ำ
    else ไม่มีรายงานซ้ำ
        Service->>DB: 5a. คำนวณข้อมูลสรุป<br/>SELECT work_days, shifts_count,<br/>total_hours, morning/afternoon/night,<br/>rest_days FROM shift_assignments
        DB-->>Service: สรุปข้อมูลการทำงาน

        Service->>DB: 5b. INSERT work_reports<br/>(user_id, report_month,<br/>work_days, shifts, hours,<br/>morning/afternoon/night, rest_days)
        DB-->>Service: Insert success

        Service-->>API: Report created
        API-->>Controller: 6. {message: "บันทึกสำเร็จ"}
        Controller-->>UI: Display success
        UI-->>N: "บันทึกการทำงานสำเร็จ"
    end

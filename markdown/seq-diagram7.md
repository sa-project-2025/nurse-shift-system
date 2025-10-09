sequenceDiagram
    actor N as Nurse
    participant UI as Shift Exchange UI
    participant Controller as Exchange Controller
    participant API as Exchange API
    participant Service as Exchange Service
    participant DB as Database

    Note over N,DB: Precondition: มีวันที่ไม่ว่างและต้องการแลกเวร

    N->>UI: 1. คลิกเข้าเมนู "ขอแลกเวร"
    UI->>Controller: Load shift exchange page
    Controller->>API: POST /api/nurse/my-schedule
    API->>Service: Get nurse's published shifts
    Service->>DB: 2. SELECT schedules + shift_assignments<br/>WHERE user_id & เดือนปัจจุบัน<br/>AND status='published'
    DB-->>Service: รายการเวรของตัวเอง
    Service-->>API: Nurse's shifts data
    API-->>Controller: {schedules: [...]}
    Controller-->>UI: Render exchange page
    UI-->>N: แสดงวันที่มีเวร (Step 1)

    N->>UI: 3. เลือกเดือนและวันที่จะแลกเวร
    N->>UI: 4. กดปุ่ม "ถัดไป"

    UI->>Controller: Request available shifts
    Controller->>API: POST /api/nurse/all-schedules<br/>{departmentId, monthYear, excludeUserId}
    API->>Service: Get available shifts for exchange
    Service->>DB: 5. SELECT schedules + assignments + users<br/>WHERE department & เดือน<br/>AND NOT IN (my shifts)<br/>GROUP BY schedule with nurses list
    DB-->>Service: เวรที่สามารถแลกได้
    Service-->>API: Available shifts with nurses
    API-->>Controller: {schedules: [...]}
    Controller-->>UI: Update to Step 2
    UI-->>N: แสดงเวรที่แลกได้พร้อมรายชื่อ

    N->>UI: 6. กดเวรที่ต้องการแลกของเพื่อน
    N->>UI: 7. กดปุ่ม "ถัดไป"

    UI-->>N: 8. แสดงรายชื่อพยาบาล<br/>ในเวรที่เลือก (Step 3)

    N->>UI: 9. กดเลือกเพื่อนที่ต้องการแลกด้วย
    N->>UI: 10. กดปุ่ม "ถัดไป"

    N->>UI: 11. ใส่เหตุผลการแลกเวร<br/>และกด "ส่งคำขอแลกเวร"

    UI->>Controller: Submit exchange request
    Controller->>API: POST /api/nurse/shift-exchange/create<br/>{requesterId, targetUserId,<br/>originalScheduleId, targetScheduleId, reason}
    API->>Service: Validate and create request

    Service->>DB: 12a. ตรวจสอบคำขอ pending<br/>SELECT exchange_id<br/>WHERE status='pending'<br/>AND (requester OR target)<br/>AND original_schedule
    DB-->>Service: Pending check result

    Service->>DB: 12b. ตรวจสอบเวรซ้ำของผู้ขอ<br/>SELECT assignment_id FROM shift_assignments<br/>JOIN schedules<br/>WHERE user_id=requester<br/>AND date=target_date<br/>AND shift_type=target_shift_type
    DB-->>Service: Requester duplicate check

    Service->>DB: 12c. ตรวจสอบเวรซ้ำของเป้าหมาย<br/>SELECT assignment_id FROM shift_assignments<br/>JOIN schedules<br/>WHERE user_id=target<br/>AND date=original_date<br/>AND shift_type=original_shift_type
    DB-->>Service: Target duplicate check

    alt ตรวจสอบไม่ผ่าน
        Service-->>API: Validation error
        API-->>Controller: {error: "..."}
        Controller-->>UI: Show error message
        UI-->>N: แสดงข้อผิดพลาด<br/>(มี pending/เวรซ้ำกะเดียวกัน)
        Note over N,UI: 13. กลับไปทำใหม่ตั้งแต่ข้อ 1
    else ตรวจสอบผ่าน
        Service->>DB: INSERT shift_exchange_requests<br/>(requester, target, schedules,<br/>reason, request_date=NOW() AT TIME ZONE 'Asia/Bangkok',<br/>status='pending')
        DB-->>Service: Insert success
        Service-->>API: Request created
        API-->>Controller: {message: "ส่งคำขอแลกเวรสำเร็จ"}
        Controller->>Controller: Reset form to Step 1
        Controller-->>UI: 14. แสดงข้อความสำเร็จ
        UI-->>N: Toast: "ส่งคำขอแลกเวรเรียบร้อยแล้ว"
    end

    N->>UI: 15. กดแถบ "คำขอของฉัน"
    UI->>Controller: Request my exchange requests
    Controller->>API: POST /api/nurse/shift-exchange/my-requests<br/>{userId}
    API->>Service: Get user's sent requests
    Service->>DB: 16. SELECT shift_exchange_requests<br/>JOIN users ON target_user_id<br/>JOIN schedules (original & target)<br/>WHERE requester_id = :userId<br/>ORDER BY request_date DESC
    DB-->>Service: All user's requests
    Service-->>API: Requests with details
    API-->>Controller: {requests: [...]}
    Controller-->>UI: Update tab display
    UI-->>N: แสดงรายการคำขอทั้งหมด<br/>(🟡 pending / 🟢 approved / 🔴 rejected)

    N->>UI: 17. กดแถบ "ประวัติ"
    UI->>Controller: Request exchange history
    Controller->>API: POST /api/nurse/shift-exchange/my-requests<br/>{userId}
    API->>Service: Get completed sent requests
    Service->>DB: 18a. SELECT (คำขอที่ส่งไป)<br/>WHERE requester_id = :userId<br/>AND status IN ('approved', 'rejected')
    DB-->>Service: Sent requests history

    Controller->>API: POST /api/nurse/shift-exchange/incoming-history<br/>{userId}
    API->>Service: Get completed received requests
    Service->>DB: 18b. SELECT (คำขอที่ได้รับ)<br/>WHERE target_user_id = :userId<br/>AND status IN ('approved', 'rejected')
    DB-->>Service: Received requests history
    Service-->>API: Combined history
    API-->>Controller: {requests: [...]}
    Controller->>Controller: Sort by request_date DESC
    Controller-->>UI: Update history tab
    UI-->>N: แสดงประวัติทั้งหมด<br/>📤 คำขอของฉัน<br/>📥 คำขอที่ได้รับ<br/>(เรียงล่าสุดก่อน)

    Note over N,DB: Notification: Layout จะโหลด incoming requests<br/>ทุก 30 วินาที และแสดงตัวเลข badge ที่เมนู

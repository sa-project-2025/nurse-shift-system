sequenceDiagram
    actor N as Nurse
    participant UI as Leave Request UI
    participant Controller as Leave Controller
    participant API as Leave Request API
    participant Service as Leave Service
    participant DB as Database

    N->>UI: 1. คลิกเข้าเมนู "ขอลางาน"
    UI->>Controller: Load leave request page
    Controller-->>UI: Render page
    UI-->>N: 2. แสดงแบบฟอร์มคำขอลางาน

    N->>UI: 3. กรอกข้อมูลคำขอลางาน:<br/>- เลือกประเภทการลา<br/>- เลือกวันที่เริ่มต้นและสิ้นสุด<br/>- กรอกเหตุผล
    UI->>Controller: Date range selected
    Controller->>API: POST /api/nurse/leave-request/affected-schedules<br/>{userId, startDate, endDate}
    API->>Service: Get affected schedules
    Service->>DB: 4. SELECT schedules + shift_assignments<br/>WHERE user_id AND date BETWEEN<br/>AND status = 'published'
    DB-->>Service: เวรที่ได้รับผลกระทบ
    Service-->>API: Affected schedules
    API-->>Controller: {schedules: [...]}
    Controller-->>UI: Display affected shifts
    UI-->>N: 5. แสดงจำนวนวันลา<br/>และเวรที่ได้รับผลกระทบ

    N->>UI: 6. กดปุ่ม "ส่งคำขอลางาน"
    UI->>Controller: Submit leave request
    Controller->>API: POST /api/nurse/leave-request/create<br/>{userId, startDate, endDate,<br/>leaveDays, leaveType, reason}
    API->>Service: Validate and create request

    Service->>Service: 7a. ตรวจสอบข้อมูลครบถ้วน<br/>(userId, startDate, endDate,<br/>leaveType, reason)<br/>end_date >= start_date

    Service->>DB: 7b. SELECT leave_requests<br/>WHERE user_id AND status = 'pending'
    DB-->>Service: คำขอที่รอการอนุมัติ
    Service->>Service: 7. ตรวจสอบซ้อนทับใน JS:<br/>reqStart <= newEnd<br/>AND reqEnd >= newStart

    alt ข้อมูลไม่ครบ หรือ ซ้อนทับกับคำขอเก่า
        Service-->>API: Error response
        API-->>Controller: {error: "..."}
        Controller-->>UI: Show error toast
        UI-->>N: 7c. แสดงข้อความ error<br/>(ข้อมูลไม่ครบ/วันที่ซ้อนทับ)
        Note over N,UI: 8. กลับไปทำข้อ 3 จนกว่าจะถูก
    else ข้อมูลถูกต้อง ไม่ซ้อนทับ
        Service->>DB: 9. INSERT INTO leave_requests<br/>(user_id, start_date, end_date,<br/>leave_days, leave_type, reason,<br/>status='pending',<br/>request_date=NOW())
        DB-->>Service: Insert success
        Service-->>API: {message: "สำเร็จ"}
        API-->>Controller: Success response
        Controller-->>UI: Show success toast
        UI-->>N: 10. แสดงข้อความ<br/>"ส่งคำขอลางานเรียบร้อยแล้ว"
    end

    N->>UI: 11. กดแถบ "รอการอนุมัติ"
    UI->>Controller: Request pending leaves
    Controller->>API: GET /api/nurse/leave-request/my-requests?status=pending
    API->>Service: Get pending requests
    Service->>DB: 12. SELECT leave_requests<br/>LEFT JOIN users (approver)<br/>WHERE user_id AND status = 'pending'<br/>ORDER BY request_date DESC
    DB-->>Service: คำขอที่รอการอนุมัติ
    Service-->>API: Pending requests
    API-->>Controller: {requests: [...]}
    Controller-->>UI: Display pending
    UI-->>N: แสดงคำขอที่รอการอนุมัติ<br/>🟡 รอการอนุมัติ

    N->>UI: 13. กดแถบ "อนุมัติแล้ว"
    UI->>Controller: Request approved leaves
    Controller->>API: GET /api/nurse/leave-request/my-requests?status=approved
    API->>Service: Get approved requests
    Service->>DB: 14. SELECT leave_requests<br/>LEFT JOIN users (approver)<br/>WHERE user_id AND status = 'approved'<br/>ORDER BY request_date DESC
    DB-->>Service: คำขอที่อนุมัติแล้ว
    Service-->>API: Approved requests
    API-->>Controller: {requests: [...]}
    Controller-->>UI: Display approved
    UI-->>N: แสดงคำขอที่อนุมัติแล้ว<br/>🟢 อนุมัติแล้ว<br/>+ ชื่อผู้อนุมัติ + วันที่อนุมัติ

    N->>UI: 15. กดแถบ "ไม่อนุมัติ"
    UI->>Controller: Request rejected leaves
    Controller->>API: GET /api/nurse/leave-request/my-requests?status=rejected
    API->>Service: Get rejected requests
    Service->>DB: 16. SELECT leave_requests<br/>LEFT JOIN users (approver)<br/>WHERE user_id AND status = 'rejected'<br/>ORDER BY request_date DESC
    DB-->>Service: คำขอที่ไม่อนุมัติ
    Service-->>API: Rejected requests
    API-->>Controller: {requests: [...]}
    Controller-->>UI: Display rejected
    UI-->>N: แสดงคำขอที่ไม่อนุมัติ<br/>🔴 ไม่อนุมัติ<br/>+ ปฏิเสธโดย + เหตุผลที่ปฏิเสธ

    N->>UI: 17. กดแถบ "ทั้งหมด"
    UI->>Controller: Request all leaves
    Controller->>API: GET /api/nurse/leave-request/my-requests
    API->>Service: Get all requests
    Service->>DB: 18. SELECT leave_requests<br/>LEFT JOIN users (approver)<br/>WHERE user_id (ทุกสถานะ)<br/>ORDER BY request_date DESC
    DB-->>Service: คำขอทั้งหมด
    Service-->>API: All requests
    API-->>Controller: {requests: [...]}
    Controller-->>UI: Display all
    UI-->>N: แสดงคำขอทั้งหมด<br/>(pending, approved, rejected)

sequenceDiagram
    actor HN as Head Nurse
    participant UI as Leave Approvals UI
    participant Controller as Leave Controller
    participant API as Leave Approval API
    participant Service as Leave Service
    participant DB as Database

    HN->>UI: 1. คลิกเข้าเมนู "อนุมัติคำขอลางาน"
    UI->>Controller: Load leave approvals page
    Controller->>API: GET /api/head-nurse/leave-request/all-requests<br/>{departmentId}
    API->>Service: Get pending leave requests
    Service->>DB: 2. SELECT leave_requests + users<br/>JOIN WHERE department_id<br/>AND status = 'pending'<br/>ORDER BY request_date ASC
    DB-->>Service: คำขอลาที่รอการอนุมัติ
    Service-->>API: Pending requests data
    API-->>Controller: {requests: [...]}
    Controller-->>UI: Render approvals page
    UI-->>HN: แสดงรายการคำขอที่รอการอนุมัติ<br/>(ชื่อ, วันที่, เหตุผล, เวรที่กระทบ)

    HN->>UI: 3. กด "อนุมัติ" หรือ "ปฏิเสธ"<br/>คำขอลาของพยาบาล
    UI->>Controller: Submit response
    Controller->>API: POST /api/head-nurse/leave-request/respond<br/>{leaveId, response, approvedBy,<br/>reasonReject (if rejected)}
    API->>Service: Process leave response

    Service->>Service: 4. ระบบเปลี่ยนสถานะคำขอลาตามที่กด

    alt กดปุ่ม "อนุมัติ"
        Service->>DB: 4a.1 UPDATE leave_requests<br/>SET status = 'approved',<br/>approved_by, response_date<br/>WHERE leave_id
        DB-->>Service: Update success

        Service->>DB: 4a.2 SELECT assignment_id<br/>FROM shift_assignments + schedules<br/>WHERE user_id AND date BETWEEN<br/>AND status = 'published'
        DB-->>Service: รายการ assignment ที่ต้องลบ

        Service->>DB: 4a.3 DELETE FROM shift_assignments<br/>WHERE user_id<br/>AND schedules_id IN<br/>(SELECT WHERE date BETWEEN)
        DB-->>Service: Delete success

        Service-->>API: {message: "อนุมัติสำเร็จ"}
        API-->>Controller: Success response
        Controller-->>UI: Show success toast
        UI-->>HN: 5. แสดงข้อความ<br/>"อนุมัติคำขอลางานเรียบร้อยแล้ว"

    else กดปุ่ม "ปฏิเสธ"
        Service->>DB: 4b. UPDATE leave_requests<br/>SET status = 'rejected',<br/>approved_by, response_date,<br/>reason_reject<br/>WHERE leave_id
        DB-->>Service: Update success

        Service-->>API: {message: "ปฏิเสธสำเร็จ"}
        API-->>Controller: Success response
        Controller-->>UI: Show success toast
        UI-->>HN: 5. แสดงข้อความ<br/>"ปฏิเสธคำขอลางานเรียบร้อยแล้ว"
    end

    UI->>UI: รีเฟรชรายการคำขอ<br/>อัปเดต badge (-1)

    HN->>UI: 6. กดแถบ "อนุมัติแล้ว"
    UI->>Controller: Request approved leaves
    Controller->>API: GET /api/head-nurse/leave-request/all-requests?status=approved
    API->>Service: Get approved requests
    Service->>DB: 7. SELECT leave_requests + users<br/>WHERE department_id<br/>AND status = 'approved'<br/>ORDER BY response_date DESC
    DB-->>Service: คำขอที่อนุมัติแล้ว
    Service-->>API: Approved requests
    API-->>Controller: {requests: [...]}
    Controller-->>UI: Display approved
    UI-->>HN: แสดงคำขอที่อนุมัติแล้ว<br/>🟢 อนุมัติแล้ว<br/>+ วันที่อนุมัติ

    HN->>UI: 8. กดแถบ "ไม่อนุมัติ"
    UI->>Controller: Request rejected leaves
    Controller->>API: GET /api/head-nurse/leave-request/all-requests?status=rejected
    API->>Service: Get rejected requests
    Service->>DB: 9. SELECT leave_requests + users<br/>WHERE department_id<br/>AND status = 'rejected'<br/>ORDER BY response_date DESC
    DB-->>Service: คำขอที่ปฏิเสธแล้ว
    Service-->>API: Rejected requests
    API-->>Controller: {requests: [...]}
    Controller-->>UI: Display rejected
    UI-->>HN: แสดงคำขอที่ไม่อนุมัติ<br/>🔴 ไม่อนุมัติ<br/>+ เหตุผลที่ปฏิเสธ

    HN->>UI: 10. กดแถบ "ทั้งหมด"
    UI->>Controller: Request all leaves
    Controller->>API: GET /api/head-nurse/leave-request/all-requests
    API->>Service: Get all requests
    Service->>DB: 11. SELECT leave_requests + users<br/>WHERE department_id (ทุกสถานะ)<br/>ORDER BY request_date DESC
    DB-->>Service: คำขอทั้งหมด
    Service-->>API: All requests
    API-->>Controller: {requests: [...]}
    Controller-->>UI: Display all
    UI-->>HN: แสดงคำขอทั้งหมด<br/>(pending, approved, rejected)

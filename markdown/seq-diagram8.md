sequenceDiagram
    actor N as Nurse
    participant UI as Shift Exchange UI
    participant Controller as Exchange Controller
    participant API as Exchange API
    participant Service as Exchange Service
    participant DB as Database

    Note over N,DB: Precondition: พยาบาลได้รับแจ้งเตือนที่เมนู "ขอแลกเวร"

    N->>UI: 1. คลิกเข้าเมนู "ขอแลกเวร"<br/>ที่มีแจ้งเตือนขึ้น
    UI->>Controller: Load exchange page
    Controller-->>UI: Render page

    N->>UI: 2. พยาบาลเปลี่ยนไปยัง tab<br/>"คำขอจากเพื่อน"
    UI->>Controller: Request incoming requests
    Controller->>API: POST /api/nurse/shift-exchange/incoming-requests<br/>{userId}
    API->>Service: Get pending incoming requests

    Service->>DB: 3. ดึงคำขอที่รอการตอบรับ<br/>SELECT shift_exchange_requests<br/>JOIN users ON requester_id<br/>JOIN schedules (original & target)<br/>WHERE target_user_id=:userId<br/>AND status='pending'<br/>ORDER BY request_date DESC
    DB-->>Service: รายการคำขอที่รอตอบรับ
    Service-->>API: Requests with details
    API-->>Controller: {requests: [...]}
    Controller-->>UI: Update tab display

    UI-->>N: 4. แสดงคำขอที่ถูกส่งมาจากต้นทาง<br/>(ชื่อผู้ขอ, เวรเดิม, เวรใหม่, เหตุผล, เวลา)

    N->>UI: 5. กดปุ่ม "ยอมรับ" หรือ "ปฏิเสธ"<br/>คำขอแลกเวร
    UI->>UI: แสดง confirm dialog
    N->>UI: ยืนยันการตอบรับ
    UI->>Controller: Submit response
    Controller->>API: POST /api/nurse/shift-exchange/respond<br/>{exchangeId, response}
    API->>Service: Process response

    alt 6a. กรณีกดปุ่ม "ยอมรับ" (approved)
        Service->>DB: 6. เปลี่ยนสถานะคำขอ<br/>UPDATE shift_exchange_requests<br/>SET status='approved'<br/>WHERE exchange_id=:exchangeId
        DB-->>Service: Status updated

        Service->>DB: 6a.1 ดึงข้อมูล assignment ทั้งสองฝ่าย<br/>SELECT assignment_id, user_id<br/>FROM shift_assignments<br/>WHERE schedules_id=:originalScheduleId<br/>AND user_id=:requesterId
        DB-->>Service: Requester assignment

        Service->>DB: SELECT assignment_id, user_id<br/>FROM shift_assignments<br/>WHERE schedules_id=:targetScheduleId<br/>AND user_id=:targetUserId
        DB-->>Service: Target assignment

        Service->>DB: 6a.2 สลับ user_id ใน shift_assignments<br/>UPDATE shift_assignments<br/>SET user_id=:targetUserId<br/>WHERE assignment_id=:requesterAssignmentId
        DB-->>Service: Requester assignment swapped

        Service->>DB: UPDATE shift_assignments<br/>SET user_id=:requesterId<br/>WHERE assignment_id=:targetAssignmentId
        DB-->>Service: Target assignment swapped

        Service->>DB: 6a.3 ลบ work_reports ของทั้งสองคน<br/>ในเดือนนั้นกรณีบันทึกไปแล้ว<br/>DELETE FROM work_reports<br/>WHERE user_id=:requesterId<br/>AND report_month=:reportMonth
        DB-->>Service: Requester report deleted

        Service->>DB: DELETE FROM work_reports<br/>WHERE user_id=:targetUserId<br/>AND report_month=:reportMonth
        DB-->>Service: Target report deleted

        Note over Service,DB: สลับเวรสำเร็จ<br/>และลบรายงานเพื่อให้บันทึกใหม่

        Service-->>API: {message: "ยอมรับคำขอแลกเวรเรียบร้อยแล้ว"}

    else 6b. กรณีกดปุ่ม "ปฏิเสธ" (rejected)
        Service->>DB: 6. เปลี่ยนสถานะคำขอ<br/>UPDATE shift_exchange_requests<br/>SET status='rejected'<br/>WHERE exchange_id=:exchangeId
        DB-->>Service: Status updated

        Note over Service,DB: shift_assignments ยังคงเดิม<br/>work_reports ยังคงเดิม

        Service-->>API: {message: "ปฏิเสธคำขอแลกเวรเรียบร้อยแล้ว"}
    end

    API-->>Controller: Response result
    Controller->>Controller: Reload incoming requests & history
    Controller-->>UI: Update UI
    UI-->>N: 7. แสดงข้อความทำรายการสำเร็จ<br/>Toast: "ดำเนินการสำเร็จ"

    Note over N,DB: อัปเดต badge notification (-1)<br/>และรีเฟรชรายการคำขอ
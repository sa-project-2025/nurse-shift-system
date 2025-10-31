# State Diagram - Nurse Shift Management System

## 1. Leave Request State Diagram (การส่งคำขอลา)

```mermaid
stateDiagram-v2
    [*] --> LeaveRequest_Pending : พยาบาลส่งคำขอลา<br/>POST /api/nurse/leave-request/create<br/>INSERT INTO leave_requests<br/>(user_id, start_date, end_date,<br/>leave_type, reason, status)

    LeaveRequest_Pending --> LeaveRequest_Approved : หัวหน้าพยาบาลอนุมัติ<br/>POST /api/head-nurse/leave-request/respond<br/>UPDATE leave_requests SET<br/>status = 'approved',<br/>approved_by = head_nurse_id,<br/>response_date = NOW()<br/>WHERE leave_id = '...'

    LeaveRequest_Pending --> LeaveRequest_Rejected : หัวหน้าพยาบาลปฏิเสธ<br/>POST /api/head-nurse/leave-request/respond<br/>UPDATE leave_requests SET<br/>status = 'rejected',<br/>reason_reject = '...',<br/>approved_by = head_nurse_id,<br/>response_date = NOW()<br/>WHERE leave_id = '...'

    LeaveRequest_Approved --> DeleteAssignments : ลบเวรที่ได้รับมอบหมาย<br/>DELETE FROM shift_assignments<br/>WHERE user_id = '...'<br/>AND schedules_id IN (ช่วงวันที่ลา)

    DeleteAssignments --> [*]
    LeaveRequest_Rejected --> [*]

    note right of LeaveRequest_Pending
        สถานะ: pending
        - พยาบาลสามารถดูได้จาก
          GET /api/nurse/leave-request/my-requests
        - หัวหน้าพยาบาลเห็นใน
          GET /api/head-nurse/leave-request/all-requests
        - ตรวจสอบไม่ให้มีคำขอซ้อนทับกัน
    end note

    note right of LeaveRequest_Approved
        สถานะ: approved
        - บันทึกผู้อนุมัติและวันที่
        - ลบเวรทั้งหมดในช่วงวันลา
        - พยาบาลได้รับการแจ้งเตือน
    end note

    note right of LeaveRequest_Rejected
        สถานะ: rejected
        - ต้องระบุเหตุผลการปฏิเสธ
        - พยาบาลยังคงมีเวรเดิม
        - พยาบาลได้รับการแจ้งเตือน
    end note
```

### คำอธิบาย Leave Request States

| State | Description | Actions |
|-------|-------------|---------|
| **Pending** | คำขอลารอการพิจารณา | - พยาบาลส่งคำขอพร้อมระบุวันที่และเหตุผล<br/>- ตรวจสอบไม่ให้มีคำขอซ้อนทับกัน<br/>- รอหัวหน้าพยาบาลพิจารณา |
| **Approved** | คำขอลาได้รับการอนุมัติ | - บันทึก approved_by และ response_date<br/>- ลบเวรทั้งหมดในช่วงวันที่ลา<br/>- อัพเดทสถานะเป็น approved |
| **Rejected** | คำขอลาถูกปฏิเสธ | - บันทึกเหตุผลการปฏิเสธ (reason_reject)<br/>- บันทึก approved_by และ response_date<br/>- เวรยังคงเดิม ไม่มีการเปลี่ยนแปลง |

### Business Rules (Leave Request)

1. **Validation**: ไม่สามารถมีคำขอลาที่ช่วงวันซ้อนทับกันในสถานะ pending
2. **Approval Impact**: เมื่ออนุมัติ ระบบจะลบ shift_assignments ทั้งหมดในช่วงวันที่ลา
3. **Rejection Requirement**: ต้องระบุเหตุผลการปฏิเสธทุกครั้ง
4. **Leave Types**:
   - Predefined: 'sick', 'personal', 'vacation', 'other'
   - Custom: สามารถระบุประเภทอื่นได้ (max 50 chars)

---

## 2. Shift Exchange Request State Diagram (การส่งคำขอแลกเวร)

```mermaid
stateDiagram-v2
    [*] --> ExchangeRequest_Pending : พยาบาล A ส่งคำขอสลับเวรกับ B<br/>POST /api/nurse/shift-exchange/create<br/>INSERT INTO shift_exchange_requests<br/>(requester_id, target_user_id,<br/>original_schedule_id,<br/>target_schedule_id, reason, status)

    ExchangeRequest_Pending --> ValidateConflict : ตรวจสอบความขัดแย้ง<br/>- ตรวจสอบ A ไม่มีเวรซ้ำในวันของ B<br/>- ตรวจสอบ B ไม่มีเวรซ้ำในวันของ A<br/>- ตรวจสอบไม่มีคำขอ pending ซ้ำ

    ValidateConflict --> ExchangeRequest_Rejected : พบข้อขัดแย้ง<br/>UPDATE shift_exchange_requests<br/>SET status = 'rejected'<br/>WHERE exchange_id = '...'

    ValidateConflict --> WaitingResponse : ไม่มีข้อขัดแย้ง<br/>รอพยาบาล B ตอบรับ

    WaitingResponse --> ExchangeRequest_Approved : พยาบาล B อนุมัติ<br/>POST /api/nurse/shift-exchange/respond<br/>UPDATE shift_exchange_requests<br/>SET status = 'approved'<br/>WHERE exchange_id = '...'

    WaitingResponse --> ExchangeRequest_Rejected : พยาบาล B ปฏิเสธ<br/>POST /api/nurse/shift-exchange/respond<br/>UPDATE shift_exchange_requests<br/>SET status = 'rejected'<br/>WHERE exchange_id = '...'

    ExchangeRequest_Approved --> SwapAssignments : สลับการมอบหมายเวร<br/>UPDATE shift_assignments<br/>SET user_id = (CASE<br/>  WHEN user_id = A THEN B<br/>  WHEN user_id = B THEN A<br/>END)<br/>WHERE schedules_id IN<br/>(original_schedule_id,<br/>target_schedule_id)

    SwapAssignments --> DeleteWorkReports : ลบรายงานการทำงาน<br/>เพื่อคำนวณใหม่<br/>DELETE FROM work_reports<br/>WHERE user_id IN (A, B)<br/>AND report_month = '...'

    DeleteWorkReports --> [*]
    ExchangeRequest_Rejected --> [*]

    note right of ExchangeRequest_Pending
        สถานะ: pending
        - พยาบาล A ดูได้จาก
          GET /api/nurse/shift-exchange/my-requests
        - พยาบาล B ดูได้จาก
          GET /api/nurse/shift-exchange/incoming-requests
    end note

    note right of ValidateConflict
        Business Rules:
        1. A ต้องไม่มี shift_type เดียวกันกับ B
           ในวันที่ต้องการสลับไป
        2. B ต้องไม่มี shift_type เดียวกันกับ A
           ในวันที่ต้องการสลับมา
        3. ไม่มี pending request ซ้ำสำหรับ
           schedule เดียวกัน
    end note

    note right of ExchangeRequest_Approved
        สถานะ: approved
        - สลับ user_id ใน shift_assignments
        - ลบ work_reports ของทั้ง 2 คน
          ในเดือนที่เกี่ยวข้อง
        - ทั้ง 2 คนได้รับการแจ้งเตือน
    end note

    note right of ExchangeRequest_Rejected
        สถานะ: rejected
        - เวรยังคงเดิม
        - พยาบาล A ได้รับการแจ้งเตือน
        - ดูประวัติได้จาก
          GET /api/nurse/shift-exchange/incoming-history
    end note
```

### คำอธิบาย Shift Exchange States

| State | Description | Actions |
|-------|-------------|---------|
| **Pending** | คำขอสลับเวรรอการตรวจสอบ | - พยาบาล A (requester) ส่งคำขอพร้อมระบุเหตุผล<br/>- ระบุเวรของตนเอง (original_schedule_id)<br/>- ระบุเวรที่ต้องการสลับ (target_schedule_id) |
| **Validate Conflict** | ตรวจสอบข้อขัดแย้ง | - ตรวจสอบ A ไม่มีเวรซ้ำในวันของ B<br/>- ตรวจสอบ B ไม่มีเวรซ้ำในวันของ A<br/>- ตรวจสอบไม่มีคำขอ pending ซ้ำ |
| **Waiting Response** | รอพยาบาล B ตอบรับ | - พยาบาล B เห็นคำขอใน incoming requests<br/>- B สามารถอนุมัติหรือปฏิเสธได้ |
| **Approved** | คำขอได้รับการอนุมัติ | - สลับ user_id ใน shift_assignments<br/>- ลบ work_reports ของทั้ง 2 คนในเดือนที่เกี่ยวข้อง<br/>- เพื่อให้คำนวณใหม่ในภายหลัง |
| **Rejected** | คำขอถูกปฏิเสธ | - เวรยังคงเดิม ไม่มีการเปลี่ยนแปลง<br/>- บันทึกประวัติไว้ใน history |

### Business Rules (Shift Exchange)

1. **Conflict Prevention**:
   - Requester (A) ต้องไม่มีเวรประเภทเดียวกันในวันที่ต้องการสลับไป
   - Target user (B) ต้องไม่มีเวรประเภทเดียวกันในวันที่ต้องการสลับมา

2. **Duplicate Prevention**: ไม่สามารถมีคำขอ pending ซ้ำสำหรับ schedule เดียวกัน

3. **Approval Impact**:
   - สลับ assignments ของทั้ง 2 คน
   - ลบ work_reports เพื่อให้คำนวณใหม่

4. **Data Integrity**:
   - ทั้ง original_schedule_id และ target_schedule_id ต้องมีอยู่จริง
   - ทั้ง 2 schedules ต้องมีการ assign ให้กับพยาบาลทั้ง 2 คน

---

## 3. ตารางสรุปสถานะทั้งหมด

### Leave Request Status Flow

```
[Start] → Pending → Approved → [End with deleted shifts]
                 ↘ Rejected → [End with original shifts]
```

### Shift Exchange Request Status Flow

```
[Start] → Pending → Validate → Waiting → Approved → [End with swapped shifts]
                           ↓              ↘ Rejected → [End with original shifts]
                      Rejected → [End]
```

---

## 4. API Endpoints ที่เกี่ยวข้อง

### Leave Request APIs

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/nurse/leave-request/create` | Nurse | สร้างคำขอลา |
| POST | `/api/nurse/leave-request/my-requests` | Nurse | ดูคำขอลาของตนเอง |
| POST | `/api/nurse/leave-request/affected-schedules` | Nurse | ดูเวรที่จะได้รับผลกระทบ |
| POST | `/api/head-nurse/leave-request/all-requests` | Head Nurse | ดูคำขอลาทั้งหมดในแผนก |
| POST | `/api/head-nurse/leave-request/pending-count` | Head Nurse | นับจำนวนคำขอที่รอพิจารณา |
| POST | `/api/head-nurse/leave-request/respond` | Head Nurse | อนุมัติ/ปฏิเสธคำขอลา |

### Shift Exchange Request APIs

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | `/api/nurse/shift-exchange/create` | Nurse | สร้างคำขอสลับเวร |
| POST | `/api/nurse/shift-exchange/my-requests` | Nurse | ดูคำขอที่ตนเองส่ง |
| POST | `/api/nurse/shift-exchange/incoming-requests` | Nurse | ดูคำขอที่ได้รับ (pending) |
| POST | `/api/nurse/shift-exchange/incoming-history` | Nurse | ดูประวัติคำขอที่ได้รับ |
| POST | `/api/nurse/shift-exchange/respond` | Nurse | อนุมัติ/ปฏิเสธคำขอสลับเวร |

---

## 5. Database Tables Schema

### leave_requests Table

```sql
CREATE TABLE leave_requests (
    leave_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    leave_days INTEGER,
    leave_type VARCHAR(50),
    reason TEXT,
    reason_reject TEXT,
    request_date TIMESTAMP DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending',
    approved_by INTEGER REFERENCES users(user_id),
    response_date TIMESTAMP
);
```

### shift_exchange_requests Table

```sql
CREATE TABLE shift_exchange_requests (
    exchange_id SERIAL PRIMARY KEY,
    requester_id INTEGER REFERENCES users(user_id),
    target_user_id INTEGER REFERENCES users(user_id),
    original_schedule_id INTEGER REFERENCES schedules(schedules_id),
    target_schedule_id INTEGER REFERENCES schedules(schedules_id),
    request_date TIMESTAMP DEFAULT NOW(),
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending'
);
```

---

## 6. Status Enumerations

### Leave Request Status
- `pending` - รอการพิจารณา
- `approved` - อนุมัติแล้ว
- `rejected` - ปฏิเสธแล้ว

### Shift Exchange Request Status
- `pending` - รอการตอบรับจากพยาบาลอีกฝ่าย
- `approved` - อนุมัติแล้ว (เวรถูกสลับแล้ว)
- `rejected` - ปฏิเสธแล้ว (โดยระบบหรือพยาบาลอีกฝ่าย)

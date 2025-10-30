# UI Structure - ระบบจัดการตารางเวรพยาบาล

## 📋 Page Tree Structure

```
/
├── /login (หน้า Login)
│   └── API: POST /api/auth/login
│       ├── Role: nurse → /dashboard/nurse
│       └── Role: head_nurse → /dashboard/head-nurse
│
├── /register (หน้า Register)
│   └── API: POST /api/auth/register
│       └── Success → /login
│
├── /dashboard/nurse (Dashboard พยาบาล)
│   ├── Layout: Sidebar + User Profile + Notifications
│   │
│   ├── /my-schedule (ตารางเวรของฉัน)
│   │   ├── แสดงตารางเวรรายเดือน
│   │   ├── เลือกเดือน (Month Selector)
│   │   ├── ดูรายละเอียดเวรแต่ละวัน
│   │   └── API: POST /api/nurse/my-schedule
│   │
│   ├── /shift-exchange (ขอแลกเวร)
│   │   ├── Tab 1: ส่งคำขอใหม่
│   │   │   ├── เลือกเวรของฉันที่ต้องการแลก
│   │   │   ├── เลือกเวรที่ต้องการแลก
│   │   │   ├── เลือกเพื่อนที่ต้องการแลกด้วย
│   │   │   ├── กรอกเหตุผล
│   │   │   └── API: POST /api/nurse/shift-exchange/create
│   │   │
│   │   ├── Tab 2: คำขอของฉัน (Pending)
│   │   │   ├── ดูคำขอที่ส่งไป
│   │   │   ├── ดูสถานะคำขอ
│   │   │   └── API: POST /api/nurse/shift-exchange/my-requests
│   │   │
│   │   ├── Tab 3: คำขอจากเพื่อน [Badge: count]
│   │   │   ├── ดูคำขอที่ได้รับ
│   │   │   ├── ตอบรับ/ปฏิเสธ
│   │   │   ├── API: POST /api/nurse/shift-exchange/incoming-requests
│   │   │   └── API: POST /api/nurse/shift-exchange/respond
│   │   │
│   │   └── Tab 4: ประวัติ
│   │       ├── ดูคำขอที่อนุมัติ/ปฏิเสธแล้ว
│   │       └── API: POST /api/nurse/shift-exchange/incoming-history
│   │
│   ├── /leave-request (ขอลางาน)
│   │   ├── Tab 1: ส่งคำขอใหม่
│   │   │   ├── เลือกประเภทการลา (sick/personal/vacation/other)
│   │   │   ├── เลือกวันที่เริ่มต้น-สิ้นสุด
│   │   │   ├── กรอกเหตุผล
│   │   │   ├── ดูเวรที่ได้รับผลกระทบ
│   │   │   ├── API: POST /api/nurse/leave-request/affected-schedules
│   │   │   └── API: POST /api/nurse/leave-request/create
│   │   │
│   │   ├── Tab 2: รอการอนุมัติ
│   │   │   ├── ดูคำขอ status = pending
│   │   │   └── API: POST /api/nurse/leave-request/my-requests
│   │   │
│   │   ├── Tab 3: อนุมัติแล้ว
│   │   │   ├── ดูคำขอ status = approved
│   │   │   └── API: POST /api/nurse/leave-request/my-requests
│   │   │
│   │   ├── Tab 4: ไม่อนุมัติ
│   │   │   ├── ดูคำขอ status = rejected
│   │   │   └── API: POST /api/nurse/leave-request/my-requests
│   │   │
│   │   └── Tab 5: ทั้งหมด
│   │       ├── ดูคำขอทั้งหมด
│   │       └── API: POST /api/nurse/leave-request/my-requests
│   │
│   └── /my-reports (รายงานเวรของฉัน)
│       ├── เลือกเดือน
│       ├── แสดงสถิติการทำงาน
│       │   ├── วันทำงาน, กะทั้งหมด, ชั่วโมงรวม
│       │   ├── กะเช้า/บ่าย/ดึก
│       │   └── วันหยุด
│       ├── Export PDF
│       └── API: POST /api/nurse/work-reports
│
└── /dashboard/head-nurse (Dashboard หัวหน้าพยาบาล)
    ├── Layout: Sidebar + User Profile + Notifications
    │
    ├── /schedule-management (จัดตารางเวร)
    │   ├── แสดง Calendar View
    │   ├── เลือกเดือน (Month Selector)
    │   │
    │   ├── Function 1: สร้างตารางเวร
    │   │   ├── เลือกวันที่
    │   │   ├── เลือกเวร (เช้า/บ่าย/ดึก)
    │   │   ├── ระบุจำนวนพยาบาลที่ต้องการ
    │   │   ├── บันทึกเป็นแบบร่าง (Draft)
    │   │   └── API: POST /api/head-nurse/schedules/create-bulk
    │   │
    │   ├── Function 2: มอบหมายพยาบาล
    │   │   ├── เลือกเวรที่ต้องการมอบหมาย
    │   │   ├── ดูพยาบาลที่ว่าง
    │   │   ├── เลือกพยาบาล
    │   │   ├── API: POST /api/head-nurse/nurses/available
    │   │   └── API: POST /api/head-nurse/schedules/assign
    │   │
    │   ├── Function 3: แก้ไขตารางเวร
    │   │   ├── แก้ไขจำนวนพยาบาลที่ต้องการ
    │   │   ├── ลบพยาบาลออกจากเวร
    │   │   ├── API: POST /api/head-nurse/schedules/update-requirements
    │   │   └── API: POST /api/head-nurse/schedules/remove-assignment
    │   │
    │   ├── Function 4: ประกาศตารางเวร
    │   │   ├── เปลี่ยนสถานะจาก Draft → Published
    │   │   └── API: POST /api/head-nurse/schedules/publish
    │   │
    │   ├── Function 5: ลบแบบร่าง
    │   │   └── API: POST /api/head-nurse/schedules/delete-drafts
    │   │
    │   └── API: POST /api/head-nurse/schedules/monthly (ดูตารางรายเดือน)
    │
    ├── /leave-approvals (อนุมัติคำขอลางาน) [Badge: pending count]
    │   ├── Tab 1: รอการอนุมัติ [Badge]
    │   │   ├── แสดงคำขอ status = pending
    │   │   ├── ดูรายละเอียดคำขอ
    │   │   ├── ดูเวรที่ได้รับผลกระทบ
    │   │   ├── อนุมัติ (Approve)
    │   │   │   ├── ยกเลิกเวรที่ได้รับผลกระทบ
    │   │   │   └── ลบ work_reports
    │   │   ├── ปฏิเสธ (Reject)
    │   │   │   └── ระบุเหตุผล
    │   │   └── API: POST /api/head-nurse/leave-request/respond
    │   │
    │   ├── Tab 2: อนุมัติแล้ว
    │   │   ├── แสดงคำขอ status = approved
    │   │   └── API: POST /api/head-nurse/leave-request/all-requests
    │   │
    │   ├── Tab 3: ไม่อนุมัติ
    │   │   ├── แสดงคำขอ status = rejected
    │   │   └── API: POST /api/head-nurse/leave-request/all-requests
    │   │
    │   ├── Tab 4: ทั้งหมด
    │   │   └── API: POST /api/head-nurse/leave-request/all-requests
    │   │
    │   └── API: POST /api/head-nurse/leave-request/pending-count
    │
    └── /nurse-reports (รายงานพยาบาล)
        ├── เลือกเดือน
        ├── แสดงรายงานพยาบาลทั้งหมดในแผนก
        ├── ดูสถิติแต่ละคน
        │   ├── วันทำงาน, กะทั้งหมด, ชั่วโมงรวม
        │   └── กะเช้า/บ่าย/ดึก
        ├── สรุปรวมแผนก
        └── API: POST /api/head-nurse/nurse-reports
```

---


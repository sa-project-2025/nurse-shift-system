# Sequence Diagram 3 - ดูรายงานพยาบาล (หัวหน้าพยาบาล)

```mermaid
sequenceDiagram
  actor HeadNurse as Head Nurse
  participant UI as :NurseReportUI
  participant Controller as :NurseReportController
  participant API as :NurseReportAPI
  participant Service as :ReportService
  participant DB as :Database

  HeadNurse ->>+ UI: คลิกเมนู "รายงานพยาบาล"
  UI ->>+ Controller: ส่งคำขอดูรายงาน
  Controller ->>+ API: GET /nurse-reports
  API ->>+ DB: Q3.1: ดึง department_id
  DB -->>- API: department_id
  API ->>+ DB: Q3.2: ดึงรายชื่อพยาบาล
  DB -->>- API: รายชื่อพยาบาล
  API ->>+ Service: คำนวณรายงานแต่ละพยาบาล
  loop แต่ละพยาบาล
    Service ->>+ DB: Q3.3: ดึง work_reports
    DB -->>- Service: รายงาน/คำนวณจาก schedules
  end
  Service -->>- API: รายงานทั้งหมด
  API -->>- Controller: ข้อมูลรายงาน
  Controller -->>- UI: ส่งข้อมูลรายงาน
  UI ->>- UI: แสดงตารางรายงาน

  opt เลือกเดือนอื่น
    HeadNurse ->>+ UI: เลือกเดือน/ปี
    UI ->>+ Controller: ส่งคำขอเดือนที่เลือก
    Controller ->>+ API: GET /nurse-reports?month=X
    API -->>- Controller: รายงานเดือนที่เลือก
    Controller -->>- UI: ส่งข้อมูลรายงาน
    UI ->>- UI: แสดงรายงาน
  end
```

## คำอธิบาย Layers

| Layer | ชื่อ | หน้าที่ |
|-------|------|---------|
| **Actor** | Head Nurse | หัวหน้าพยาบาลดูรายงาน |
| **UI** | :NurseReportUI | หน้ารายงานพยาบาล (Frontend) |
| **Controller** | :NurseReportController | ควบคุมการทำงาน |
| **API** | :NurseReportAPI | API Endpoint `/api/head-nurse/nurse-reports` |
| **Service** | :ReportService | คำนวณและประมวลผลรายงาน |
| **Database** | :Database | ฐานข้อมูล Supabase |

## ขั้นตอนการทำงาน

1. **คลิกเมนู** - เข้าหน้ารายงานพยาบาล
2. **ดึงข้อมูลเริ่มต้น** - โหลดรายงานเดือนปัจจุบัน:
   - Q3.1: ดึง department_id ของหัวหน้าพยาบาล
   - Q3.2: ดึงรายชื่อพยาบาลในแผนก
   - Q3.3: ตรวจสอบ work_reports (ถ้ามี)
   - Q3.4: คำนวณจากตารางเวร (ถ้ายังไม่ส่งรายงาน)
3. **เลือกเดือน/ปี** - สามารถเปลี่ยนเดือนที่ต้องการดูได้
4. **แสดงตารางรายงาน** - แสดงข้อมูลพยาบาลแต่ละคน
5. **ดูภาพรวม** - คำนวณสถิติรวมของแผนก
6. **Export PDF** - สร้างและ download รายงาน PDF

## Database Queries

### Q3.1: ดึง department_id ของหัวหน้าพยาบาล
```sql
SELECT department_id
FROM departments
WHERE head_nurse_id = ?
```

### Q3.2: ดึงรายชื่อพยาบาลในแผนก
```sql
SELECT user_id, name, email
FROM users
WHERE department_id = ?
  AND role = 'nurse'
```

### Q3.3:
## Database Structure & Relationships:

1. **schedules table** = "กรอบเวร/กะงาน" (One-to-Many with shift_assignments)
   - schedules_id (PK)
   - date = วันที่ของเวร
   - shift_type = ประเภทกะ (morning/afternoon/night)
   - department_id = แผนกที่ต้องการคนเวร
   - required_nurse = จำนวนพยาบาลที่ต้องการในกะนี้
   - status = draft/published
   
   ตัวอย่าง: "วันที่ 15 ม.ค. กะเช้า แผนกอายุรกรรม ต้องการพยาบาล 3 คน"

2. **shift_assignments table** = "การจัดคนเข้าเวร" (Many-to-One with schedules)
   - assignment_id (PK)
   - schedules_id (FK) = อ้างอิงถึง schedule
   - user_id (FK) = พยาบาลที่ถูกจัดเข้าเวร
   
   ตัวอย่าง: "schedule_id: 1 มีพยาบาล 3 คน คือ user_id: 101, 102, 103"

## ความสัมพันธ์:
- 1 schedule → หลาย assignments (1 กะ มีพยาบาลหลายคน)
- ถ้า schedule ต้องการ 3 คน → ต้องมี 3 records ใน shift_assignments
- schedules.required_nurse ควรเท่ากับ COUNT(shift_assignments) ของ schedules_id นั้นๆ

## Use Cases ที่ต้องทำ:

1. **การสร้างตารางเวร**:
   - Step 1: สร้าง record ใน schedules (date, shift_type, required_nurse)
   - Step 2: เลือกพยาบาลตาม required_nurse
   - Step 3: สร้าง shift_assignments สำหรับแต่ละคนที่เลือก

2. **การดูตารางเวร**:
```sql
   -- ดูว่าใครต้องมาเวรวันนี้
   SELECT s.*, u.name 
   FROM schedules s
   JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id  
   JOIN users u ON sa.user_id = u.user_id
   WHERE s.date = '2025-01-15'

# 📝 การจัดตารางเวรแบบ Draft (ยังไม่ประกาศ)

บันทึกเป็น Draft ทั้งหมด (แนะนำ)

### ตาราง `schedules` - สถานะ Draft

| schedules_id | date | shift_type | department_id | required_nurse | status | created_by | published_date |
|---|---|---|---|---|---|---|---|
| 10 | 2025-02-01 | morning | 101 | 3 | **draft** | 1001 | NULL |
| 11 | 2025-02-01 | afternoon | 101 | 3 | **draft** | 1001 | NULL |
| 12 | 2025-02-01 | night | 101 | 2 | **draft** | 1001 | NULL |
| 13 | 2025-02-02 | morning | 101 | 3 | **draft** | 1001 | NULL |
| 14 | 2025-02-02 | afternoon | 101 | 3 | **draft** | 1001 | NULL |

### ตาราง `shift_assignments` - จัดคนเข้าเวรแล้ว แต่ยังเป็น Draft

| assignment_id | schedules_id | user_id | assigned_by | assigned_date |
|---|---|---|---|---|
| 20 | 10 | 2001 | 1001 | 2025-01-25 14:00:00 |
| 21 | 10 | 2002 | 1001 | 2025-01-25 14:00:00 |
| 22 | 10 | 2003 | 1001 | 2025-01-25 14:00:00 |
| 23 | 11 | 2004 | 1001 | 2025-01-25 14:05:00 |
| 24 | 11 | 2005 | 1001 | 2025-01-25 14:05:00 |
| 25 | 11 | 2006 | 1001 | 2025-01-25 14:05:00 |
| 26 | 12 | 2007 | 1001 | 2025-01-25 14:10:00 |
| 27 | 12 | 2008 | 1001 | 2025-01-25 14:10:00 |
| - | 13 | - | - | - |
| - | 14 | - | - | - |

### 📌 สถานการณ์:
- ✅ **1 ก.พ. กะเช้า**: จัดครบ 3 คน (Draft)
- ✅ **1 ก.พ. กะบ่าย**: จัดครบ 3 คน (Draft)
- ✅ **1 ก.พ. กะดึก**: จัดครบ 2 คน (Draft)
- ⚠️ **2 ก.พ. กะเช้า**: ยังไม่ได้จัดคน (Draft)
- ⚠️ **2 ก.พ. กะบ่าย**: ยังไม่ได้จัดคน (Draft)

### 🔍 Query ดูตาราง Draft ของหัวหน้า:

```sql
-- ดูสถานะการจัดเวรแบบ Draft
SELECT 
    s.schedules_id,
    s.date,
    s.shift_type,
    s.required_nurse as 'ต้องการ',
    COUNT(sa.assignment_id) as 'จัดแล้ว',
    CASE 
        WHEN COUNT(sa.assignment_id) = s.required_nurse THEN '✅ ครบ'
        WHEN COUNT(sa.assignment_id) > 0 THEN '⚠️ ขาดอีก ' || (s.required_nurse - COUNT(sa.assignment_id)) || ' คน'
        ELSE '❌ ยังไม่ได้จัด'
    END as 'สถานะการจัด',
    s.status as 'สถานะเวร'
FROM schedules s
LEFT JOIN shift_assignments sa ON s.schedules_id = sa.schedules_id
WHERE s.status = 'draft'
    AND s.created_by = 1001  -- หัวหน้าที่กำลัง login
GROUP BY s.schedules_id
ORDER BY s.date, 
         CASE s.shift_type 
            WHEN 'morning' THEN 1 
            WHEN 'afternoon' THEN 2 
            WHEN 'night' THEN 3 
         END
```
---
### 📊 ผลลัพธ์:
| date | shift_type | ต้องการ | จัดแล้ว | สถานะการจัด | สถานะเวร |
|---|---|---|---|---|---|
| 2025-02-01 | morning | 3 | 3 | ✅ ครบ | draft |
| 2025-02-01 | afternoon | 3 | 3 | ✅ ครบ | draft |
| 2025-02-01 | night | 2 | 2 | ✅ ครบ | draft |
| 2025-02-02 | morning | 3 | 0 | ❌ ยังไม่ได้จัด | draft |
| 2025-02-02 | afternoon | 3 | 0 | ❌ ยังไม่ได้จัด | draft |

---

## 🎯 Flow การทำงาน

### 1️⃣ ขั้นตอนการสร้าง Draft:

```javascript
// Step 1: สร้างกรอบเวร (Draft)
const schedule = await supabase
  .from('schedules')
  .insert({
    date: '2025-02-01',
    shift_type: 'morning',
    required_nurse: 3,
    status: 'draft',  // 👈 สำคัญ!
    department_id: 101,
    created_by: currentUser.id
  })
  .select()
  .single();

// Step 2: จัดคนเข้าเวร (แต่ยังเป็น Draft)
const assignments = await supabase
  .from('shift_assignments')
  .insert([
    { schedules_id: schedule.id, user_id: 2001 },
    { schedules_id: schedule.id, user_id: 2002 },
    { schedules_id: schedule.id, user_id: 2003 }
  ]);
```

### 2️⃣ การแก้ไข Draft (สามารถแก้ได้ตลอด):

```javascript
// ลบคนเดิม
await supabase
  .from('shift_assignments')
  .delete()
  .eq('schedules_id', 10)
  .eq('user_id', 2003);

// เพิ่มคนใหม่
await supabase
  .from('shift_assignments')
  .insert({
    schedules_id: 10,
    user_id: 2009
  });
```

### 3️⃣ การประกาศเวร (Publish):

```javascript
// เปลี่ยนสถานะเป็น published
await supabase
  .from('schedules')
  .update({ 
    status: 'published',
    published_date: new Date()
  })
  .in('schedules_id', [10, 11, 12, 13, 14]);

// ส่ง notification ให้พยาบาลทุกคน
const notifications = affectedNurses.map(nurse => ({
  user_id: nurse.id,
  title: 'ตารางเวรใหม่ประจำเดือน ก.พ. 2568',
  action_type: 'schedule_published',
  related_id: schedule.id,
  related_table: 'schedules'
}));

await supabase
  .from('notifications')
  .insert(notifications);
```

---

## 🔐 Business Rules สำหรับ Draft

### ✅ พยาบาลทั่วไป:
- **ไม่เห็น** ตารางที่ status = 'draft'
- เห็นเฉพาะ status = 'published'

`

### ✅ หัวหน้าพยาบาล:
- **เห็นทั้ง** 'draft' และ 'published'
- แก้ไขได้เฉพาะ 'draft'

---

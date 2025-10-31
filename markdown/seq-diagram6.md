# Sequence Diagram 6 - View My Schedule (Nurse)

```mermaid
sequenceDiagram
  actor Nurse as Nurse
  participant UI as :MyScheduleUI
  participant Controller as :MyScheduleController
  participant API as :ScheduleAPI
  participant DB as :Database

  Nurse ->>+ UI: Open "My Schedule"
  UI ->>+ Controller: Request my schedules
  Controller ->>+ API: GET /my-schedules
  API ->>+ DB: Q6.1: Get nurse's schedules
  DB -->>- API: Assigned shifts
  API ->>+ DB: Q6.2: Get shift colleagues
  DB -->>- API: Colleague list
  API -->>- Controller: Schedule data
  Controller -->>- UI: Send schedule data
  UI ->>- UI: Display calendar and stats:<br/>- Total shifts (morning/afternoon/night)<br/>- Total hours<br/>- Rest days

  opt View shift details
    Nurse ->> UI: Click a shift
    UI ->> UI: Show details:<br/>- Date and shift<br/>- Working hours<br/>- Colleagues
  end

  opt Select different month
    Nurse ->>+ UI: Select month/year
    UI ->>+ Controller: Request month schedules
    Controller ->>+ API: GET /my-schedules?month=X
    API -->>- Controller: Selected month schedules
    Controller -->>- UI: Send schedule data
    UI ->>- UI: Display schedules
  end
```

## Layer Description

| Layer | Name | Responsibility |
|-------|------|----------------|
| **Actor** | Nurse | View own schedules |
| **UI** | :MyScheduleUI | My schedule page |
| **Controller** | :MyScheduleController | Control schedule viewing |
| **API** | :ScheduleAPI | API Endpoint `/api/my-schedules` |
| **Database** | :Database | Supabase database |

## Main Steps

1. **Get schedules** - Fetch shifts and colleagues (Q6.1-Q6.2)
2. **Show calendar and stats** - Calculate shifts, hours, rest days
3. **View details** - Click shift to see details

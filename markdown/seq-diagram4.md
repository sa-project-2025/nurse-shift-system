# Sequence Diagram 4 - Create Schedule (Head Nurse)

```mermaid
sequenceDiagram
  actor HeadNurse as Head Nurse
  participant UI as :ScheduleUI
  participant Controller as :ScheduleController
  participant API as :ScheduleAPI
  participant Service as :ScheduleService
  participant DB as :Database

  HeadNurse ->>+ UI: Click "Create Schedule"
  UI ->>+ Controller: Request schedules
  Controller ->>+ API: GET /schedules
  API ->>+ DB: Q4.1: Get department_id
  DB -->>- API: department_id
  API ->>+ DB: Q4.2: Get current month schedules
  DB -->>- API: Schedule list
  API ->>+ DB: Q4.3: Get assigned nurses
  DB -->>- API: Assignments
  API -->>- Controller: Schedule data
  Controller -->>- UI: Send schedule data
  UI ->>- UI: Display calendar

  HeadNurse ->>+ UI: Set required nurses per shift
  UI ->>+ Controller: Send create request
  Controller ->>+ API: POST /schedules/create
  API ->>+ Service: Create monthly schedules
  Service ->>+ DB: Q4.4: INSERT schedules (all days x 3 shifts)
  DB -->>- Service: schedules_id[]
  Service -->>- API: Schedules created
  API -->>- Controller: Success
  Controller -->>- UI: Send success
  UI ->>- UI: Display empty schedules

  HeadNurse ->>+ UI: Select nurse and assign shift
  UI ->>+ Controller: Request nurse list
  Controller ->>+ API: GET /nurses
  API ->>+ DB: Q4.5: Get nurse list
  DB -->>- API: Nurses
  API -->>- Controller: Nurses
  Controller -->>- UI: Available nurses

  loop Each shift to assign
    HeadNurse ->> UI: Select nurse + shift
    UI ->>+ Controller: Send assignment
    Controller ->>+ API: POST /assignments
    API ->>+ Service: Validate and save
    Service ->>+ DB: Q4.6-Q4.8: Check constraints
    DB -->>- Service: Validation result
    Service ->>+ DB: Q4.9: INSERT assignment
    DB -->>- Service: assignment_id
    Service -->>- API: Assigned successfully
    API -->>- Controller: Success
    Controller -->>- UI: Update table
    UI ->> UI: Show nurse in shift
  end

  UI ->>- UI: Schedule ready to publish
```

## Layer Description

| Layer | Name | Responsibility |
|-------|------|----------------|
| **Actor** | Head Nurse | Create nurse schedules |
| **UI** | :ScheduleUI | Schedule management page |
| **Controller** | :ScheduleController | Control schedule operations |
| **API** | :ScheduleAPI | API Endpoint `/api/schedules` |
| **Service** | :ScheduleService | Validate constraints and create schedules |
| **Database** | :Database | Supabase database |

## Main Steps

1. **Load schedules** - Get current month schedules (Q4.1-Q4.3)
2. **Create schedules** - Create empty schedules for whole month (Q4.4)
3. **Assign nurses** - Select nurses and assign to shifts (Q4.5-Q4.9)

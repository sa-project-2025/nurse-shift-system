# Sequence Diagram 9 - Request Leave (Nurse)

```mermaid
sequenceDiagram
  actor Nurse as Nurse
  participant UI as :LeaveRequestUI
  participant Controller as :LeaveRequestController
  participant API as :LeaveAPI
  participant Service as :LeaveService
  participant DB as :Database

  Nurse ->>+ UI: Click "Request Leave"
  UI ->> UI: Show leave form

  Nurse ->> UI: Fill form:<br/>- Leave type<br/>- Start/end date<br/>- Reason
  UI ->>+ Controller: Request affected shifts
  Controller ->>+ API: GET /affected-shifts
  API ->>+ DB: Q9.1: Get affected shifts
  DB -->>- API: Shift list
  API -->>- Controller: Shift list
  Controller -->>- UI: Affected shifts
  UI ->> UI: Display affected shifts

  Nurse ->> UI: Click "Submit Request"
  UI ->>+ Controller: Send leave request
  Controller ->>+ API: POST /leave-requests
  API ->>+ Service: Validate and save
  Service ->>+ DB: Q9.2: Check overlapping requests
  DB -->>- Service: Validation result
  Service ->>+ DB: Q9.3: INSERT leave request
  DB -->>- Service: leave_id
  Service -->>- API: Request submitted
  API -->>- Controller: Success
  Controller -->>- UI: Send success
  UI ->>- UI: Show confirmation

  opt View requests (tabs)
    Nurse ->>+ UI: Select tab
    UI ->>+ Controller: Request by status
    Controller ->>+ API: GET /leave-requests?status=X
    API ->>+ DB: Q9.4-Q9.6: Get by status
    DB -->>- API: Request list
    API -->>- Controller: Request list
    Controller -->>- UI: Requests by status
    UI ->>- UI: Display requests
  end
```

## Layer Description

| Layer | Name | Responsibility |
|-------|------|----------------|
| **Actor** | Nurse | Request leave |
| **UI** | :LeaveRequestUI | Leave request page |
| **Controller** | :LeaveRequestController | Control leave operations |
| **API** | :LeaveAPI | API Endpoint `/api/leave-requests` |
| **Service** | :LeaveService | Validate and save leave request |
| **Database** | :Database | Supabase database |

## Main Steps

1. **Fill form** - Enter type, dates, reason
2. **View affected shifts** - Display shifts that will be lost (Q9.1)
3. **Submit request** - Validate and save (Q9.2-Q9.3)
4. **Track status** - View requests by tab (Q9.4-Q9.6)

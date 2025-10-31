# Sequence Diagram 8 - Approve/Reject Shift Exchange (Nurse)

```mermaid
sequenceDiagram
  actor Nurse as Nurse
  participant UI as :ExchangeUI
  participant Controller as :ExchangeController
  participant API as :ExchangeAPI
  participant Service as :ExchangeService
  participant DB as :Database

  Nurse ->>+ UI: Open "Shift Exchange"
  UI ->> UI: Show notification badge
  Nurse ->> UI: Click tab "Requests from Colleagues"
  UI ->>+ Controller: Request received requests
  Controller ->>+ API: GET /received-requests
  API ->>+ DB: Q8.1: Get pending requests
  DB -->>- API: Pending requests
  API -->>- Controller: Pending requests
  Controller -->>- UI: Received requests
  UI ->> UI: Display requests with details

  Nurse ->> UI: View request details
  Nurse ->> UI: Click "Approve" / "Reject"

  alt Approve request
    UI ->>+ Controller: Send approve request
    Controller ->>+ API: POST /exchange-requests/{id}/approve
    API ->>+ Service: Process exchange
    Service ->>+ DB: Q8.2: UPDATE status='approved'
    DB -->>- Service: Updated
    Service ->>+ DB: Q8.3-Q8.4: Get assignments
    DB -->>- Service: Assignment IDs
    Service ->>+ DB: Q8.5-Q8.6: Swap user_id
    DB -->>- Service: Swapped
    Service ->>+ DB: Q8.7: DELETE work_reports
    DB -->>- Service: Deleted
    Service -->>- API: Exchange completed
    API -->>- Controller: Success
    Controller -->>- UI: Send success
  else Reject request
    UI ->>+ Controller: Send reject request
    Controller ->>+ API: POST /exchange-requests/{id}/reject
    API ->>+ DB: Q8.8: UPDATE status='rejected'
    DB -->>- API: Updated
    API -->>- Controller: Success
    Controller -->>- UI: Send success
  end

  UI ->>- UI: Show completion message
```

## Layer Description

| Layer | Name | Responsibility |
|-------|------|----------------|
| **Actor** | Nurse | Approve/reject exchange requests |
| **UI** | :ExchangeUI | Shift exchange page |
| **Controller** | :ExchangeController | Control exchange approval |
| **API** | :ExchangeAPI | API Endpoint `/api/exchange-requests/{id}` |
| **Service** | :ExchangeService | Process shift exchange |
| **Database** | :Database | Supabase database |

## Main Steps

1. **View requests** - Get pending requests (Q8.1)
2. **Approve** - Swap shifts and update data (Q8.2-Q8.7)
3. **Reject** - Update status to rejected (Q8.8)

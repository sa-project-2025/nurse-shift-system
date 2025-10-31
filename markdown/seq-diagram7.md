# Sequence Diagram 7 - Request Shift Exchange (Nurse)

```mermaid
sequenceDiagram
  actor Nurse as Nurse
  participant UI as :ExchangeUI
  participant Controller as :ExchangeController
  participant API as :ExchangeAPI
  participant Service as :ExchangeService
  participant DB as :Database

  Nurse ->>+ UI: Click "Shift Exchange"
  UI ->>+ Controller: Request my shifts
  Controller ->>+ API: GET /my-shifts
  API ->>+ DB: Q7.1: Get my shifts
  DB -->>- API: Shift list
  API -->>- Controller: Shift list
  Controller -->>- UI: Exchangeable shifts

  Nurse ->> UI: Select my shift
  UI ->>+ Controller: Request available shifts
  Controller ->>+ API: GET /available-shifts
  API ->>+ DB: Q7.2: Get available shifts
  DB -->>- API: Shifts + nurses
  API -->>- Controller: Shifts + nurses
  Controller -->>- UI: Available shifts and nurses

  Nurse ->> UI: Select target shift + colleague
  Nurse ->> UI: Enter reason
  Nurse ->> UI: Submit request

  UI ->>+ Controller: Send exchange request
  Controller ->>+ API: POST /exchange-requests
  API ->>+ Service: Validate and save
  Service ->>+ DB: Q7.3-Q7.5: Check constraints
  DB -->>- Service: Validation result
  Service ->>+ DB: Q7.6: INSERT exchange request
  DB -->>- Service: exchange_id
  Service -->>- API: Request sent
  API -->>- Controller: Success
  Controller -->>- UI: Send success
  UI ->>- UI: Show confirmation

  opt View my requests
    Nurse ->>+ UI: Click "My Requests"
    UI ->>+ Controller: Request my pending requests
    Controller ->>+ API: GET /my-requests
    API ->>+ DB: Q7.7: Get pending requests
    DB -->>- API: Request list
    API -->>- Controller: Request list
    Controller -->>- UI: Pending requests
    UI ->>- UI: Display requests
  end

  opt View history
    Nurse ->>+ UI: Click "History"
    UI ->>+ Controller: Request history
    Controller ->>+ API: GET /request-history
    API ->>+ DB: Q7.8-Q7.9: Get history
    DB -->>- API: Completed requests
    API -->>- Controller: History
    Controller -->>- UI: Send history
    UI ->>- UI: Display history
  end
```

## Layer Description

| Layer | Name | Responsibility |
|-------|------|----------------|
| **Actor** | Nurse | Request shift exchange |
| **UI** | :ExchangeUI | Shift exchange page |
| **Controller** | :ExchangeController | Control exchange operations |
| **API** | :ExchangeAPI | API Endpoint `/api/exchange-requests` |
| **Service** | :ExchangeService | Validate exchange constraints |
| **Database** | :Database | Supabase database |

## Main Steps

1. **Select my shift** - Get and select own shift (Q7.1)
2. **Select target shift** - Get and select target shift + colleague (Q7.2)
3. **Submit request** - Validate and save (Q7.3-Q7.6)
4. **Track status** - View requests and history (Q7.7-Q7.9)

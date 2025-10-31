# Sequence Diagram 5 - Publish Schedule (Head Nurse)

```mermaid
sequenceDiagram
  actor HeadNurse as Head Nurse
  participant UI as :ScheduleUI
  participant Controller as :ScheduleController
  participant API as :ScheduleAPI
  participant DB as :Database

  HeadNurse ->>+ UI: Review schedule
  UI ->> UI: Verify all shifts assigned

  HeadNurse ->> UI: Click "Publish Schedule"
  UI ->>+ Controller: Send publish request
  Controller ->>+ API: POST /schedules/publish
  API ->>+ DB: Q5.1: Check draft status
  DB -->>- API: Draft schedules
  API ->>+ DB: Q5.2: UPDATE status='published'
  DB -->>- API: Updated successfully
  API -->>- Controller: Published successfully
  Controller -->>- UI: Send success
  UI ->>- UI: Show confirmation
```

## Layer Description

| Layer | Name | Responsibility |
|-------|------|----------------|
| **Actor** | Head Nurse | Publish schedules |
| **UI** | :ScheduleUI | Schedule management page |
| **Controller** | :ScheduleController | Control publish operation |
| **API** | :ScheduleAPI | API Endpoint `/api/schedules/publish` |
| **Database** | :Database | Supabase database |

## Main Steps

1. **Verify completeness** - Check all shifts assigned
2. **Publish** - Update status from draft to published (Q5.1-Q5.2)

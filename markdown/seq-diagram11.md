# Sequence Diagram 11 - Submit Work Report (Nurse)

```mermaid
sequenceDiagram
  actor Nurse as Nurse
  participant UI as :WorkReportUI
  participant Controller as :WorkReportController
  participant API as :ReportAPI
  participant Service as :ReportService
  participant DB as :Database

  Nurse ->>+ UI: Click "Submit Work Report"
  UI ->>+ Controller: Request work summary
  Controller ->>+ API: GET /work-summary
  API ->>+ Service: Calculate from schedules
  Service ->>+ DB: Get assigned shifts
  DB -->>- Service: Current month shifts
  Service ->> Service: Calculate stats:<br/>- Work days<br/>- Shifts (morning/afternoon/night)<br/>- Total hours<br/>- Rest days
  Service -->>- API: Summary data
  API -->>- Controller: Summary data
  Controller -->>- UI: Work summary
  UI ->> UI: Show preview

  Nurse ->> UI: Review data
  Nurse ->> UI: Confirm submission
  UI ->>+ Controller: Send work report
  Controller ->>+ API: POST /work-reports
  API ->>+ Service: Validate and save
  Service ->>+ DB: Q11.1: Check duplicate report
  DB -->>- Service: Validation result

  alt No existing report
    Service ->>+ DB: Q11.2: INSERT work_report
    DB -->>- Service: work_report_id
    Service -->> API: Saved successfully
  else Report exists
    Service -->> API: Duplicate report
  end

  Service -->>- API: Complete
  API -->>- Controller: Response
  Controller -->>- UI: Response
  UI ->> UI: Show message
  deactivate UI
```

## Layer Description

| Layer | Name | Responsibility |
|-------|------|----------------|
| **Actor** | Nurse | Submit work report |
| **UI** | :WorkReportUI | Work report page |
| **Controller** | :WorkReportController | Control report submission |
| **API** | :ReportAPI | API Endpoint `/api/work-reports` |
| **Service** | :ReportService | Calculate and save report |
| **Database** | :Database | Supabase database |

## Main Steps

1. **Calculate summary** - Get shifts and calculate stats
2. **Show preview** - Display summary for review
3. **Submit** - Check duplicate and save (Q11.1-Q11.2)

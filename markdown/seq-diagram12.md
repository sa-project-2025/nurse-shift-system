# Sequence Diagram 12 - View My Report (Nurse)

```mermaid
sequenceDiagram
  actor Nurse as Nurse
  participant UI as :MyReportUI
  participant Controller as :MyReportController
  participant API as :ReportAPI
  participant DB as :Database

  Nurse ->>+ UI: Click "My Report"
  UI ->>+ Controller: Request my reports
  Controller ->>+ API: GET /my-reports
  API ->>+ DB: Q12.1: Get current month report
  DB -->>- API: work_report
  API -->>- Controller: Report data
  Controller -->>- UI: Send report data
  UI ->>- UI: Display report with stats:<br/>- Month/year<br/>- Work days<br/>- Shifts (morning/afternoon/night)<br/>- Total hours<br/>- Rest days<br/>- Shift proportion chart

  opt Select different month
    Nurse ->>+ UI: Select month/year
    UI ->>+ Controller: Request month report
    Controller ->>+ API: GET /my-reports?month=X
    API -->>- Controller: Selected month report
    Controller -->>- UI: Send report data
    UI ->>- UI: Display report
  end

  opt Export PDF
    Nurse ->>+ UI: Click "Export PDF"
    UI ->> UI: Generate PDF file
    UI ->>- UI: Download file
  end
```

## Layer Description

| Layer | Name | Responsibility |
|-------|------|----------------|
| **Actor** | Nurse | View own work report |
| **UI** | :MyReportUI | My report page |
| **Controller** | :MyReportController | Control report viewing |
| **API** | :ReportAPI | API Endpoint `/api/my-reports` |
| **Database** | :Database | Supabase database |

## Main Steps

1. **View report** - Get and display current month report (Q12.1)
2. **Select month** - View different month reports
3. **Export PDF** - Generate and download report

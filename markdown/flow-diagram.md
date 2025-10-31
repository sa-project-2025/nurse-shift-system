# Data Flow Diagram - Nurse Shift Management System

## DFD Level 0 - Context Diagram

```plantuml
@startuml
!define RECTANGLE class

skinparam actorStyle awesome
skinparam rectangle {
    BackgroundColor LightBlue
    BorderColor DarkBlue
}

actor "Nurse" as Nurse
actor "Head Nurse" as HeadNurse

rectangle "Nurse Shift\nManagement\nSystem" as System

database "Supabase\nDatabase" as DB

Nurse --> System : Login credentials
Nurse --> System : View my schedule request
Nurse --> System : Shift exchange request
Nurse --> System : Leave request
Nurse --> System : Work report data

System --> Nurse : Authentication token
System --> Nurse : My schedule data
System --> Nurse : Exchange request status
System --> Nurse : Leave request status
System --> Nurse : Report confirmation

HeadNurse --> System : Login credentials
HeadNurse --> System : Schedule data
HeadNurse --> System : Publish schedule command
HeadNurse --> System : View reports request
HeadNurse --> System : Approval/Rejection

System --> HeadNurse : Authentication token
System --> HeadNurse : Schedule confirmation
System --> HeadNurse : Nurses reports
System --> HeadNurse : Request list

System <--> DB : User data
System <--> DB : Schedule data
System <--> DB : Assignment data
System <--> DB : Request data
System <--> DB : Report data

@enduml
```

## DFD Level 1 - Major Processes

```plantuml
@startuml
!define RECTANGLE class

skinparam actorStyle awesome
skinparam rectangle {
    BackgroundColor LightYellow
    BorderColor DarkBlue
}
skinparam database {
    BackgroundColor LightGreen
    BorderColor DarkGreen
}

actor "Nurse" as Nurse
actor "Head Nurse" as HeadNurse

rectangle "1.0\nAuthentication\nProcess" as Auth
rectangle "2.0\nSchedule\nManagement" as Schedule
rectangle "3.0\nShift Exchange\nProcess" as Exchange
rectangle "4.0\nLeave Request\nProcess" as Leave
rectangle "5.0\nWork Report\nProcess" as Report

database "D1: Users" as D1
database "D2: Departments" as D2
database "D3: Schedules" as D3
database "D4: Shift Assignments" as D4
database "D5: Exchange Requests" as D5
database "D6: Leave Requests" as D6
database "D7: Work Reports" as D7

' Authentication flows
Nurse --> Auth : Login credentials
HeadNurse --> Auth : Login credentials
Auth --> Nurse : Auth token + profile
Auth --> HeadNurse : Auth token + profile
Auth <--> D1 : User credentials
Auth <--> D2 : Department info

' Schedule Management flows
HeadNurse --> Schedule : Create/Edit schedule
HeadNurse --> Schedule : Publish schedule
Nurse --> Schedule : View my schedule
Schedule --> HeadNurse : Schedule confirmation
Schedule --> Nurse : My shifts
Schedule <--> D3 : Schedule data
Schedule <--> D4 : Assignment data
Schedule --> D2 : Department ID

' Shift Exchange flows
Nurse --> Exchange : Exchange request
Nurse --> Exchange : Approve/Reject request
Exchange --> Nurse : Request status
Exchange <--> D5 : Exchange requests
Exchange <--> D4 : Update assignments
Exchange --> D7 : Delete affected reports

' Leave Request flows
Nurse --> Leave : Leave request
HeadNurse --> Leave : Approve/Reject leave
Leave --> Nurse : Request status
Leave --> HeadNurse : Pending requests
Leave <--> D6 : Leave requests
Leave <--> D4 : Delete assignments
Leave --> D7 : Delete affected reports

' Work Report flows
Nurse --> Report : Submit work report
Nurse --> Report : View my report
HeadNurse --> Report : View all reports
Report --> Nurse : Report confirmation
Report --> HeadNurse : Nurses reports
Report <--> D7 : Work reports
Report --> D4 : Read shift data

@enduml
```

## Process Descriptions

### Level 0 - Context Diagram
Shows external entities (Nurse, Head Nurse, Database) interacting with the system

### Level 1 - Major Processes

| Process | Name | Description |
|---------|------|-------------|
| **1.0** | Authentication Process | Handles user login, registration and session management |
| **2.0** | Schedule Management | Handles schedule creation, editing, publishing and viewing |
| **3.0** | Shift Exchange Process | Handles shift exchange requests and approvals between nurses |
| **4.0** | Leave Request Process | Handles leave requests and approval workflow |
| **5.0** | Work Report Process | Handles work report generation and submission |

## Data Stores

| Data Store | Name | Columns |
|------------|------|---------|
| **D1** | Users | user_id, name, email, password, role, phone, department_id |
| **D2** | Departments | department_id, department_name, head_nurse_id |
| **D3** | Schedules | schedules_id, date, shift_type, status, required_nurse, department_id |
| **D4** | Shift Assignments | assignment_id, user_id, schedules_id, assigned_by, assigned_date |
| **D5** | Exchange Requests | exchange_id, requester_id, target_user_id, original_schedule_id, target_schedule_id, status |
| **D6** | Leave Requests | leave_id, user_id, start_date, end_date, leave_type, reason, status |
| **D7** | Work Reports | work_report_id, user_id, report_month, work_days_count, shifts_count, total_hours |

## How to Generate Diagrams

### Generate diagram online:
1. Visit **[PlantUML Online Editor](https://www.plantuml.com/plantuml/uml/)**
2. Copy the PlantUML code between `@startuml` and `@enduml`
3. Paste into the editor
4. Diagram will automatically render
5. You can download as PNG, SVG or PDF format

### Alternative online tools:
- **PlantText**: https://www.planttext.com/
- **PlantUML QEditor**: https://plantuml-editor.kkeisuke.com/
- **Gravizo**: http://www.gravizo.com/

### Install PlantUML locally:
```bash
# Requires Java installed
npm install -g node-plantuml
# Or
brew install plantuml  # For macOS
```

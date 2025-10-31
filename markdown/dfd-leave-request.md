# DFD - Leave Request Process

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

rectangle "4.0\nLeave Request\nProcess" as Leave

database "D4: Shift Assignments" as D4
database "D6: Leave Requests" as D6
database "D7: Work Reports" as D7

' Leave Request flows
Nurse --> Leave : Leave request
HeadNurse --> Leave : Approve/Reject leave
Leave --> Nurse : Request status
Leave --> HeadNurse : Pending requests
Leave <--> D6 : Leave requests
Leave <--> D4 : Delete assignments
Leave --> D7 : Delete affected reports

@enduml
```

## Description
Leave request process handles nurse leave requests and Head Nurse approval workflow. Approved leaves automatically delete affected shift assignments and reports.

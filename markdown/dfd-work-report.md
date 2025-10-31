# DFD - Work Report Process

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

rectangle "5.0\nWork Report\nProcess" as Report

database "D4: Shift Assignments" as D4
database "D7: Work Reports" as D7

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

## Description
Work report process allows nurses to generate and submit monthly work reports based on their shift assignments. Head Nurses can view all reports from their department.

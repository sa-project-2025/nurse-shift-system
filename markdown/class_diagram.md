classDiagram
    %% Main Entities
    class User {
        -user_id: number
        -name: string
        -email: string
        -password: string
        -role: enum
        -phone: string
        -pic_profile: string
        -department_id: number
        +login(): void
        +register(): void
        +getProfile(): User
        +updateProfile(): void
        +signOut(): void
    }

    class Department {
        -department_id: number
        -department_name: string
        -head_nurse_id: number
        +getDepartments(): Array~Department~
        +updateHeadNurse(): void
        +getSchedule(): Array~Schedule~
    }

    class Schedule {
        -schedules_id: number
        -date: Date
        -shift_type: enum
        -created_by: number
        -department_id: number
        -status: enum
        -published_date: DateTime
        -required_nurse: number
        +createBulk(): void
        +publish(): void
        +getMonthlySchedules(): Array~Schedule~
        +updateRequirements(): void
        +deleteDrafts(): void
        +removeAssignment(): void
    }

    class ShiftAssignment {
        -assignment_id: number
        -user_id: number
        -schedules_id: number
        -assigned_by: number
        -assigned_date: DateTime
        +assignNurse(): void
        +removeAssignment(): void
        +getAssignments(): Array~ShiftAssignment~
    }

    class ShiftExchangeRequest {
        -exchange_id: number
        -requester_id: number
        -target_user_id: number
        -original_schedule_id: number
        -target_schedule_id: number
        -request_date: DateTime
        -reason: text
        -status: enum
        +createRequest(): void
        +respondToRequest(): void
        +getMyRequests(): Array~ShiftExchangeRequest~
        +getIncomingRequests(): Array~ShiftExchangeRequest~
    }

    class LeaveRequest {
        -leave_id: number
        -user_id: number
        -start_date: Date
        -end_date: Date
        -leave_days: number
        -leave_type: enum
        -reason: text
        -reason_reject: text
        -request_date: DateTime
        -status: enum
        -approved_by: number
        -response_date: DateTime
        +createRequest(): void
        +getMyRequests(): Array~LeaveRequest~
        +getAffectedSchedules(): Array~Schedule~
        +respond(): void
    }

    class WorkReport {
        -report_id: number
        -user_id: number
        -report_month: string
        -work_days_count: number
        -shifts_count: number
        -total_hours: number
        -morning_shifts: number
        -afternoon_shifts: number
        -night_shifts: number
        -rest_days: number
        -submitted_at: DateTime
        +submitReport(): void
        +getMyReports(): Array~WorkReport~
        +getNurseReports(): Array~WorkReport~
    }

    %% Controllers
    class AuthController {
        +login(email, password): void
        +register(userData): void
    }

    class NurseController {
        +getMySchedule(): Array~Schedule~
        +getAllSchedules(): Array~Schedule~
        +createShiftExchange(): void
        +respondShiftExchange(): void
        +createLeaveRequest(): void
        +submitWorkReport(): void
    }

    class HeadNurseController {
        +createBulkSchedules(): void
        +assignNurse(): void
        +publishSchedule(): void
        +getAvailableNurses(): Array~User~
        +respondLeaveRequest(): void
        +getPendingCount(): number
        +getNurseReports(): Array~WorkReport~
    }

    %% Services
    class SupabaseClient {
        +auth: Auth
        +from(table): Query
        +createClient(): Client
    }

    class SupabaseAdminClient {
        +from(table): Query
        +bypassRLS(): void
    }

    class AuthContext {
        -user: User
        -userProfile: UserProfile
        -loading: boolean
        +fetchUserProfile(): void
        +signOut(): void
    }

    %% Relationships - User
    User "1" --> "0..1" Department : belongs to
    User "1" <-- "0..1" Department : head nurse
    User "1" --> "*" Schedule : creates
    User "1" --> "*" ShiftAssignment : assigned to
    User "1" --> "*" ShiftAssignment : assigns
    User "1" --> "*" LeaveRequest : submits
    User "1" --> "*" LeaveRequest : approves
    User "1" --> "*" ShiftExchangeRequest : requests
    User "1" --> "*" ShiftExchangeRequest : receives
    User "1" --> "*" WorkReport : submits

    %% Relationships - Department
    Department "1" --> "*" Schedule : has

    %% Relationships - Schedule
    Schedule "1" --> "*" ShiftAssignment : contains
    Schedule "1" --> "*" ShiftExchangeRequest : original shift
    Schedule "1" --> "*" ShiftExchangeRequest : target shift

    %% Controller Dependencies
    AuthController ..> User : manages
    NurseController ..> Schedule : queries
    NurseController ..> ShiftExchangeRequest : manages
    NurseController ..> LeaveRequest : manages
    NurseController ..> WorkReport : manages
    HeadNurseController ..> Schedule : manages
    HeadNurseController ..> ShiftAssignment : manages
    HeadNurseController ..> LeaveRequest : approves

    %% Service Dependencies
    AuthController ..> SupabaseClient : uses
    NurseController ..> SupabaseAdminClient : uses
    HeadNurseController ..> SupabaseAdminClient : uses
    AuthContext ..> SupabaseClient : uses 
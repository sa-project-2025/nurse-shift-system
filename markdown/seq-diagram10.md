# Sequence Diagram 10 - Approve Leave Request (Head Nurse)

```mermaid
sequenceDiagram
  actor HeadNurse as Head Nurse
  participant UI as :LeaveApprovalUI
  participant Controller as :LeaveApprovalController
  participant API as :LeaveAPI
  participant Service as :LeaveService
  participant DB as :Database

  HeadNurse ->>+ UI: Click "Approve Leave Requests"
  UI ->>+ Controller: Request pending requests
  Controller ->>+ API: GET /leave-requests/pending
  API ->>+ DB: Q10.1: Get pending requests
  DB -->>- API: Pending requests
  API -->>- Controller: Request list
  Controller -->>- UI: Send request list
  UI ->> UI: Display requests with details

  HeadNurse ->> UI: View request details
  HeadNurse ->> UI: Click "Approve" / "Reject"

  alt Approve request
    UI ->>+ Controller: Send approve request
    Controller ->>+ API: POST /leave-requests/{id}/approve
    API ->>+ Service: Process approval
    Service ->>+ DB: Q10.2: UPDATE status='approved'
    DB -->>- Service: Updated
    Service ->>+ DB: Q10.3: Get affected shifts
    DB -->>- Service: Assignments
    Service ->>+ DB: Q10.4: DELETE assignments
    DB -->>- Service: Deleted
    Service ->>+ DB: Q10.5: DELETE work_reports
    DB -->>- Service: Deleted
    Service -->>- API: Approved
    API -->>- Controller: Success
    Controller -->>- UI: Send success
  else Reject request
    UI ->>+ Controller: Send reject request
    Controller ->>+ API: POST /leave-requests/{id}/reject
    API ->>+ DB: Q10.6: UPDATE status='rejected'
    DB -->>- API: Updated
    API -->>- Controller: Success
    Controller -->>- UI: Send success
  end

  UI ->>- UI: Show completion message

  opt View requests (tabs)
    HeadNurse ->>+ UI: Select tab
    UI ->>+ Controller: Request by status
    Controller ->>+ API: GET /leave-requests?status=X
    API ->>+ DB: Q10.7-Q10.9: Get by status
    DB -->>- API: Request list
    API -->>- Controller: Request list
    Controller -->>- UI: Requests by status
    UI ->>- UI: Display requests
  end
```

## Layer Description

| Layer | Name | Responsibility |
|-------|------|----------------|
| **Actor** | Head Nurse | Approve/reject leave requests |
| **UI** | :LeaveApprovalUI | Leave approval page |
| **Controller** | :LeaveApprovalController | Control leave approval |
| **API** | :LeaveAPI | API Endpoint `/api/leave-requests` |
| **Service** | :LeaveService | Process approval/rejection |
| **Database** | :Database | Supabase database |

## Main Steps

1. **View requests** - Get pending requests (Q10.1)
2. **Approve** - Delete affected shifts (Q10.2-Q10.5)
3. **Reject** - Update status to rejected (Q10.6)
4. **Track** - View requests by tab (Q10.7-Q10.9)

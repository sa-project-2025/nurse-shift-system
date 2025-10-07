Database Schema:
- users (user_id, name, email, password, role, phone, pic_profile, department_id)
- departments (department_id, department_name, head_nurse_id)
- schedules (schedules_id, date, shift_type[morning/afternoon/night], created_by, department_id, status[draft/published], published_date, required_nurse)
- shift_assignments (assignment_id, user_id, schedules_id, assigned_by, assigned_date)
- shift_exchange_requests (exchange_id, requester_id, target_user_id, original_schedule_id, target_schedule_id, request_date, reason, status)
- leave_requests (leave_id, user_id, start_date, end_date, leave_type, reason, request_date, status)
- notifications (notification_id, user_id, title, action_type, description, related_id, related_table, is_read, create_date)
- work_reports (report_id,user_id,report_month,work_days_count,shifts_count,total_hours,submitted_at,morning_shifts,afternoon_shifts,night_shifts,rest_days)
using System;
using System.Collections.Generic;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.DTOs;

public class AttendanceSessionDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid GradeId { get; set; }
    public string GradeName { get; set; } = string.Empty;
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
    public AttendanceSessionStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int TotalStudents { get; set; }
}

public class AttendanceSessionDetailDto : AttendanceSessionDto
{
    public string Pin { get; set; } = string.Empty;
    public bool WasExisting { get; set; } // true when an existing session was returned instead of creating a new one
}

public class CreateAttendanceSessionDto
{
    public string Title { get; set; } = string.Empty;
    public Guid ClassId { get; set; }
    public DateTime StartsAt { get; set; }
    public DateTime EndsAt { get; set; }
}

public class AttendanceRecordDto
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public string SessionTitle { get; set; } = string.Empty;
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public AttendanceStatus Status { get; set; }
    public AttendanceMethod Method { get; set; }
    public string? Notes { get; set; }
    public DateTime RecordedAt { get; set; }
    public string? RecordedByName { get; set; }
}

public class ManualAttendanceDto
{
    public Guid StudentId { get; set; }
    public AttendanceStatus Status { get; set; }
    public string? Notes { get; set; }
}

public class BulkManualAttendanceDto
{
    public List<Guid> StudentIds { get; set; } = new();
    public AttendanceStatus Status { get; set; }
}

public class PinCheckInDto
{
    public string Pin { get; set; } = string.Empty;
}

public class UpdateAttendanceRecordDto
{
    public AttendanceStatus Status { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class AttendanceAuditLogDto
{
    public long Id { get; set; }
    public AttendanceStatus? OldStatus { get; set; }
    public AttendanceStatus NewStatus { get; set; }
    public string? Reason { get; set; }
    public string ChangedByName { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
}

public class AttendanceSummaryDto
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public int TotalSessions { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public List<StudentAttendanceSummaryDto> ByStudent { get; set; } = new();
}

public class StudentAttendanceSummaryDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int ConsecutiveAbsences { get; set; }
}

public class LeaveRequestDto
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public LeaveStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateLeaveRequestDto
{
    public Guid? StudentId { get; set; }
    public DateOnly FromDate { get; set; }
    public DateOnly ToDate { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class LeaveDecisionDto
{
    public bool Approve { get; set; }
}

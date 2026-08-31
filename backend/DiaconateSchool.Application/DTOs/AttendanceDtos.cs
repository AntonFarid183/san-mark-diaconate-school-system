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

// ── Simplified secretary flow: no sessions/PIN in the UI, just "this class, this day, who was here" ──
public class ClassRosterEntryDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public AttendanceStatus? Status { get; set; } // null = not marked yet
}

public class RecordClassAttendanceEntryDto
{
    public Guid StudentId { get; set; }
    public AttendanceStatus Status { get; set; }
}

public class RecordClassAttendanceDto
{
    public Guid ClassId { get; set; }
    public DateOnly Date { get; set; }
    public List<RecordClassAttendanceEntryDto> Entries { get; set; } = new();
}

// ── Stage-wide roster: same "this day, who was here" flow as the class
// roster above, but spanning every class in every grade under one Stage —
// so a secretary can take attendance for a whole stage in one pass instead
// of repeating the class-roster flow once per class. ──
public class StageRosterEntryDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public Guid ClassId { get; set; }
    public string ClassName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public AttendanceStatus? Status { get; set; } // null = not marked yet
}

public class RecordStageAttendanceDto
{
    public Guid StageId { get; set; }
    // Optional narrowing to one Grade under the stage — same roster/record
    // flow, just scoped to a single grade instead of the whole stage.
    public Guid? GradeId { get; set; }
    public Guid AcademicYearId { get; set; }
    // Null = every level, undivided — covers a grade that was never split
    // into levels (every student defaults to Level1 anyway) as well as
    // "take attendance for everyone regardless of level" on purpose.
    public StudentLevel? Level { get; set; }
    public DateOnly Date { get; set; }
    public List<RecordClassAttendanceEntryDto> Entries { get; set; } = new();
}

// ── QR scan — an extra way to mark Present on top of the same simplified
// class+date flow above. Reuses the same auto-created-per-day session
// underneath; nothing session-shaped is exposed to the UI. ──
public class QrScanDto
{
    public string QrToken { get; set; } = string.Empty;
    public Guid ClassId { get; set; }
    public DateOnly Date { get; set; }
}

public enum QrScanResultCode
{
    Success,
    AlreadyPresent,
    WrongClass,
    InvalidQr
}

public class QrScanResultDto
{
    public QrScanResultCode ResultCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public AttendanceRecordDto? Record { get; set; }
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


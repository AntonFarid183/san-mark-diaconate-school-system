using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class AttendanceService : IAttendanceService
{
    private readonly IAttendanceRepository _repo;
    private readonly IStudentRepository _studentRepo;
    private readonly ISchoolClassRepository _classRepo;
    private readonly IUnitOfWork _uow;
    private static readonly Random _random = new();

    public AttendanceService(IAttendanceRepository repo, IStudentRepository studentRepo, ISchoolClassRepository classRepo, IUnitOfWork uow)
    {
        _repo = repo;
        _studentRepo = studentRepo;
        _classRepo = classRepo;
        _uow = uow;
    }

    public async Task<List<AttendanceSessionDto>> GetSessionsAsync(Guid? gradeId, Guid? classId, DateTime? from, DateTime? to, AttendanceSessionStatus? status)
    {
        var sessions = await _repo.GetSessionsAsync(gradeId, classId, from, to, status);
        return sessions.Select(MapToSessionDto).ToList();
    }

    public async Task<AttendanceSessionDetailDto?> GetSessionByIdAsync(Guid id)
    {
        var session = await _repo.GetSessionByIdAsync(id);
        return session == null ? null : MapToSessionDetailDto(session);
    }

    public async Task<List<AttendanceSessionDto>> GetOpenSessionsForStudentAsync(Guid currentUserId)
    {
        var student = await _studentRepo.GetByUserIdAsync(currentUserId);
        if (student == null || student.ClassId == null) return new List<AttendanceSessionDto>();

        var sessions = await _repo.GetSessionsAsync(null, student.ClassId, null, null, AttendanceSessionStatus.Open);
        return sessions.Select(MapToSessionDto).ToList();
    }

    public async Task<AttendanceSessionDetailDto> CreateSessionAsync(CreateAttendanceSessionDto dto, Guid createdByUserId)
    {
        // Never create two sessions for the same class on the same day — open the existing one instead
        var sessionDate = DateOnly.FromDateTime(dto.StartsAt);
        var existing = await _repo.GetSessionByClassAndDateAsync(dto.ClassId, sessionDate);
        if (existing != null)
        {
            var existingDto = MapToSessionDetailDto(existing);
            existingDto.WasExisting = true;
            return existingDto;
        }

        var schoolClass = await _classRepo.GetByIdAsync(dto.ClassId)
            ?? throw new InvalidOperationException("الفصل غير موجود.");

        var session = new AttendanceSession
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            GradeId = schoolClass.GradeId,
            ClassId = dto.ClassId,
            StartsAt = dto.StartsAt,
            EndsAt = dto.EndsAt,
            LateAfterMinutes = 0,
            Pin = GeneratePin(),
            Status = AttendanceSessionStatus.Scheduled,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _repo.AddSessionAsync(session);
        await _uow.SaveChangesAsync();

        var saved = await _repo.GetSessionByIdAsync(session.Id);
        return MapToSessionDetailDto(saved!);
    }

    public async Task<AttendanceSessionDetailDto?> OpenSessionAsync(Guid id)
    {
        var session = await _repo.GetSessionByIdAsync(id);
        if (session == null) return null;

        session.Status = AttendanceSessionStatus.Open;
        await _repo.UpdateSessionAsync(session);
        await _uow.SaveChangesAsync();
        return MapToSessionDetailDto(session);
    }

    public async Task<AttendanceSessionDetailDto?> CloseSessionAsync(Guid id)
    {
        var session = await _repo.GetSessionByIdAsync(id);
        if (session == null) return null;

        var students = await _repo.GetActiveStudentsByClassAsync(session.ClassId);
        var existingStudentIds = session.Records.Select(r => r.StudentId).ToHashSet();

        foreach (var student in students.Where(s => !existingStudentIds.Contains(s.Id)))
        {
            var record = new AttendanceRecord
            {
                Id = Guid.NewGuid(),
                SessionId = session.Id,
                StudentId = student.Id,
                Status = AttendanceStatus.Absent,
                Method = AttendanceMethod.Manual,
                RecordedAt = DateTime.UtcNow
            };
            await _repo.AddRecordAsync(record);
        }

        session.Status = AttendanceSessionStatus.Closed;
        await _repo.UpdateSessionAsync(session);
        await _uow.SaveChangesAsync();

        var saved = await _repo.GetSessionByIdAsync(id);
        return MapToSessionDetailDto(saved!);
    }

    public async Task<List<AttendanceRecordDto>> GetSessionRecordsAsync(Guid sessionId)
    {
        var records = await _repo.GetRecordsBySessionAsync(sessionId);
        return records.Select(MapToRecordDto).ToList();
    }

    public async Task<(bool Success, string? Error, AttendanceRecordDto? Record)> ManualCheckInAsync(Guid sessionId, ManualAttendanceDto dto, Guid recordedByUserId)
    {
        var session = await _repo.GetSessionByIdAsync(sessionId);
        if (session == null) return (false, "Session not found.", null);
        if (session.Status != AttendanceSessionStatus.Open) return (false, "Session is not open.", null);

        var existing = await _repo.GetRecordAsync(sessionId, dto.StudentId);
        if (existing != null)
        {
            existing.Status = dto.Status;
            existing.Notes = dto.Notes;
            existing.Method = AttendanceMethod.Manual;
            existing.RecordedByUserId = recordedByUserId;
            existing.RecordedAt = DateTime.UtcNow;
            await _repo.UpdateRecordAsync(existing);
            await _uow.SaveChangesAsync();
            var updated = await _repo.GetRecordByIdAsync(existing.Id);
            return (true, null, MapToRecordDto(updated!));
        }

        var record = new AttendanceRecord
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            StudentId = dto.StudentId,
            Status = dto.Status,
            Method = AttendanceMethod.Manual,
            Notes = dto.Notes,
            RecordedByUserId = recordedByUserId,
            RecordedAt = DateTime.UtcNow
        };

        await _repo.AddRecordAsync(record);
        await _uow.SaveChangesAsync();

        var saved = await _repo.GetRecordByIdAsync(record.Id);
        return (true, null, MapToRecordDto(saved!));
    }

    public async Task<(bool Success, string? Error, AttendanceRecordDto? Record)> PinCheckInAsync(Guid sessionId, string pin, Guid currentUserId)
    {
        var session = await _repo.GetSessionByIdAsync(sessionId);
        if (session == null) return (false, "Session not found.", null);
        if (session.Status != AttendanceSessionStatus.Open) return (false, "Session is not open for check-in.", null);
        if (!string.Equals(session.Pin, pin, StringComparison.Ordinal)) return (false, "Invalid PIN.", null);

        var student = await _studentRepo.GetByUserIdAsync(currentUserId);
        if (student == null) return (false, "Student record not found.", null);
        if (student.ClassId != session.ClassId) return (false, "This session is not for your class.", null);

        var existing = await _repo.GetRecordAsync(sessionId, student.Id);
        if (existing != null) return (false, "Attendance already recorded for this session.", null);

        var record = new AttendanceRecord
        {
            Id = Guid.NewGuid(),
            SessionId = sessionId,
            StudentId = student.Id,
            Status = AttendanceStatus.Present,
            Method = AttendanceMethod.Pin,
            RecordedAt = DateTime.UtcNow
        };

        await _repo.AddRecordAsync(record);
        await _uow.SaveChangesAsync();

        var saved = await _repo.GetRecordByIdAsync(record.Id);
        return (true, null, MapToRecordDto(saved!));
    }

    public async Task<List<AttendanceRecordDto>> BulkMarkAsync(Guid sessionId, BulkManualAttendanceDto dto, Guid recordedByUserId)
    {
        var session = await _repo.GetSessionByIdAsync(sessionId);
        if (session == null || session.Status != AttendanceSessionStatus.Open)
            return new List<AttendanceRecordDto>();

        var existingRecords = await _repo.GetRecordsBySessionAsync(sessionId);
        var existingMap = existingRecords.ToDictionary(r => r.StudentId);

        foreach (var studentId in dto.StudentIds)
        {
            if (existingMap.TryGetValue(studentId, out var existing))
            {
                existing.Status = dto.Status;
                existing.Method = AttendanceMethod.Manual;
                existing.RecordedByUserId = recordedByUserId;
                existing.RecordedAt = DateTime.UtcNow;
                await _repo.UpdateRecordAsync(existing);
            }
            else
            {
                var record = new AttendanceRecord
                {
                    Id = Guid.NewGuid(),
                    SessionId = sessionId,
                    StudentId = studentId,
                    Status = dto.Status,
                    Method = AttendanceMethod.Manual,
                    RecordedByUserId = recordedByUserId,
                    RecordedAt = DateTime.UtcNow
                };
                await _repo.AddRecordAsync(record);
            }
        }

        await _uow.SaveChangesAsync();

        var allRecords = await _repo.GetRecordsBySessionAsync(sessionId);
        return allRecords
            .Where(r => dto.StudentIds.Contains(r.StudentId))
            .Select(MapToRecordDto)
            .ToList();
    }

    public async Task<List<AttendanceRecordDto>> GetRecordsAsync(Guid? gradeId, Guid? studentId, DateTime? from, DateTime? to, AttendanceStatus? status)
    {
        var records = await _repo.GetRecordsAsync(gradeId, studentId, from, to, status);
        return records.Select(MapToRecordDto).ToList();
    }

    public async Task<AttendanceRecordDto?> OverrideRecordAsync(Guid recordId, UpdateAttendanceRecordDto dto, Guid changedByUserId)
    {
        var record = await _repo.GetRecordByIdAsync(recordId);
        if (record == null) return null;

        var oldStatus = record.Status;
        record.Status = dto.Status;
        record.Method = AttendanceMethod.Manual;
        await _repo.UpdateRecordAsync(record);

        await _repo.AddAuditLogAsync(new AttendanceAuditLog
        {
            RecordId = recordId,
            ChangedByUserId = changedByUserId,
            OldStatus = oldStatus,
            NewStatus = dto.Status,
            Reason = dto.Reason,
            ChangedAt = DateTime.UtcNow
        });

        await _uow.SaveChangesAsync();

        var saved = await _repo.GetRecordByIdAsync(recordId);
        return MapToRecordDto(saved!);
    }

    public async Task<List<AttendanceAuditLogDto>> GetAuditLogAsync(Guid recordId)
    {
        var logs = await _repo.GetAuditLogsAsync(recordId);
        return logs.Select(l => new AttendanceAuditLogDto
        {
            Id = l.Id,
            OldStatus = l.OldStatus,
            NewStatus = l.NewStatus,
            Reason = l.Reason,
            ChangedByName = l.ChangedByUser.FirstName + " " + l.ChangedByUser.LastName,
            ChangedAt = l.ChangedAt
        }).ToList();
    }

    public async Task<AttendanceSummaryDto> GetSummaryAsync(Guid? gradeId, DateTime from, DateTime to)
    {
        var records = await _repo.GetRecordsAsync(gradeId, null, from, to, null);
        var sessions = await _repo.GetSessionsAsync(gradeId, null, from, to, null);

        var byStudent = records
            .GroupBy(r => r.StudentId)
            .Select(g =>
            {
                var ordered = g.OrderBy(r => r.RecordedAt).ToList();
                var consecutive = 0;
                for (int i = ordered.Count - 1; i >= 0; i--)
                {
                    if (ordered[i].Status == AttendanceStatus.Absent) consecutive++;
                    else break;
                }

                var first = ordered.First();
                return new StudentAttendanceSummaryDto
                {
                    StudentId = g.Key,
                    StudentName = first.Student.User.FirstName + " " + first.Student.User.LastName,
                    StudentCode = first.Student.StudentCode,
                    PresentCount = g.Count(r => r.Status == AttendanceStatus.Present),
                    AbsentCount = g.Count(r => r.Status == AttendanceStatus.Absent),
                    ConsecutiveAbsences = consecutive
                };
            })
            .OrderBy(s => s.StudentName)
            .ToList();

        return new AttendanceSummaryDto
        {
            From = from,
            To = to,
            TotalSessions = sessions.Count,
            PresentCount = records.Count(r => r.Status == AttendanceStatus.Present),
            AbsentCount = records.Count(r => r.Status == AttendanceStatus.Absent),
            ByStudent = byStudent
        };
    }

    public async Task<List<LeaveRequestDto>> GetLeavesAsync(Guid? studentId, LeaveStatus? status, Guid currentUserId, bool isAdmin)
    {
        Guid? effectiveStudentId = studentId;
        if (!isAdmin)
        {
            var student = await _studentRepo.GetByUserIdAsync(currentUserId);
            effectiveStudentId = student?.Id ?? Guid.Empty;
        }

        var leaves = await _repo.GetLeavesAsync(effectiveStudentId, status);
        return leaves.Select(MapToLeaveDto).ToList();
    }

    public async Task<LeaveRequestDto> CreateLeaveAsync(CreateLeaveRequestDto dto, Guid requestedByUserId, bool isAdmin)
    {
        Guid studentId;
        if (isAdmin && dto.StudentId.HasValue)
        {
            studentId = dto.StudentId.Value;
        }
        else
        {
            var student = await _studentRepo.GetByUserIdAsync(requestedByUserId)
                ?? throw new InvalidOperationException("Student record not found.");
            studentId = student.Id;
        }

        var leave = new LeaveRequest
        {
            Id = Guid.NewGuid(),
            StudentId = studentId,
            FromDate = dto.FromDate,
            ToDate = dto.ToDate,
            Reason = dto.Reason,
            Status = LeaveStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        await _repo.AddLeaveAsync(leave);
        await _uow.SaveChangesAsync();

        var saved = await _repo.GetLeaveByIdAsync(leave.Id);
        return MapToLeaveDto(saved!);
    }

    public async Task<LeaveRequestDto?> DecideLeaveAsync(Guid id, LeaveDecisionDto dto, Guid decidedByUserId)
    {
        var leave = await _repo.GetLeaveByIdAsync(id);
        if (leave == null) return null;

        leave.Status = dto.Approve ? LeaveStatus.Approved : LeaveStatus.Rejected;
        leave.DecidedByUserId = decidedByUserId;
        leave.DecidedAt = DateTime.UtcNow;

        await _repo.UpdateLeaveAsync(leave);
        await _uow.SaveChangesAsync();

        return MapToLeaveDto(leave);
    }

    private static string GeneratePin() => _random.Next(0, 1000000).ToString("D6");

    private static AttendanceSessionDto MapToSessionDto(AttendanceSession s) => new()
    {
        Id = s.Id,
        Title = s.Title,
        GradeId = s.GradeId,
        GradeName = s.Grade.Name,
        ClassId = s.ClassId,
        ClassName = s.Class.Name,
        StartsAt = s.StartsAt,
        EndsAt = s.EndsAt,
        Status = s.Status,
        CreatedAt = s.CreatedAt,
        PresentCount = s.Records.Count(r => r.Status == AttendanceStatus.Present),
        AbsentCount = s.Records.Count(r => r.Status == AttendanceStatus.Absent),
        TotalStudents = s.Records.Count
    };

    private static AttendanceSessionDetailDto MapToSessionDetailDto(AttendanceSession s)
    {
        var dto = MapToSessionDto(s);
        return new AttendanceSessionDetailDto
        {
            Id = dto.Id,
            Title = dto.Title,
            GradeId = dto.GradeId,
            GradeName = dto.GradeName,
            ClassId = dto.ClassId,
            ClassName = dto.ClassName,
            StartsAt = dto.StartsAt,
            EndsAt = dto.EndsAt,
            Status = dto.Status,
            CreatedAt = dto.CreatedAt,
            PresentCount = dto.PresentCount,
            AbsentCount = dto.AbsentCount,
            TotalStudents = dto.TotalStudents,
            Pin = s.Pin
        };
    }

    private static AttendanceRecordDto MapToRecordDto(AttendanceRecord r) => new()
    {
        Id = r.Id,
        SessionId = r.SessionId,
        SessionTitle = r.Session != null ? r.Session.Title : string.Empty,
        StudentId = r.StudentId,
        StudentName = r.Student.User.FirstName + " " + r.Student.User.LastName,
        StudentCode = r.Student.StudentCode,
        Status = r.Status,
        Method = r.Method,
        Notes = r.Notes,
        RecordedAt = r.RecordedAt,
        RecordedByName = r.RecordedByUser != null ? r.RecordedByUser.FirstName + " " + r.RecordedByUser.LastName : null
    };

    private static LeaveRequestDto MapToLeaveDto(LeaveRequest l) => new()
    {
        Id = l.Id,
        StudentId = l.StudentId,
        StudentName = l.Student.User.FirstName + " " + l.Student.User.LastName,
        FromDate = l.FromDate,
        ToDate = l.ToDate,
        Reason = l.Reason,
        Status = l.Status,
        CreatedAt = l.CreatedAt
    };
}

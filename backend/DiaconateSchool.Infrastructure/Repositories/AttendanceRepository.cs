using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class AttendanceRepository : IAttendanceRepository
{
    private readonly ApplicationDbContext _context;

    public AttendanceRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<AttendanceSession>> GetSessionsAsync(Guid? gradeId, Guid? classId, DateTime? from, DateTime? to, AttendanceSessionStatus? status)
    {
        var query = _context.AttendanceSessions
            .Include(s => s.Grade)
            .Include(s => s.Class)
            .Include(s => s.Records)
            .AsQueryable();

        if (gradeId.HasValue) query = query.Where(s => s.GradeId == gradeId.Value);
        if (classId.HasValue) query = query.Where(s => s.ClassId == classId.Value);
        if (from.HasValue) query = query.Where(s => s.StartsAt >= from.Value);
        if (to.HasValue) query = query.Where(s => s.StartsAt <= to.Value);
        if (status.HasValue) query = query.Where(s => s.Status == status.Value);

        return await query.OrderByDescending(s => s.StartsAt).ToListAsync();
    }

    public async Task<AttendanceSession?> GetSessionByIdAsync(Guid id)
    {
        return await _context.AttendanceSessions
            .Include(s => s.Grade)
            .Include(s => s.Class)
            .Include(s => s.Records)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<AttendanceSession?> GetSessionByClassAndDateAsync(Guid classId, DateOnly date)
    {
        var start = date.ToDateTime(TimeOnly.MinValue);
        var end = date.ToDateTime(TimeOnly.MaxValue);
        return await _context.AttendanceSessions
            .Include(s => s.Grade)
            .Include(s => s.Class)
            .Include(s => s.Records)
            .FirstOrDefaultAsync(s => s.ClassId == classId && s.StartsAt >= start && s.StartsAt <= end);
    }

    public async Task AddSessionAsync(AttendanceSession session)
    {
        await _context.AttendanceSessions.AddAsync(session);
    }

    public Task UpdateSessionAsync(AttendanceSession session)
    {
        _context.AttendanceSessions.Update(session);
        return Task.CompletedTask;
    }

    public async Task DeleteSessionsByClassIdsAsync(IEnumerable<Guid> classIds)
    {
        var ids = classIds.ToList();
        var sessions = await _context.AttendanceSessions
            .Where(s => ids.Contains(s.ClassId))
            .ToListAsync();
        // AttendanceRecords/AuditLogs cascade off Session on delete — configured in ApplicationDbContext.
        _context.AttendanceSessions.RemoveRange(sessions);
    }

    public async Task<List<AttendanceRecord>> GetRecordsBySessionAsync(Guid sessionId)
    {
        return await _context.AttendanceRecords
            .Include(r => r.Student).ThenInclude(s => s.User)
            .Include(r => r.RecordedByUser)
            .Where(r => r.SessionId == sessionId)
            .ToListAsync();
    }

    public async Task<AttendanceRecord?> GetRecordAsync(Guid sessionId, Guid studentId)
    {
        return await _context.AttendanceRecords
            .FirstOrDefaultAsync(r => r.SessionId == sessionId && r.StudentId == studentId);
    }

    public async Task<AttendanceRecord?> GetRecordByIdAsync(Guid id)
    {
        return await _context.AttendanceRecords
            .Include(r => r.Student).ThenInclude(s => s.User)
            .Include(r => r.Session)
            .Include(r => r.RecordedByUser)
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task AddRecordAsync(AttendanceRecord record)
    {
        await _context.AttendanceRecords.AddAsync(record);
    }

    public Task UpdateRecordAsync(AttendanceRecord record)
    {
        _context.AttendanceRecords.Update(record);
        return Task.CompletedTask;
    }

    public async Task<List<AttendanceRecord>> GetRecordsAsync(Guid? gradeId, Guid? studentId, DateTime? from, DateTime? to, AttendanceStatus? status)
    {
        var query = _context.AttendanceRecords
            .Include(r => r.Student).ThenInclude(s => s.User)
            .Include(r => r.Session)
            .Include(r => r.RecordedByUser)
            .AsQueryable();

        if (gradeId.HasValue) query = query.Where(r => r.Session.GradeId == gradeId.Value);
        if (studentId.HasValue) query = query.Where(r => r.StudentId == studentId.Value);
        if (from.HasValue) query = query.Where(r => r.Session.StartsAt >= from.Value);
        if (to.HasValue) query = query.Where(r => r.Session.StartsAt <= to.Value);
        if (status.HasValue) query = query.Where(r => r.Status == status.Value);

        return await query.OrderByDescending(r => r.RecordedAt).ToListAsync();
    }

    public async Task<List<AttendanceRecord>> GetRecordsByStudentIdsAsync(IEnumerable<Guid> studentIds)
    {
        var ids = studentIds.ToList();
        return await _context.AttendanceRecords
            .Where(r => ids.Contains(r.StudentId))
            .ToListAsync();
    }

    public async Task AddAuditLogAsync(AttendanceAuditLog log)
    {
        await _context.AttendanceAuditLogs.AddAsync(log);
    }

    public async Task<List<AttendanceAuditLog>> GetAuditLogsAsync(Guid recordId)
    {
        return await _context.AttendanceAuditLogs
            .Include(l => l.ChangedByUser)
            .Where(l => l.RecordId == recordId)
            .OrderByDescending(l => l.ChangedAt)
            .ToListAsync();
    }

    public async Task<List<Student>> GetActiveStudentsByClassAsync(Guid classId)
    {
        return await _context.Students
            .Include(s => s.User)
            .Where(s => s.ClassId == classId && s.Status == StudentStatus.Active)
            .ToListAsync();
    }

    public async Task<List<Student>> GetActiveStudentsByStageAsync(Guid stageId, Guid academicYearId, StudentLevel? level, Guid? gradeId = null)
    {
        // level == null means "every level" -- covers a grade that was never
        // split (everyone defaults to Level1 anyway) as well as deliberately
        // taking attendance for both levels at once. gradeId narrows the
        // same stage-wide query down to a single grade when set.
        return await _context.Students
            .Include(s => s.User)
            .Include(s => s.Class).ThenInclude(c => c.Grade)
            .Where(s => s.Status == StudentStatus.Active
                && s.Class != null
                && s.Class.AcademicYearId == academicYearId
                && (level == null || s.Class.Level == level)
                && s.Class.Grade.StageId == stageId
                && (gradeId == null || s.Class.GradeId == gradeId))
            .ToListAsync();
    }

    public async Task<List<AttendanceSession>> GetSessionsByClassIdsAndDateAsync(IEnumerable<Guid> classIds, DateOnly date)
    {
        var ids = classIds.ToList();
        var start = date.ToDateTime(TimeOnly.MinValue);
        var end = date.ToDateTime(TimeOnly.MaxValue);
        return await _context.AttendanceSessions
            .Include(s => s.Records)
            .Where(s => ids.Contains(s.ClassId) && s.StartsAt >= start && s.StartsAt <= end)
            .ToListAsync();
    }

    public async Task<int> GetOpenSessionsCountAsync()
        => await _context.AttendanceSessions.CountAsync(s => s.Status == AttendanceSessionStatus.Open);

    public async Task<AttendanceSession?> GetFirstOpenSessionAsync()
        => await _context.AttendanceSessions
            .Include(s => s.Grade).ThenInclude(g => g.Stage)
            .Include(s => s.Class)
            .Where(s => s.Status == AttendanceSessionStatus.Open)
            .OrderBy(s => s.StartsAt)
            .FirstOrDefaultAsync();

}

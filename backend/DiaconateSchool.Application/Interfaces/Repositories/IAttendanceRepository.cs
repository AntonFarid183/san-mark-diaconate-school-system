using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IAttendanceRepository
{
    Task<List<AttendanceSession>> GetSessionsAsync(Guid? gradeId, Guid? classId, DateTime? from, DateTime? to, AttendanceSessionStatus? status);
    Task<AttendanceSession?> GetSessionByIdAsync(Guid id);
    Task<AttendanceSession?> GetSessionByClassAndDateAsync(Guid classId, DateOnly date);
    Task AddSessionAsync(AttendanceSession session);
    Task UpdateSessionAsync(AttendanceSession session);
    Task DeleteSessionsByClassIdsAsync(IEnumerable<Guid> classIds);

    Task<List<AttendanceRecord>> GetRecordsBySessionAsync(Guid sessionId);
    Task<AttendanceRecord?> GetRecordAsync(Guid sessionId, Guid studentId);
    Task<AttendanceRecord?> GetRecordByIdAsync(Guid id);
    Task AddRecordAsync(AttendanceRecord record);
    Task UpdateRecordAsync(AttendanceRecord record);
    Task<List<AttendanceRecord>> GetRecordsAsync(Guid? gradeId, Guid? studentId, DateTime? from, DateTime? to, AttendanceStatus? status);
    Task<List<AttendanceRecord>> GetRecordsByStudentIdsAsync(IEnumerable<Guid> studentIds);

    Task AddAuditLogAsync(AttendanceAuditLog log);
    Task<List<AttendanceAuditLog>> GetAuditLogsAsync(Guid recordId);

    Task<List<Student>> GetActiveStudentsByClassAsync(Guid classId);
    Task<List<Student>> GetActiveStudentsByStageAsync(Guid stageId, Guid academicYearId, StudentLevel? level, Guid? gradeId = null);
    Task<List<AttendanceSession>> GetSessionsByClassIdsAndDateAsync(IEnumerable<Guid> classIds, DateOnly date);
    Task<int> GetOpenSessionsCountAsync();
    Task<AttendanceSession?> GetFirstOpenSessionAsync();
}

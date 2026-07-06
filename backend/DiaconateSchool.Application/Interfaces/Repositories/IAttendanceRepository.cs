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

    Task<List<AttendanceRecord>> GetRecordsBySessionAsync(Guid sessionId);
    Task<AttendanceRecord?> GetRecordAsync(Guid sessionId, Guid studentId);
    Task<AttendanceRecord?> GetRecordByIdAsync(Guid id);
    Task AddRecordAsync(AttendanceRecord record);
    Task UpdateRecordAsync(AttendanceRecord record);
    Task<List<AttendanceRecord>> GetRecordsAsync(Guid? gradeId, Guid? studentId, DateTime? from, DateTime? to, AttendanceStatus? status);

    Task AddAuditLogAsync(AttendanceAuditLog log);
    Task<List<AttendanceAuditLog>> GetAuditLogsAsync(Guid recordId);

    Task<List<Student>> GetActiveStudentsByClassAsync(Guid classId);
    Task<int> GetOpenSessionsCountAsync();

    Task<LeaveRequest?> GetLeaveByIdAsync(Guid id);
    Task<List<LeaveRequest>> GetLeavesAsync(Guid? studentId, LeaveStatus? status);
    Task AddLeaveAsync(LeaveRequest leave);
    Task UpdateLeaveAsync(LeaveRequest leave);
    Task<bool> HasApprovedLeaveAsync(Guid studentId, DateOnly date);
}

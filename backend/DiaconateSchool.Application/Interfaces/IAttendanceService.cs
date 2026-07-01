using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IAttendanceService
{
    Task<List<AttendanceSessionDto>> GetSessionsAsync(Guid? gradeId, DateTime? from, DateTime? to, AttendanceSessionStatus? status);
    Task<List<AttendanceSessionDto>> GetOpenSessionsForStudentAsync(Guid currentUserId);
    Task<AttendanceSessionDetailDto?> GetSessionByIdAsync(Guid id);
    Task<AttendanceSessionDetailDto> CreateSessionAsync(CreateAttendanceSessionDto dto, Guid createdByUserId);
    Task<AttendanceSessionDetailDto?> OpenSessionAsync(Guid id);
    Task<AttendanceSessionDetailDto?> CloseSessionAsync(Guid id);

    Task<List<AttendanceRecordDto>> GetSessionRecordsAsync(Guid sessionId);
    Task<(bool Success, string? Error, AttendanceRecordDto? Record)> ManualCheckInAsync(Guid sessionId, ManualAttendanceDto dto, Guid recordedByUserId);
    Task<(bool Success, string? Error, AttendanceRecordDto? Record)> PinCheckInAsync(Guid sessionId, string pin, Guid currentUserId);

    Task<List<AttendanceRecordDto>> GetRecordsAsync(Guid? gradeId, Guid? studentId, DateTime? from, DateTime? to, AttendanceStatus? status);
    Task<AttendanceRecordDto?> OverrideRecordAsync(Guid recordId, UpdateAttendanceRecordDto dto, Guid changedByUserId);
    Task<List<AttendanceAuditLogDto>> GetAuditLogAsync(Guid recordId);

    Task<AttendanceSummaryDto> GetSummaryAsync(Guid? gradeId, DateTime from, DateTime to);

    Task<List<LeaveRequestDto>> GetLeavesAsync(Guid? studentId, LeaveStatus? status, Guid currentUserId, bool isAdmin);
    Task<LeaveRequestDto> CreateLeaveAsync(CreateLeaveRequestDto dto, Guid requestedByUserId, bool isAdmin);
    Task<LeaveRequestDto?> DecideLeaveAsync(Guid id, LeaveDecisionDto dto, Guid decidedByUserId);
}

using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Services;

public interface IStudentQueryService
{
    Task<StudentListResponseDto> GetStudentsAsync(int page, int pageSize, string? nameFilter = null, Guid? gradeId = null, Guid? stageId = null, Guid? classId = null, StudentLevel? level = null);
    Task<IEnumerable<object>> GetAllGradesAsync();
    Task<IEnumerable<StudentDetailDto>> GetPendingStudentsAsync();
    Task<StudentDetailDto?> GetStudentByIdAsync(Guid id);
    Task<StudentDetailDto?> GetStudentByUserIdAsync(Guid userId);
    Task<StudentDetailDto?> UpdateStudentAsync(Guid id, UpdateStudentDto dto);
    Task<bool> ResetPasswordAsync(Guid studentId, string newPassword);
    Task<bool> SetActiveStatusAsync(Guid studentId, bool isActive, bool withFees = false, decimal? paidAmount = null, Guid? recordedByUserId = null, bool isExempt = false, decimal? amountDue = null);
    Task<(bool Success, string? Error)> SetStudentsLevelAsync(List<Guid> studentIds, StudentLevel level);
    Task<PaymentReportSummaryDto> GetPaymentReportAsync(PaymentReportFilterDto filter);
    Task<List<StudentBirthdayDto>> GetBirthdaysThisMonthAsync();
}

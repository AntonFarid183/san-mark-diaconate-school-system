using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IStudentRepository
{
    Task<bool> ExistsAsync(string firstName, string middleName, string thirdName, string lastName, DateOnly dateOfBirth);
    Task AddAsync(Student student);
    Task<int> GetTotalCountAsync();
    Task<IEnumerable<Grade>> GetGradesByStageAsync(Guid stageId);
    Task<IEnumerable<Stage>> GetAllStagesAsync();
    Task<List<Student>> GetAllAsync(int page, int pageSize, string? nameFilter = null, Guid? gradeId = null, Guid? stageId = null, Guid? classId = null, StudentLevel? level = null);
    Task<int> GetFilteredCountAsync(string? nameFilter = null, Guid? gradeId = null, Guid? stageId = null, Guid? classId = null, StudentLevel? level = null);
    Task<List<Grade>> GetAllGradesAsync();
    Task<Student?> GetByIdWithIncludesAsync(Guid id);
    Task<Student?> GetByUserIdAsync(Guid userId);
    Task<Student?> GetByQrTokenAsync(string qrToken);
    Task<List<Student>> GetByIdsAsync(IEnumerable<Guid> ids);
    Task UpdateAsync(Student student);
    Task<List<Student>> GetPendingAsync();
    Task<List<Student>> GetActiveStudentsForNotificationAsync(Guid? stageId, Guid? gradeId);
    Task<(List<Student> Items, int TotalCount, int PaidCount, decimal TotalCollected, Dictionary<Guid, (decimal PaidAmount, string Status)> Payments)> GetPaymentReportAsync(
        string? nameFilter, Guid? stageId, Guid? gradeId, string? paymentStatus, DateTime? dateFrom, DateTime? dateTo);

    // Permanently removes a student and every record that references them
    // (attendance, homework, exams, certificates, payments, hymn progress,
    // leave requests, grade history, content access) plus their login
    // account -- not just the Students row, so it doesn't leave orphaned
    // history behind or fail on FK constraints for students who have any.
    Task DeleteAsync(Guid studentId);
}

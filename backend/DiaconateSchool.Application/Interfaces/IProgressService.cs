using System;
using System.Threading.Tasks;
using DiaconateSchool.Application.DTOs;

namespace DiaconateSchool.Application.Interfaces;

public interface IProgressService
{
    Task RecordHeartbeatAsync(Guid userId, ProgressHeartbeatDto dto);
    Task<StudentDashboardDto?> GetStudentDashboardAsync(Guid userId);
    Task<List<LessonProgressDto>> GetLessonProgressAsync(Guid userId);
    Task RecalculateSummaryAsync(Guid studentId);
}

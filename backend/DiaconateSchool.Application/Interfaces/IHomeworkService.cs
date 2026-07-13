using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IHomeworkService
{
    Task<List<HomeworkSubjectDto>> GetSubjectsAsync();

    // Admin
    Task<List<HomeworkListItemDto>> GetAllAsync(Guid? stageId, Guid? gradeId, Guid? subjectId, LessonStatus? status);
    Task<HomeworkAdminDetailDto?> GetByIdAsync(Guid id);
    Task<(bool Success, string? Error, HomeworkAdminDetailDto? Result)> CreateAsync(CreateHomeworkDto dto, Guid createdByUserId);
    Task<(bool Success, string? Error)> SetStatusAsync(Guid id, LessonStatus status);
    Task<(bool Success, string? Error)> DeleteAsync(Guid id);

    // Manual grade entry — for students graded in person rather than online
    Task<(bool Success, string? Error, List<HomeworkGradingRosterItemDto>? Result)> GetGradingRosterAsync(Guid homeworkId);
    Task<(bool Success, string? Error)> SetManualGradesAsync(Guid homeworkId, ManualGradeEntryDto dto);

    // Student
    Task<List<StudentHomeworkListItemDto>> GetAvailableForStudentAsync(Guid studentId);
    Task<(bool Success, string? Error, StudentHomeworkDetailDto? Result)> GetForStudentAsync(Guid homeworkId, Guid studentId);
    Task<(bool Success, string? Error, SubmitHomeworkResultDto? Result)> SubmitAsync(Guid homeworkId, Guid studentId, SubmitHomeworkDto dto);
}

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

public class ProgressService : IProgressService
{
    private readonly IContentAccessRepository _accessRepo;
    private readonly IContentItemRepository _contentItemRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IUnitOfWork _uow;

    public ProgressService(
        IContentAccessRepository accessRepo,
        IContentItemRepository contentItemRepo,
        IStudentRepository studentRepo,
        IUnitOfWork uow)
    {
        _accessRepo = accessRepo;
        _contentItemRepo = contentItemRepo;
        _studentRepo = studentRepo;
        _uow = uow;
    }

    public async Task RecordHeartbeatAsync(Guid userId, ProgressHeartbeatDto dto)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId);
        if (student == null)
            throw new InvalidOperationException("Student profile not found.");

        if (!Enum.TryParse<AccessType>(dto.AccessType, true, out var accessType))
            throw new ArgumentException($"Invalid access type: {dto.AccessType}");

        var access = await _accessRepo.GetByStudentAndItemAsync(student.Id, dto.ContentItemId);

        if (access == null)
        {
            access = new ContentAccess
            {
                Id = Guid.NewGuid(),
                StudentId = student.Id,
                ContentItemId = dto.ContentItemId,
                LessonId = dto.LessonId,
                AccessType = accessType,
                Progress = dto.Progress,
                LastPosition = dto.LastPosition,
                AccessCount = 1
            };
            await _accessRepo.AddAsync(access);
        }
        else
        {
            access.Progress = Math.Max(access.Progress, dto.Progress);
            access.LastPosition = dto.LastPosition;
            access.AccessCount++;
            access.UpdatedAt = DateTime.UtcNow;

            if (dto.Progress >= 100)
                access.CompletedAt ??= DateTime.UtcNow;

            _accessRepo.Update(access);
        }

        await _uow.SaveChangesAsync();
    }

    public async Task<StudentDashboardDto?> GetStudentDashboardAsync(Guid userId)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId);
        if (student == null) return null;

        var gradeId = student.GradeId;
        var lessons = await _contentItemRepo.GetByLessonAsync(Guid.Empty); // Placeholder
        // For now return dashboard structure; will be refined when full lesson data is available

        return new StudentDashboardDto
        {
            StudentName = $"{student.User.FirstName} {student.User.LastName}",
            StageName = student.Grade?.Stage?.Name ?? string.Empty,
            GradeName = student.Grade?.Name ?? string.Empty,
            StudentCode = student.StudentCode,
            OverallProgress = 0,
            CompletedLessons = 0,
            TotalLessons = 0,
            RecentLessons = new List<LessonProgressDto>(),
            PendingSubmissions = 0,
            UnreadNotifications = 0
        };
    }

    public async Task<List<LessonProgressDto>> GetLessonProgressAsync(Guid userId)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId);
        if (student == null) return new List<LessonProgressDto>();

        return new List<LessonProgressDto>();
    }

    public async Task RecalculateSummaryAsync(Guid studentId)
    {
        await Task.CompletedTask;
    }
}

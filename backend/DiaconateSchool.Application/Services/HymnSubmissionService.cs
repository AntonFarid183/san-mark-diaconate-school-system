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

public class HymnSubmissionService : IHymnSubmissionService
{
    private readonly IHymnSubmissionRepository _repo;
    private readonly INotificationService _notificationService;
    private readonly IUnitOfWork _uow;

    public HymnSubmissionService(IHymnSubmissionRepository repo, INotificationService notificationService, IUnitOfWork uow)
    {
        _repo = repo;
        _notificationService = notificationService;
        _uow = uow;
    }

    public async Task<HymnSubmissionDto?> GetMySubmissionAsync(Guid studentId, Guid hymnLessonId)
    {
        var submission = await _repo.GetByStudentAndLessonAsync(studentId, hymnLessonId);
        return submission == null ? null : Map(submission);
    }

    public async Task<(bool Success, string? Error, HymnSubmissionDto? Result)> SubmitRecordingAsync(
        Guid studentId, Guid hymnLessonId, SubmitHymnRecordingDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.RecordingUrl))
            return (false, "التسجيل مطلوب.", null);

        var existing = await _repo.GetByStudentAndLessonAsync(studentId, hymnLessonId);

        if (existing != null && existing.Status != HymnSubmissionStatus.ResubmissionRequested)
            return (false, "تم تسجيل هذا اللحن بالفعل.", null);

        if (existing != null)
        {
            // Resubmission — overwrite the same row
            existing.RecordingUrl = dto.RecordingUrl;
            existing.RecordingFileName = dto.RecordingFileName;
            existing.Status = HymnSubmissionStatus.Pending;
            existing.Score = null;
            existing.Comments = null;
            existing.SubmittedAt = DateTime.UtcNow;
            existing.ReviewedAt = null;
            existing.ReviewedByUserId = null;

            await _uow.SaveChangesAsync();
            return (true, null, Map(existing));
        }

        var submission = new HymnSubmission
        {
            Id = Guid.NewGuid(),
            HymnLessonId = hymnLessonId,
            StudentId = studentId,
            RecordingUrl = dto.RecordingUrl,
            RecordingFileName = dto.RecordingFileName,
            Status = HymnSubmissionStatus.Pending,
            SubmittedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(submission);
        await _uow.SaveChangesAsync();

        var saved = await _repo.GetByStudentAndLessonAsync(studentId, hymnLessonId);
        return (true, null, Map(saved!));
    }

    public async Task<List<HymnSubmissionRosterItemDto>> GetRosterAsync(Guid hymnLessonId, Guid gradeId, Guid? classId)
    {
        var students = await _repo.GetStudentsForRosterAsync(gradeId, classId);
        var submissions = await _repo.GetSubmissionsByLessonAsync(hymnLessonId);
        var byStudentId = submissions.ToDictionary(s => s.StudentId);

        return students.Select(student =>
        {
            byStudentId.TryGetValue(student.Id, out var sub);
            return new HymnSubmissionRosterItemDto
            {
                StudentId = student.Id,
                StudentName = $"{student.User.FirstName} {student.User.MiddleName} {student.User.LastName}".Trim(),
                StudentCode = student.StudentCode,
                ClassName = student.Class?.Name,
                SubmissionId = sub?.Id,
                Status = sub == null ? "not_submitted" : StatusToString(sub.Status),
                RecordingUrl = sub?.RecordingUrl,
                RecordingFileName = sub?.RecordingFileName,
                SubmittedAt = sub?.SubmittedAt,
                Score = sub?.Score,
                Comments = sub?.Comments
            };
        }).ToList();
    }

    public async Task<(bool Success, string? Error, HymnSubmissionDto? Result)> ReviewAsync(
        Guid submissionId, ReviewHymnSubmissionDto dto, Guid reviewedByUserId)
    {
        var submission = await _repo.GetByIdAsync(submissionId);
        if (submission == null) return (false, "التسجيل غير موجود.", null);

        if (dto.Approve && (dto.Score == null || dto.Score < 0))
            return (false, "الدرجة مطلوبة عند الموافقة.", null);

        submission.Status = dto.Approve ? HymnSubmissionStatus.Approved : HymnSubmissionStatus.ResubmissionRequested;
        submission.Score = dto.Approve ? dto.Score : null;
        submission.Comments = dto.Comments;
        submission.ReviewedAt = DateTime.UtcNow;
        submission.ReviewedByUserId = reviewedByUserId;

        await _uow.SaveChangesAsync();

        await _notificationService.NotifyHymnReviewedAsync(
            submission.Student.UserId, submission.HymnLessonId, submission.HymnLesson.Title, dto.Approve);

        var refreshed = await _repo.GetByIdAsync(submissionId);
        return (true, null, Map(refreshed!));
    }

    private static string StatusToString(HymnSubmissionStatus status) => status switch
    {
        HymnSubmissionStatus.Approved => "approved",
        HymnSubmissionStatus.ResubmissionRequested => "resubmission_requested",
        _ => "pending"
    };

    private static HymnSubmissionDto Map(HymnSubmission s) => new()
    {
        Id = s.Id,
        HymnLessonId = s.HymnLessonId,
        HymnTitle = s.HymnLesson?.Title ?? string.Empty,
        Status = StatusToString(s.Status),
        RecordingUrl = s.RecordingUrl,
        RecordingFileName = s.RecordingFileName,
        Score = s.Score,
        Comments = s.Comments,
        SubmittedAt = s.SubmittedAt,
        ReviewedAt = s.ReviewedAt,
        ReviewedByName = s.ReviewedByUser != null ? $"{s.ReviewedByUser.FirstName} {s.ReviewedByUser.LastName}".Trim() : null
    };
}

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

public class HymnService : IHymnService
{
    private readonly IHymnRepository _hymnRepo;
    private readonly IHymnSubmissionRepository _submissionRepo;
    private readonly IUnitOfWork _uow;

    public HymnService(IHymnRepository hymnRepo, IHymnSubmissionRepository submissionRepo, IUnitOfWork uow)
    {
        _hymnRepo = hymnRepo;
        _submissionRepo = submissionRepo;
        _uow = uow;
    }

    public async Task<List<HymnListItemDto>> GetHymnsForStudentAsync(Guid studentId, Guid gradeId)
    {
        var hymns = await _hymnRepo.GetByGradeAsync(gradeId);
        var submissions = await _submissionRepo.GetByStudentAsync(studentId);
        var subMap = submissions.ToDictionary(s => s.HymnId);

        return hymns.Select(h =>
        {
            var sub = subMap.GetValueOrDefault(h.Id);
            return new HymnListItemDto
            {
                Id = h.Id,
                Title = h.Title,
                Description = h.Description,
                DueDate = h.DueDate.ToString("yyyy-MM-dd"),
                GradeName = h.Grade?.Name ?? "",
                HasSubmitted = sub != null,
                Status = sub?.Status.ToString() ?? "Pending",
                Feedback = sub?.Feedback,
                Grade = sub?.Grade
            };
        }).ToList();
    }

    public async Task<List<HymnListItemDto>> GetAllHymnsAsync()
    {
        var hymns = await _hymnRepo.GetAllAsync();
        return hymns.Select(h => new HymnListItemDto
        {
            Id = h.Id,
            Title = h.Title,
            Description = h.Description,
            DueDate = h.DueDate.ToString("yyyy-MM-dd"),
            GradeName = h.Grade?.Name ?? "",
            Status = "Active"
        }).ToList();
    }

    public async Task<HymnListItemDto> CreateHymnAsync(CreateHymnDto dto)
    {
        var hymn = new Hymn
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            DueDate = dto.DueDate,
            GradeId = dto.GradeId,
            CreatedByUserId = Guid.Empty
        };

        await _hymnRepo.AddAsync(hymn);
        await _uow.SaveChangesAsync();

        return new HymnListItemDto
        {
            Id = hymn.Id,
            Title = hymn.Title,
            Description = hymn.Description,
            DueDate = hymn.DueDate.ToString("yyyy-MM-dd"),
            Status = "Active"
        };
    }

    public async Task<HymnSubmissionDto> SubmitHymnAsync(Guid hymnId, Guid studentId, string audioUrl)
    {
        var existing = await _submissionRepo.GetByHymnAndStudentAsync(hymnId, studentId);
        if (existing != null)
        {
            existing.AudioUrl = audioUrl;
            existing.Status = SubmissionStatus.Submitted;
            existing.SubmittedAt = DateTime.UtcNow;
            _submissionRepo.Update(existing);
            await _uow.SaveChangesAsync();
            return await MapSubmission(existing);
        }

        var submission = new HymnSubmission
        {
            Id = Guid.NewGuid(),
            HymnId = hymnId,
            StudentId = studentId,
            AudioUrl = audioUrl,
            Status = SubmissionStatus.Submitted
        };

        await _submissionRepo.AddAsync(submission);
        await _uow.SaveChangesAsync();
        return await MapSubmission(submission);
    }

    public async Task<List<HymnSubmissionDto>> GetSubmissionsAsync(string? filter)
    {
        List<HymnSubmission> submissions;
        if (filter == "pending")
            submissions = await _submissionRepo.GetPendingAsync();
        else
            submissions = await _submissionRepo.GetAllAsync();

        var results = new List<HymnSubmissionDto>();
        foreach (var s in submissions)
            results.Add(await MapSubmission(s));
        return results;
    }

    public async Task<HymnSubmissionDto> ReviewSubmissionAsync(Guid submissionId, HymnReviewDto review, Guid reviewerUserId)
    {
        var submission = await _submissionRepo.GetByIdAsync(submissionId)
            ?? throw new InvalidOperationException("Submission not found.");

        if (!Enum.TryParse<SubmissionStatus>(review.Status, true, out var status))
            throw new ArgumentException($"Invalid status: {review.Status}");

        submission.Status = status;
        submission.Grade = review.Grade;
        submission.Feedback = review.Feedback;
        submission.ReviewedByUserId = reviewerUserId;
        submission.ReviewedAt = DateTime.UtcNow;

        _submissionRepo.Update(submission);
        await _uow.SaveChangesAsync();

        return await MapSubmission(submission);
    }

    private async Task<HymnSubmissionDto> MapSubmission(HymnSubmission s)
    {
        var full = await _submissionRepo.GetByIdAsync(s.Id);
        return new HymnSubmissionDto
        {
            Id = full!.Id,
            HymnId = full.HymnId,
            HymnTitle = full.Hymn?.Title ?? "",
            StudentName = full.Student?.User != null
                ? $"{full.Student.User.FirstName} {full.Student.User.MiddleName} {full.Student.User.ThirdName} {full.Student.User.LastName}".Trim()
                : "",
            GradeName = full.Student?.Grade?.Name ?? "",
            AudioUrl = full.AudioUrl,
            Status = full.Status.ToString(),
            Grade = full.Grade,
            Feedback = full.Feedback,
            SubmittedAt = full.SubmittedAt.ToString("o")
        };
    }
}

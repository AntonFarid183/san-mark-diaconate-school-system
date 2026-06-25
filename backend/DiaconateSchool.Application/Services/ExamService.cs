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

public class ExamService : IExamService
{
    private readonly IExamRepository _examRepo;
    private readonly IExamResultRepository _resultRepo;
    private readonly ICertificateRepository _certRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IUnitOfWork _uow;

    public ExamService(
        IExamRepository examRepo,
        IExamResultRepository resultRepo,
        ICertificateRepository certRepo,
        IStudentRepository studentRepo,
        IUnitOfWork uow)
    {
        _examRepo = examRepo;
        _resultRepo = resultRepo;
        _certRepo = certRepo;
        _studentRepo = studentRepo;
        _uow = uow;
    }

    public async Task<List<ExamListItemDto>> GetAllExamsAsync(Guid? gradeId = null, Guid? stageId = null)
    {
        var exams = await _examRepo.GetAllAsync(gradeId, stageId);
        return exams.Select(MapToListItem).ToList();
    }

    public async Task<List<ExamListItemDto>> GetExamsForStudentAsync(Guid gradeId)
    {
        var exams = await _examRepo.GetAllAsync(gradeId);
        return exams.Select(MapToListItem).ToList();
    }

    public async Task<ExamDetailDto?> GetExamByIdAsync(Guid examId)
    {
        var exam = await _examRepo.GetByIdAsync(examId);
        return exam == null ? null : MapToDetail(exam);
    }

    public async Task<ExamDetailDto> CreateExamAsync(CreateExamDto dto, Guid createdByUserId)
    {
        var exam = new Exam
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            GradeId = dto.GradeId,
            StageId = dto.StageId,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        await _examRepo.AddAsync(exam);
        await _uow.SaveChangesAsync();

        var created = await _examRepo.GetByIdAsync(exam.Id);
        return MapToDetail(created!);
    }

    public async Task<ExamDetailDto?> UpdateExamAsync(Guid examId, UpdateExamDto dto)
    {
        var exam = await _examRepo.GetByIdAsync(examId);
        if (exam == null) return null;

        if (dto.Title != null) exam.Title = dto.Title;
        if (dto.Description != null) exam.Description = dto.Description;

        await _examRepo.UpdateAsync(exam);
        await _uow.SaveChangesAsync();

        return MapToDetail(exam);
    }

    public async Task<bool> DeleteExamAsync(Guid examId)
    {
        return await _examRepo.DeleteAsync(examId);
    }

    public async Task<ExamResultDto> EnterResultAsync(Guid examId, EnterExamResultDto dto, Guid enteredByUserId)
    {
        var exam = await _examRepo.GetByIdAsync(examId)
            ?? throw new InvalidOperationException("الاختبار غير موجود.");

        var student = await _studentRepo.GetByIdWithIncludesAsync(dto.StudentId)
            ?? throw new InvalidOperationException("الطالب غير موجود.");

        if (dto.TotalScore <= 0)
            throw new InvalidOperationException("الدرجة الكلية يجب أن تكون أكبر من صفر.");

        decimal percentage = Math.Round(dto.Score / dto.TotalScore * 100, 2);

        var result = new ExamResult
        {
            Id = Guid.NewGuid(),
            ExamId = examId,
            StudentId = dto.StudentId,
            AcademicYear = dto.AcademicYear,
            Period = dto.Period,
            Score = dto.Score,
            TotalScore = dto.TotalScore,
            Percentage = percentage,
            Notes = dto.Notes,
            Status = ExamResultStatus.Pending,
            EnteredByUserId = enteredByUserId,
            EnteredAt = DateTime.UtcNow
        };

        await _resultRepo.AddAsync(result);
        await _uow.SaveChangesAsync();

        return MapResultToDto(result, exam, student);
    }

    public async Task<List<ExamResultDto>> GetResultsByExamAsync(Guid examId)
    {
        var results = await _resultRepo.GetByExamAsync(examId);
        return results.Select(r => MapResultToDto(r, r.Exam, r.Student)).ToList();
    }

    public async Task<List<ExamResultDto>> GetResultsByStudentAsync(Guid studentId)
    {
        var results = await _resultRepo.GetByStudentAsync(studentId);
        return results.Select(r => MapResultToDto(r, r.Exam, r.Student)).ToList();
    }

    public async Task<ExamResultDto?> ApproveResultAsync(Guid resultId, ApproveExamResultDto dto, Guid approvedByUserId)
    {
        var result = await _resultRepo.GetByIdAsync(resultId);
        if (result == null) return null;

        result.Status = dto.Approve ? ExamResultStatus.Approved : ExamResultStatus.Rejected;
        result.ApprovedByUserId = approvedByUserId;
        result.ApprovedAt = DateTime.UtcNow;
        if (dto.Notes != null) result.Notes = dto.Notes;

        if (dto.Approve && result.Certificate == null)
        {
            var student = await _studentRepo.GetByIdWithIncludesAsync(result.StudentId);
            if (student != null)
            {
                var cert = new Certificate
                {
                    Id = Guid.NewGuid(),
                    ExamResultId = resultId,
                    StudentId = result.StudentId,
                    StudentFullName = $"{student.User.FirstName} {student.User.MiddleName} {student.User.ThirdName} {student.User.LastName}",
                    StageName = student.Grade.Stage.Name,
                    GradeName = student.Grade.Name,
                    AcademicYear = result.AcademicYear,
                    ExamTitle = result.Exam.Title,
                    Period = result.Period,
                    Score = result.Score,
                    TotalScore = result.TotalScore,
                    Percentage = result.Percentage,
                    Classification = GetClassification(result.Percentage),
                    IssuedAt = DateTime.UtcNow,
                    IssuedByUserId = approvedByUserId
                };
                await _certRepo.AddAsync(cert);
            }
        }

        await _resultRepo.UpdateAsync(result);
        await _uow.SaveChangesAsync();

        return MapResultToDto(result, result.Exam, result.Student);
    }

    private static string GetClassification(decimal percentage) => percentage switch
    {
        >= 90 => "امتياز",
        >= 80 => "جيد جداً",
        >= 70 => "جيد",
        >= 60 => "مقبول",
        _ => "راسب"
    };

    private static ExamListItemDto MapToListItem(Exam e) => new()
    {
        Id = e.Id,
        Title = e.Title,
        Description = e.Description,
        GradeName = e.Grade?.Name ?? "",
        StageName = e.Stage?.Name ?? "",
        CreatedAt = e.CreatedAt,
        ResultCount = e.Results?.Count ?? 0
    };

    private static ExamDetailDto MapToDetail(Exam e) => new()
    {
        Id = e.Id,
        Title = e.Title,
        Description = e.Description,
        GradeId = e.GradeId,
        GradeName = e.Grade?.Name ?? "",
        StageId = e.StageId,
        StageName = e.Stage?.Name ?? "",
        CreatedAt = e.CreatedAt
    };

    private static ExamResultDto MapResultToDto(ExamResult r, Exam exam, Domain.Entities.Student student) => new()
    {
        Id = r.Id,
        ExamId = r.ExamId,
        ExamTitle = exam.Title,
        StudentId = r.StudentId,
        StudentName = $"{student.User.FirstName} {student.User.MiddleName} {student.User.ThirdName} {student.User.LastName}",
        StudentCode = student.StudentCode,
        AcademicYear = r.AcademicYear,
        Period = r.Period.ToString(),
        Score = r.Score,
        TotalScore = r.TotalScore,
        Percentage = r.Percentage,
        Notes = r.Notes,
        Status = r.Status.ToString(),
        EnteredAt = r.EnteredAt,
        CertificateId = r.Certificate?.Id
    };
}

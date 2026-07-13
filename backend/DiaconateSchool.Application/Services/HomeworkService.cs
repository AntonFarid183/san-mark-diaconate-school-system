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

public class HomeworkService : IHomeworkService
{
    private readonly IHomeworkRepository _repo;
    private readonly IStudentRepository _studentRepo;
    private readonly INotificationService _notificationService;
    private readonly IUnitOfWork _uow;

    public HomeworkService(IHomeworkRepository repo, IStudentRepository studentRepo, INotificationService notificationService, IUnitOfWork uow)
    {
        _repo = repo;
        _studentRepo = studentRepo;
        _notificationService = notificationService;
        _uow = uow;
    }

    public async Task<List<HomeworkSubjectDto>> GetSubjectsAsync()
    {
        var subjects = await _repo.GetSubjectsAsync();
        return subjects.Select(s => new HomeworkSubjectDto { Id = s.Id, Name = s.Name }).ToList();
    }

    public async Task<List<HomeworkListItemDto>> GetAllAsync(Guid? stageId, Guid? gradeId, Guid? subjectId, LessonStatus? status)
    {
        var items = await _repo.GetAllAsync(stageId, gradeId, subjectId, status);
        return items.Select(MapToListItem).ToList();
    }

    public async Task<HomeworkAdminDetailDto?> GetByIdAsync(Guid id)
    {
        var homework = await _repo.GetByIdAsync(id);
        return homework == null ? null : MapToAdminDetail(homework);
    }

    public async Task<(bool Success, string? Error, HomeworkAdminDetailDto? Result)> CreateAsync(
        CreateHomeworkDto dto, Guid createdByUserId)
    {
        if (string.IsNullOrWhiteSpace(dto.Title))
            return (false, "العنوان مطلوب.", null);
        if (string.IsNullOrWhiteSpace(dto.MaterialUrl))
            return (false, "يجب رفع ملف الواجب.", null);
        if (dto.TotalMarks <= 0)
            return (false, "الدرجة الكلية يجب أن تكون أكبر من صفر.", null);
        if (dto.AnswerKey.Count == 0)
            return (false, "يجب تحديد عدد الأسئلة والإجابات الصحيحة.", null);

        if (dto.AnswerKey.Any(a => a < 0 || a > 3))
            return (false, "يجب تحديد إجابة صحيحة (أ، ب، ج، د) لكل سؤال.", null);

        if (!Enum.TryParse<HomeworkMaterialType>(dto.MaterialType, true, out var materialType))
            return (false, "نوع الملف غير صحيح.", null);

        var homework = new Homework
        {
            Id = Guid.NewGuid(),
            Title = dto.Title.Trim(),
            SubjectId = dto.SubjectId,
            StageId = dto.StageId,
            GradeId = dto.GradeId,
            MaterialType = materialType,
            MaterialUrl = dto.MaterialUrl,
            MaterialFileName = dto.MaterialFileName,
            AllowDownload = dto.AllowDownload,
            TotalMarks = dto.TotalMarks,
            Status = LessonStatus.Draft,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Questions = dto.AnswerKey.Select((correctOption, i) => new HomeworkQuestion
            {
                Id = Guid.NewGuid(),
                QuestionNumber = i + 1,
                CorrectOption = correctOption
            }).ToList()
        };

        await _repo.AddAsync(homework);
        await _uow.SaveChangesAsync();

        var saved = await _repo.GetByIdAsync(homework.Id);
        return (true, null, MapToAdminDetail(saved!));
    }

    public async Task<(bool Success, string? Error)> SetStatusAsync(Guid id, LessonStatus status)
    {
        var homework = await _repo.GetByIdAsync(id);
        if (homework == null) return (false, "الواجب غير موجود.");

        var wasPublished = homework.Status == LessonStatus.Published;
        homework.Status = status;
        homework.UpdatedAt = DateTime.UtcNow;
        await _uow.SaveChangesAsync();

        if (status == LessonStatus.Published && !wasPublished)
            await _notificationService.NotifyHomeworkPublishedAsync(homework.Id, homework.GradeId, homework.Title);

        return (true, null);
    }

    public async Task<(bool Success, string? Error)> DeleteAsync(Guid id)
    {
        var homework = await _repo.GetByIdAsync(id);
        if (homework == null) return (false, "الواجب غير موجود.");

        await _repo.DeleteAsync(homework);
        await _uow.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? Error, List<HomeworkGradingRosterItemDto>? Result)> GetGradingRosterAsync(Guid homeworkId)
    {
        var homework = await _repo.GetByIdAsync(homeworkId);
        if (homework == null) return (false, "الواجب غير موجود.", null);

        var students = await _studentRepo.GetAllAsync(1, 1000, null, homework.GradeId);
        var submissions = await _repo.GetSubmissionsByHomeworkIdAsync(homeworkId);
        var byStudentId = submissions.ToDictionary(s => s.StudentId);

        var roster = students.Select(student =>
        {
            byStudentId.TryGetValue(student.Id, out var sub);
            return new HomeworkGradingRosterItemDto
            {
                StudentId = student.Id,
                StudentName = $"{student.User.FirstName} {student.User.MiddleName} {student.User.LastName}".Trim(),
                StudentCode = student.StudentCode,
                ClassName = student.Class?.Name,
                HasSubmitted = sub != null,
                Score = sub?.Score,
                IsManualEntry = sub?.IsManualEntry ?? false
            };
        }).ToList();

        return (true, null, roster);
    }

    public async Task<(bool Success, string? Error)> SetManualGradesAsync(Guid homeworkId, ManualGradeEntryDto dto)
    {
        var homework = await _repo.GetByIdAsync(homeworkId);
        if (homework == null) return (false, "الواجب غير موجود.");

        if (dto.Grades.Count == 0) return (false, "لم يتم تحديد أي درجات.");

        foreach (var grade in dto.Grades)
        {
            if (grade.Score < 0 || grade.Score > homework.TotalMarks)
                return (false, $"الدرجة يجب أن تكون بين 0 و {homework.TotalMarks}.");
        }

        var existing = await _repo.GetSubmissionsByHomeworkIdAsync(homeworkId);
        var byStudentId = existing.ToDictionary(s => s.StudentId);

        foreach (var grade in dto.Grades)
        {
            if (byStudentId.TryGetValue(grade.StudentId, out var submission))
            {
                submission.Score = grade.Score;
                submission.IsManualEntry = true;
            }
            else
            {
                await _repo.AddSubmissionAsync(new HomeworkSubmission
                {
                    Id = Guid.NewGuid(),
                    HomeworkId = homeworkId,
                    StudentId = grade.StudentId,
                    Score = grade.Score,
                    SubmittedAt = DateTime.UtcNow,
                    IsManualEntry = true
                });
            }
        }

        await _uow.SaveChangesAsync();
        return (true, null);
    }

    public async Task<List<StudentHomeworkListItemDto>> GetAvailableForStudentAsync(Guid studentId)
    {
        var student = await _studentRepo.GetByIdWithIncludesAsync(studentId);
        if (student == null) return new List<StudentHomeworkListItemDto>();

        var homeworks = await _repo.GetPublishedForGradeAsync(student.GradeId);

        var result = new List<StudentHomeworkListItemDto>();
        foreach (var hw in homeworks)
        {
            var submission = await _repo.GetSubmissionAsync(hw.Id, studentId);
            result.Add(new StudentHomeworkListItemDto
            {
                Id = hw.Id,
                Title = hw.Title,
                SubjectName = hw.Subject.Name,
                TotalMarks = hw.TotalMarks,
                HasSubmitted = submission != null,
                Score = submission?.Score
            });
        }

        return result;
    }

    public async Task<(bool Success, string? Error, StudentHomeworkDetailDto? Result)> GetForStudentAsync(
        Guid homeworkId, Guid studentId)
    {
        var homework = await _repo.GetByIdAsync(homeworkId);
        if (homework == null || homework.Status != LessonStatus.Published)
            return (false, "الواجب غير موجود.", null);

        var submission = await _repo.GetSubmissionAsync(homeworkId, studentId);
        var answersByQuestion = submission?.Answers.ToDictionary(a => a.HomeworkQuestionId) ?? new Dictionary<Guid, HomeworkAnswer>();

        var dto = new StudentHomeworkDetailDto
        {
            Id = homework.Id,
            Title = homework.Title,
            SubjectName = homework.Subject.Name,
            MaterialType = homework.MaterialType.ToString().ToLowerInvariant(),
            MaterialUrl = homework.MaterialUrl,
            MaterialFileName = homework.MaterialFileName,
            AllowDownload = homework.AllowDownload,
            TotalMarks = homework.TotalMarks,
            HasSubmitted = submission != null,
            Score = submission?.Score,
            Questions = homework.Questions.OrderBy(q => q.QuestionNumber).Select(q =>
            {
                answersByQuestion.TryGetValue(q.Id, out var answer);
                return new StudentHomeworkQuestionDto
                {
                    Id = q.Id,
                    QuestionNumber = q.QuestionNumber,
                    SelectedOption = answer?.SelectedOption,
                    IsCorrect = answer?.IsCorrect,
                    CorrectOption = submission != null ? q.CorrectOption : null
                };
            }).ToList()
        };

        return (true, null, dto);
    }

    public async Task<(bool Success, string? Error, SubmitHomeworkResultDto? Result)> SubmitAsync(
        Guid homeworkId, Guid studentId, SubmitHomeworkDto dto)
    {
        var homework = await _repo.GetByIdAsync(homeworkId);
        if (homework == null || homework.Status != LessonStatus.Published)
            return (false, "الواجب غير موجود.", null);

        var existing = await _repo.GetSubmissionAsync(homeworkId, studentId);
        if (existing != null)
            return (false, "تم تسليم هذا الواجب بالفعل.", null);

        if (dto.Answers.Count != homework.Questions.Count)
            return (false, "يجب الإجابة على جميع الأسئلة.", null);

        var questionsById = homework.Questions.ToDictionary(q => q.Id);
        var answers = new List<HomeworkAnswer>();
        int correctCount = 0;

        foreach (var answerDto in dto.Answers)
        {
            if (!questionsById.TryGetValue(answerDto.QuestionId, out var question))
                return (false, "سؤال غير صحيح.", null);

            var isCorrect = answerDto.SelectedOption == question.CorrectOption;
            if (isCorrect) correctCount++;

            answers.Add(new HomeworkAnswer
            {
                Id = Guid.NewGuid(),
                HomeworkQuestionId = question.Id,
                SelectedOption = answerDto.SelectedOption,
                IsCorrect = isCorrect
            });
        }

        var totalQuestions = homework.Questions.Count;
        var score = totalQuestions == 0 ? 0 : Math.Round(homework.TotalMarks * correctCount / totalQuestions, 2);

        var submission = new HomeworkSubmission
        {
            Id = Guid.NewGuid(),
            HomeworkId = homeworkId,
            StudentId = studentId,
            Score = score,
            SubmittedAt = DateTime.UtcNow,
            Answers = answers
        };

        await _repo.AddSubmissionAsync(submission);
        await _uow.SaveChangesAsync();

        return (true, null, new SubmitHomeworkResultDto
        {
            Score = score,
            TotalMarks = homework.TotalMarks,
            CorrectCount = correctCount,
            TotalQuestions = totalQuestions
        });
    }

    private static HomeworkListItemDto MapToListItem(Homework h) => new()
    {
        Id = h.Id,
        Title = h.Title,
        SubjectName = h.Subject.Name,
        StageName = h.Stage.Name,
        GradeName = h.Grade.Name,
        TotalMarks = h.TotalMarks,
        Status = h.Status.ToString().ToLowerInvariant(),
        QuestionCount = h.Questions.Count,
        CreatedAt = h.CreatedAt
    };

    private static HomeworkAdminDetailDto MapToAdminDetail(Homework h) => new()
    {
        Id = h.Id,
        Title = h.Title,
        SubjectId = h.SubjectId,
        SubjectName = h.Subject.Name,
        StageId = h.StageId,
        GradeId = h.GradeId,
        MaterialType = h.MaterialType.ToString().ToLowerInvariant(),
        MaterialUrl = h.MaterialUrl,
        MaterialFileName = h.MaterialFileName,
        AllowDownload = h.AllowDownload,
        TotalMarks = h.TotalMarks,
        Status = h.Status.ToString().ToLowerInvariant(),
        Questions = h.Questions.OrderBy(q => q.QuestionNumber).Select(q => new HomeworkQuestionAdminDto
        {
            Id = q.Id,
            QuestionNumber = q.QuestionNumber,
            CorrectOption = q.CorrectOption
        }).ToList()
    };
}

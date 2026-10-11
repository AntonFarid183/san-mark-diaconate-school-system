using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using System;
using System.Text.Json;
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
        var pending = await _repo.GetPendingEssayCountsAsync(items.Select(h => h.Id));
        return items.Select(h =>
        {
            var dto = MapToListItem(h);
            dto.PendingEssayCount = pending.GetValueOrDefault(h.Id);
            return dto;
        }).ToList();
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
        if (dto.TotalMarks <= 0)
            return (false, "الدرجة الكلية يجب أن تكون أكبر من صفر.", null);

        if (!Enum.TryParse<HomeworkMaterialType>(dto.MaterialType, true, out var materialType))
            return (false, "نوع الواجب غير صحيح.", null);

        var isTyped = materialType == HomeworkMaterialType.Typed;
        List<HomeworkQuestion> questions;

        if (isTyped)
        {
            var (typedError, typedQuestions) = BuildTypedQuestions(dto.Questions);
            if (typedError != null) return (false, typedError, null);
            questions = typedQuestions!;
        }
        else
        {
            if (string.IsNullOrWhiteSpace(dto.MaterialUrl))
                return (false, "يجب رفع ملف الواجب.", null);
            if (dto.AnswerKey.Count == 0)
                return (false, "يجب تحديد عدد الأسئلة والإجابات الصحيحة.", null);
            if (dto.AnswerKey.Any(a => a < 0 || a > 3))
                return (false, "يجب تحديد إجابة صحيحة (أ، ب، ج، د) لكل سؤال.", null);

            questions = dto.AnswerKey.Select((correctOption, i) => new HomeworkQuestion
            {
                Id = Guid.NewGuid(),
                QuestionNumber = i + 1,
                CorrectOption = correctOption
            }).ToList();
        }

        var homework = new Homework
        {
            Id = Guid.NewGuid(),
            Title = dto.Title.Trim(),
            SubjectId = dto.SubjectId,
            StageId = dto.StageId,
            GradeId = dto.GradeId,
            MaterialType = materialType,
            MaterialUrl = isTyped ? string.Empty : dto.MaterialUrl,
            MaterialFileName = isTyped ? null : dto.MaterialFileName,
            AllowDownload = !isTyped && dto.AllowDownload,
            TotalMarks = dto.TotalMarks,
            Status = LessonStatus.Draft,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Questions = questions
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
                StudentName = student.User.FullName,
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
                Score = submission?.Score,
                SubmittedAt = submission?.SubmittedAt
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

        var weight = QuestionWeight(homework);
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
            HasPendingReview = submission != null && homework.Questions.Any(q =>
                q.Kind == HomeworkQuestionKind.Essay
                && !(answersByQuestion.TryGetValue(q.Id, out var a) && a.EssayScore.HasValue)),
            Questions = homework.Questions.OrderBy(q => q.QuestionNumber).Select(q =>
            {
                answersByQuestion.TryGetValue(q.Id, out var answer);
                var essay = q.Kind == HomeworkQuestionKind.Essay;
                return new StudentHomeworkQuestionDto
                {
                    Id = q.Id,
                    QuestionNumber = q.QuestionNumber,
                    Text = q.Text,
                    Kind = essay ? "essay" : "choice",
                    Options = OptionsOf(q),
                    MaxMark = weight,
                    SelectedOption = essay ? null : answer?.SelectedOption,
                    IsCorrect = essay ? null : answer?.IsCorrect,
                    CorrectOption = (submission != null && !essay) ? q.CorrectOption : null,
                    AnswerText = essay ? answer?.AnswerText : null,
                    AnswerFileUrl = essay ? answer?.AnswerFileUrl : null,
                    AnswerFileName = essay ? answer?.AnswerFileName : null,
                    EssayScore = essay ? answer?.EssayScore : null
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
        var seen = new HashSet<Guid>();

        foreach (var answerDto in dto.Answers)
        {
            if (!questionsById.TryGetValue(answerDto.QuestionId, out var question))
                return (false, "سؤال غير صحيح.", null);
            if (!seen.Add(question.Id))
                return (false, "إجابة مكررة لنفس السؤال.", null);

            if (question.Kind == HomeworkQuestionKind.Essay)
            {
                var text = answerDto.Text?.Trim();
                var hasText = !string.IsNullOrEmpty(text);
                var hasFile = !string.IsNullOrWhiteSpace(answerDto.FileUrl);
                if (!hasText && !hasFile)
                    return (false, $"اكتب إجابة السؤال {question.QuestionNumber} أو ارفع صورة أو ملف PDF.", null);
                if (hasText && text!.Length > MaxEssayAnswerLength)
                    return (false, $"إجابة السؤال {question.QuestionNumber} طويلة جدًا.", null);
                // Only files that came through our own answer-upload endpoint.
                if (hasFile && !answerDto.FileUrl!.StartsWith(AnswerUploadPrefix, StringComparison.Ordinal))
                    return (false, "ملف غير صالح.", null);
                if (hasFile && answerDto.FileUrl!.Contains("..", StringComparison.Ordinal))
                    return (false, "ملف غير صالح.", null);

                answers.Add(new HomeworkAnswer
                {
                    Id = Guid.NewGuid(),
                    HomeworkQuestionId = question.Id,
                    SelectedOption = 0,
                    IsCorrect = false,
                    AnswerText = hasText ? text : null,
                    AnswerFileUrl = hasFile ? answerDto.FileUrl : null,
                    AnswerFileName = hasFile ? Truncate(answerDto.FileName, 200) : null
                });
                continue;
            }

            if (!answerDto.SelectedOption.HasValue)
                return (false, $"اختر إجابة السؤال {question.QuestionNumber}.", null);
            var optionCount = OptionsOf(question)?.Count ?? 4;
            if (answerDto.SelectedOption.Value < 0 || answerDto.SelectedOption.Value >= optionCount)
                return (false, "اختيار غير صحيح.", null);

            var isCorrect = answerDto.SelectedOption.Value == question.CorrectOption;
            answers.Add(new HomeworkAnswer
            {
                Id = Guid.NewGuid(),
                HomeworkQuestionId = question.Id,
                SelectedOption = answerDto.SelectedOption.Value,
                IsCorrect = isCorrect
            });
        }

        var totalQuestions = homework.Questions.Count;
        var correctCount = answers.Count(a => a.IsCorrect);
        var pending = answers.Count(a => a.AnswerFileUrl != null || a.AnswerText != null);

        var submission = new HomeworkSubmission
        {
            Id = Guid.NewGuid(),
            HomeworkId = homeworkId,
            StudentId = studentId,
            SubmittedAt = DateTime.UtcNow,
            Answers = answers
        };
        // Choice questions are marked now; essays add to the score once the admin marks them.
        submission.Score = ComputeScore(homework, answers, questionsById);

        await _repo.AddSubmissionAsync(submission);
        await _uow.SaveChangesAsync();

        return (true, null, new SubmitHomeworkResultDto
        {
            Score = submission.Score,
            TotalMarks = homework.TotalMarks,
            CorrectCount = correctCount,
            TotalQuestions = totalQuestions,
            PendingReviewCount = pending
        });
    }

    // ── Essay review ─────────────────────────────────────────────────

    public async Task<(bool Success, string? Error, List<EssayReviewSubmissionDto>? Result)> GetEssayReviewAsync(Guid homeworkId)
    {
        var homework = await _repo.GetByIdAsync(homeworkId);
        if (homework == null) return (false, "الواجب غير موجود.", null);

        var weight = QuestionWeight(homework);
        var submissions = await _repo.GetSubmissionsWithEssayAnswersAsync(homeworkId);
        var result = submissions.Select(s => new EssayReviewSubmissionDto
        {
            SubmissionId = s.Id,
            StudentId = s.StudentId,
            StudentName = s.Student.User.FullName,
            StudentCode = s.Student.StudentCode,
            SubmittedAt = s.SubmittedAt,
            Score = s.Score,
            Answers = s.Answers
                .Where(a => a.HomeworkQuestion.Kind == HomeworkQuestionKind.Essay)
                .OrderBy(a => a.HomeworkQuestion.QuestionNumber)
                .Select(a => new EssayReviewAnswerDto
                {
                    AnswerId = a.Id,
                    QuestionNumber = a.HomeworkQuestion.QuestionNumber,
                    QuestionText = a.HomeworkQuestion.Text ?? string.Empty,
                    Text = a.AnswerText,
                    FileUrl = a.AnswerFileUrl,
                    FileName = a.AnswerFileName,
                    Score = a.EssayScore,
                    MaxMark = weight
                }).ToList()
        })
        // Unmarked work first, so the admin sees what is waiting.
        .OrderByDescending(s => s.Answers.Any(a => a.Score == null))
        .ThenBy(s => s.SubmittedAt)
        .ToList();

        return (true, null, result);
    }

    public async Task<(bool Success, string? Error, GradeEssayResultDto? Result)> GradeEssayAnswerAsync(Guid answerId, decimal score)
    {
        var answer = await _repo.GetAnswerWithContextAsync(answerId);
        if (answer == null || answer.HomeworkQuestion.Kind != HomeworkQuestionKind.Essay)
            return (false, "الإجابة غير موجودة.", null);

        var submission = answer.HomeworkSubmission;
        var homework = submission.Homework;
        var weight = QuestionWeight(homework);

        if (score < 0 || score > weight)
            return (false, $"الدرجة يجب أن تكون بين 0 و {weight}.", null);

        answer.EssayScore = Math.Round(score, 2);

        var questionsById = homework.Questions.ToDictionary(q => q.Id);
        submission.Score = ComputeScore(homework, submission.Answers, questionsById);
        submission.IsManualEntry = false;

        await _uow.SaveChangesAsync();

        var pending = submission.Answers.Count(a => a.HomeworkQuestion.Kind == HomeworkQuestionKind.Essay && a.EssayScore == null);
        return (true, null, new GradeEssayResultDto
        {
            AnswerScore = answer.EssayScore.Value,
            SubmissionScore = submission.Score,
            PendingReviewCount = pending
        });
    }

    // Every question is worth the same share of the homework's total marks.
    private static decimal QuestionWeight(Homework homework)
        => homework.Questions.Count == 0 ? 0 : Math.Round(homework.TotalMarks / homework.Questions.Count, 2);

    private static decimal ComputeScore(Homework homework, IEnumerable<HomeworkAnswer> answers, Dictionary<Guid, HomeworkQuestion> questionsById)
    {
        var count = homework.Questions.Count;
        if (count == 0) return 0;
        var unit = homework.TotalMarks / count;
        decimal total = 0;
        foreach (var a in answers)
        {
            var isEssay = questionsById.TryGetValue(a.HomeworkQuestionId, out var q) && q.Kind == HomeworkQuestionKind.Essay;
            if (isEssay) total += a.EssayScore ?? 0;
            else if (a.IsCorrect) total += unit;
        }
        return Math.Round(Math.Min(total, homework.TotalMarks), 2);
    }

    private static string? Truncate(string? value, int max)
        => string.IsNullOrEmpty(value) ? value : (value.Length <= max ? value : value[..max]);

    // The answer-upload endpoint stores student files under this prefix.
    private const string AnswerUploadPrefix = "/uploads/homework-answers/";
    private const int MaxEssayAnswerLength = 5000;

    private const int MaxQuestionTextLength = 1000;
    private const int MaxOptionTextLength = 300;
    private const int MinOptions = 2;
    private const int MaxOptions = 10;

    private static (string? Error, List<HomeworkQuestion>? Questions) BuildTypedQuestions(List<TypedQuestionDto> dtos)
    {
        if (dtos.Count == 0)
            return ("أضف سؤالًا واحدًا على الأقل.", null);

        var questions = new List<HomeworkQuestion>();
        for (var i = 0; i < dtos.Count; i++)
        {
            var q = dtos[i];
            var number = i + 1;

            if (string.IsNullOrWhiteSpace(q.Text))
                return ($"نص السؤال {number} مطلوب.", null);
            if (q.Text.Trim().Length > MaxQuestionTextLength)
                return ($"نص السؤال {number} طويل جدًا.", null);
            var isEssay = string.Equals(q.Kind, "essay", StringComparison.OrdinalIgnoreCase);

            if (isEssay)
            {
                // No options, no answer key: the student writes/uploads and the admin marks it.
                questions.Add(new HomeworkQuestion
                {
                    Id = Guid.NewGuid(),
                    QuestionNumber = number,
                    Kind = HomeworkQuestionKind.Essay,
                    Text = q.Text.Trim(),
                    OptionsJson = null,
                    CorrectOption = 0
                });
                continue;
            }

            if (q.Options.Count < MinOptions || q.Options.Count > MaxOptions)
                return ($"السؤال {number} يحتاج إلى من {MinOptions} إلى {MaxOptions} اختيارات.", null);
            if (q.Options.Any(string.IsNullOrWhiteSpace))
                return ($"اكتب نص كل اختيار في السؤال {number} أو احذف الاختيار الفارغ.", null);
            if (q.Options.Any(o => o.Trim().Length > MaxOptionTextLength))
                return ($"أحد اختيارات السؤال {number} طويل جدًا.", null);
            if (q.CorrectOption < 0 || q.CorrectOption >= q.Options.Count)
                return ($"حدد الإجابة الصحيحة للسؤال {number}.", null);

            questions.Add(new HomeworkQuestion
            {
                Id = Guid.NewGuid(),
                QuestionNumber = number,
                Text = q.Text.Trim(),
                OptionsJson = JsonSerializer.Serialize(q.Options.Select(o => o.Trim())),
                CorrectOption = q.CorrectOption
            });
        }

        return (null, questions);
    }

    private static List<string>? OptionsOf(HomeworkQuestion q)
        => q.OptionsJson == null ? null : JsonSerializer.Deserialize<List<string>>(q.OptionsJson);

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
        EssayCount = h.Questions.Count(q => q.Kind == HomeworkQuestionKind.Essay),
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
            Text = q.Text,
            Kind = q.Kind == HomeworkQuestionKind.Essay ? "essay" : "choice",
            Options = OptionsOf(q),
            CorrectOption = q.CorrectOption
        }).ToList()
    };
}

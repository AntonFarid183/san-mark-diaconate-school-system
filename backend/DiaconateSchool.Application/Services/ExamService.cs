using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class ExamService : IExamService
{
    private readonly IExamRepository _examRepo;
    private readonly IExamAttemptRepository _attemptRepo;
    private readonly IUnitOfWork _uow;

    public ExamService(IExamRepository examRepo, IExamAttemptRepository attemptRepo, IUnitOfWork uow)
    {
        _examRepo = examRepo;
        _attemptRepo = attemptRepo;
        _uow = uow;
    }

    public async Task<ExamDto> GetExamAsync(Guid examId)
    {
        var exam = await _examRepo.GetByIdAsync(examId)
            ?? throw new InvalidOperationException("Exam not found.");

        return MapExam(exam);
    }

    public async Task<List<ExamDto>> GetExamsForStudentAsync(Guid gradeId)
    {
        var exams = await _examRepo.GetByGradeAsync(gradeId);
        return exams.Select(MapExam).ToList();
    }

    public async Task<ExamDto> CreateExamAsync(CreateExamDto dto)
    {
        var exam = new Exam
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            DurationMinutes = dto.DurationMinutes,
            TotalPoints = dto.TotalPoints,
            PassingScore = dto.PassingScore,
            GradeId = dto.GradeId,
            StageId = dto.StageId,
            CreatedByUserId = Guid.Empty
        };

        await _examRepo.AddAsync(exam);
        await _uow.SaveChangesAsync();

        return MapExam(exam);
    }

    public async Task<ExamResultDto> SubmitExamAsync(Guid examId, Guid studentId, SubmitExamDto dto)
    {
        var exam = await _examRepo.GetByIdAsync(examId)
            ?? throw new InvalidOperationException("Exam not found.");

        var attempt = new ExamAttempt
        {
            Id = Guid.NewGuid(),
            ExamId = examId,
            StudentId = studentId,
            Status = ExamAttemptStatus.Submitted,
            TotalPoints = exam.TotalPoints,
            SubmittedAt = DateTime.UtcNow
        };

        int totalScore = 0;
        var answers = new List<ExamAnswer>();

        foreach (var question in exam.Questions)
        {
            var userAnswer = dto.Answers.TryGetValue(question.Id.ToString(), out var val) ? val?.ToString() : null;
            bool isCorrect = false;
            int pointsAwarded = 0;

            if (question.Type == QuestionType.MultipleChoice && userAnswer != null)
            {
                if (int.TryParse(userAnswer, out int selectedIndex))
                {
                    isCorrect = selectedIndex == question.CorrectAnswerIndex;
                    pointsAwarded = isCorrect ? question.Points : 0;
                }
            }

            totalScore += pointsAwarded;

            answers.Add(new ExamAnswer
            {
                Id = Guid.NewGuid(),
                ExamAttemptId = attempt.Id,
                QuestionId = question.Id,
                SelectedOptionIndex = question.Type == QuestionType.MultipleChoice ? userAnswer : null,
                EssayAnswer = question.Type == QuestionType.Essay ? userAnswer : null,
                IsCorrect = isCorrect,
                PointsAwarded = pointsAwarded
            });
        }

        attempt.Score = totalScore;
        attempt.Answers = answers;

        await _attemptRepo.AddAsync(attempt);
        await _uow.SaveChangesAsync();

        return BuildResult(exam, attempt);
    }

    public async Task<ExamResultDto> GetExamResultAsync(Guid examId, Guid studentId)
    {
        var exam = await _examRepo.GetByIdAsync(examId)
            ?? throw new InvalidOperationException("Exam not found.");

        var attempt = await _attemptRepo.GetByExamAndStudentAsync(examId, studentId)
            ?? throw new InvalidOperationException("No attempt found.");

        return BuildResult(exam, attempt);
    }

    private static ExamDto MapExam(Exam exam)
    {
        return new ExamDto
        {
            Id = exam.Id,
            Title = exam.Title,
            Description = exam.Description,
            DurationMinutes = exam.DurationMinutes,
            TotalPoints = exam.TotalPoints,
            PassingScore = exam.PassingScore,
            Questions = exam.Questions.Select(q => new ExamQuestionDto
            {
                Id = q.Id,
                Text = q.Text,
                Type = q.Type.ToString(),
                Points = q.Points,
                Options = !string.IsNullOrEmpty(q.Options)
                    ? JsonSerializer.Deserialize<List<string>>(q.Options) ?? new()
                    : new()
            }).ToList()
        };
    }

    private static ExamResultDto BuildResult(Exam exam, ExamAttempt attempt)
    {
        var percentage = attempt.TotalPoints > 0
            ? Math.Round((double)attempt.Score / attempt.TotalPoints * 100, 1)
            : 0;

        return new ExamResultDto
        {
            Id = attempt.Id,
            Title = exam.Title,
            Score = attempt.Score,
            TotalPoints = attempt.TotalPoints,
            Percentage = percentage,
            Passed = percentage >= exam.PassingScore,
            Status = attempt.Status.ToString(),
            Answers = exam.Questions.Select(q =>
            {
                var answer = attempt.Answers.FirstOrDefault(a => a.QuestionId == q.Id);
                return new ExamAnswerReviewDto
                {
                    QuestionId = q.Id,
                    QuestionText = q.Text,
                    Type = q.Type.ToString(),
                    Options = !string.IsNullOrEmpty(q.Options)
                        ? JsonSerializer.Deserialize<List<string>>(q.Options) ?? new()
                        : new(),
                    UserAnswer = q.Type == QuestionType.MultipleChoice
                        ? answer?.SelectedOptionIndex
                        : answer?.EssayAnswer,
                    CorrectAnswerIndex = q.CorrectAnswerIndex,
                    IsCorrect = answer?.IsCorrect,
                    PointsAwarded = answer?.PointsAwarded ?? 0,
                    PointsPossible = q.Points
                };
            }).ToList()
        };
    }
}

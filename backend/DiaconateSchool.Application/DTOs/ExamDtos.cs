using System;
using System.Collections.Generic;

namespace DiaconateSchool.Application.DTOs;

public class ExamDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public int TotalPoints { get; set; }
    public int PassingScore { get; set; }
    public List<ExamQuestionDto> Questions { get; set; } = new();
}

public class ExamQuestionDto
{
    public Guid Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int Points { get; set; }
    public List<string> Options { get; set; } = new();
}

public class CreateExamDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DurationMinutes { get; set; }
    public int TotalPoints { get; set; }
    public int PassingScore { get; set; }
    public Guid GradeId { get; set; }
    public Guid StageId { get; set; }
}

public class SubmitExamDto
{
    public Dictionary<string, object> Answers { get; set; } = new();
}

public class ExamResultDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Score { get; set; }
    public int TotalPoints { get; set; }
    public double Percentage { get; set; }
    public bool Passed { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<ExamAnswerReviewDto> Answers { get; set; } = new();
}

public class ExamAnswerReviewDto
{
    public Guid QuestionId { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public List<string> Options { get; set; } = new();
    public string? UserAnswer { get; set; }
    public int? CorrectAnswerIndex { get; set; }
    public bool? IsCorrect { get; set; }
    public int PointsAwarded { get; set; }
    public int PointsPossible { get; set; }
}

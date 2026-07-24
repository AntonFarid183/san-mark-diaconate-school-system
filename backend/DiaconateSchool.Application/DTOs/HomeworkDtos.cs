using System;
using System.Collections.Generic;

namespace DiaconateSchool.Application.DTOs;

public class HomeworkSubjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

// Admin list view
public class HomeworkListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string StageName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public decimal TotalMarks { get; set; }
    public string Status { get; set; } = string.Empty; // draft / published / archived
    public int QuestionCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Admin detail view — includes correct answers
public class HomeworkAdminDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public Guid StageId { get; set; }
    public Guid GradeId { get; set; }
    public string MaterialType { get; set; } = string.Empty; // pdf / image
    public string MaterialUrl { get; set; } = string.Empty;
    public string? MaterialFileName { get; set; }
    public bool AllowDownload { get; set; }
    public decimal TotalMarks { get; set; }
    public string Status { get; set; } = string.Empty;
    public List<HomeworkQuestionAdminDto> Questions { get; set; } = new();
}

public class HomeworkQuestionAdminDto
{
    public Guid Id { get; set; }
    public int QuestionNumber { get; set; }
    public int CorrectOption { get; set; }
}

public class CreateHomeworkDto
{
    public string Title { get; set; } = string.Empty;
    public Guid SubjectId { get; set; }
    public Guid StageId { get; set; }
    public Guid GradeId { get; set; }
    public string MaterialType { get; set; } = string.Empty; // pdf / image
    public string MaterialUrl { get; set; } = string.Empty;
    public string? MaterialFileName { get; set; }
    public bool AllowDownload { get; set; }
    public decimal TotalMarks { get; set; } = 10;

    // Answer key — index 0 = question 1, value = correct option (0=A..3=D)
    public List<int> AnswerKey { get; set; } = new();
}

// ── Student-facing ──────────────────────────────────────────────────

public class StudentHomeworkListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public decimal TotalMarks { get; set; }
    public bool HasSubmitted { get; set; }
    public decimal? Score { get; set; }
    public DateTime? SubmittedAt { get; set; }
}

public class StudentHomeworkDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string SubjectName { get; set; } = string.Empty;
    public string MaterialType { get; set; } = string.Empty;
    public string MaterialUrl { get; set; } = string.Empty;
    public string? MaterialFileName { get; set; }
    public bool AllowDownload { get; set; }
    public decimal TotalMarks { get; set; }

    public bool HasSubmitted { get; set; }
    public decimal? Score { get; set; }
    public List<StudentHomeworkQuestionDto> Questions { get; set; } = new();
}

public class StudentHomeworkQuestionDto
{
    public Guid Id { get; set; }
    public int QuestionNumber { get; set; }

    // Only populated if the student already submitted
    public int? SelectedOption { get; set; }
    public bool? IsCorrect { get; set; }
    public int? CorrectOption { get; set; }
}

public class SubmitHomeworkDto
{
    public List<HomeworkAnswerDto> Answers { get; set; } = new();
}

public class HomeworkAnswerDto
{
    public Guid QuestionId { get; set; }
    public int SelectedOption { get; set; }
}

public class SubmitHomeworkResultDto
{
    public decimal Score { get; set; }
    public decimal TotalMarks { get; set; }
    public int CorrectCount { get; set; }
    public int TotalQuestions { get; set; }
}

// ── Manual grade entry (admin) ───────────────────────────────────────

// Roster of a homework's grade — lets the admin see who's graded and enter scores
// for students who submitted in person rather than through the website.
public class HomeworkGradingRosterItemDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public string? ClassName { get; set; }
    public bool HasSubmitted { get; set; }
    public decimal? Score { get; set; }
    public bool IsManualEntry { get; set; }
}

public class ManualGradeEntryDto
{
    public List<ManualGradeItemDto> Grades { get; set; } = new();
}

public class ManualGradeItemDto
{
    public Guid StudentId { get; set; }
    public decimal Score { get; set; }
}

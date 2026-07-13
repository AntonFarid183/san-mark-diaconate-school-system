using System;
using System.Collections.Generic;

namespace DiaconateSchool.Application.DTOs;

public class StudentPerformanceResponseDto
{
    public StudentPerformanceSummaryDto Summary { get; set; } = new();

    // Column definitions for the dashboard table — "hymns" plus each HomeworkSubject.
    // Driven by data, not hardcoded, so a new subject shows up automatically.
    public List<PerformanceSubjectDefDto> Subjects { get; set; } = new();
    public List<StudentPerformanceRowDto> Students { get; set; } = new();
}

public class PerformanceSubjectDefDto
{
    public string Key { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
}

public class StudentPerformanceSummaryDto
{
    public int TotalStudents { get; set; }
    public decimal? AverageOverall { get; set; }
    public string? TopStudentName { get; set; }
    public decimal? TopStudentScore { get; set; }
    public int FollowUpCount { get; set; }
    public int MissingHomeworkCount { get; set; }
    public decimal? AverageAttendance { get; set; }
}

public class StudentPerformanceRowDto
{
    public Guid StudentId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public string? ClassName { get; set; }

    // Aligned with StudentPerformanceResponseDto.Subjects (same order/keys)
    public List<SubjectScoreDto> SubjectScores { get; set; } = new();

    public decimal? AttendancePercentage { get; set; }

    // Simple average of every available component (subjects + attendance) — no
    // weighting yet; see PerformanceThresholds for the follow-up cutoff.
    public decimal? OverallPercentage { get; set; }

    public string? WeakestSubjectName { get; set; }
    public bool RequiresFollowUp { get; set; }
    public bool IsMissingHomework { get; set; }
}

public class SubjectScoreDto
{
    public string SubjectKey { get; set; } = string.Empty;
    public decimal? AverageScore { get; set; } // out of MaxScore; null = no data yet
    public decimal MaxScore { get; set; } = 10;
    public string? LatestLabel { get; set; }
    public DateTime? LatestDate { get; set; }
    public List<PerformanceSubmissionDto> History { get; set; } = new();
}

public class PerformanceSubmissionDto
{
    public string Title { get; set; } = string.Empty;
    public decimal Score { get; set; }
    public decimal MaxScore { get; set; }
    public DateTime Date { get; set; }
}

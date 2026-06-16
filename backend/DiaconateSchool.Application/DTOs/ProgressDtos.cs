using System;

namespace DiaconateSchool.Application.DTOs;

public class ProgressHeartbeatDto
{
    public Guid ContentItemId { get; set; }
    public Guid LessonId { get; set; }
    public int Progress { get; set; }
    public int? LastPosition { get; set; }
    public string AccessType { get; set; } = string.Empty;
}

public class LessonProgressDto
{
    public Guid LessonId { get; set; }
    public string LessonTitle { get; set; } = string.Empty;
    public int TotalItems { get; set; }
    public int CompletedItems { get; set; }
    public int ProgressPercent { get; set; }
}

public class StudentDashboardDto
{
    public string StudentName { get; set; } = string.Empty;
    public string StageName { get; set; } = string.Empty;
    public string GradeName { get; set; } = string.Empty;
    public string StudentCode { get; set; } = string.Empty;
    public int OverallProgress { get; set; }
    public int CompletedLessons { get; set; }
    public int TotalLessons { get; set; }
    public double? AverageScore { get; set; }
    public List<LessonProgressDto> RecentLessons { get; set; } = new();
    public int PendingSubmissions { get; set; }
    public int UnreadNotifications { get; set; }
}

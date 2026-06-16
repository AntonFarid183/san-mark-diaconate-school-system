using System;

namespace DiaconateSchool.Application.DTOs;

public class LessonListItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int LessonNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public bool IsPublished { get; set; }
    public int ContentItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class LessonDetailDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int LessonNumber { get; set; }
    public int? WeekNumber { get; set; }
    public string Status { get; set; } = string.Empty;
    public Guid StageId { get; set; }
    public string StageName { get; set; } = string.Empty;
    public Guid GradeId { get; set; }
    public string GradeName { get; set; } = string.Empty;
    public List<ContentItemDto> ContentItems { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class ContentItemDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public int? DurationSeconds { get; set; }
    public int CompletionThreshold { get; set; }
    public bool DownloadAllowed { get; set; }
    public int StudentProgress { get; set; }
    public int? LastPosition { get; set; }
    public bool IsCompleted { get; set; }
}

public class CreateLessonDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int LessonNumber { get; set; }
    public int? WeekNumber { get; set; }
    public Guid StageId { get; set; }
    public Guid GradeId { get; set; }
}

public class UpdateLessonDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public int? LessonNumber { get; set; }
    public int? WeekNumber { get; set; }
}

public class CreateContentItemDto
{
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public string FileUrl { get; set; } = string.Empty;
    public long FileSize { get; set; }
    public int? DurationSeconds { get; set; }
    public int CompletionThreshold { get; set; } = 90;
    public bool DownloadAllowed { get; set; } = true;
}

public class LessonListResponseDto
{
    public List<LessonListItemDto> Lessons { get; set; } = new();
    public int TotalCount { get; set; }
}

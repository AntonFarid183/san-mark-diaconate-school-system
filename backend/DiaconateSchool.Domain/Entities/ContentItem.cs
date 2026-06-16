using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class ContentItem
{
    public Guid Id { get; set; }
    public Guid LessonId { get; set; }
    public Lesson Lesson { get; set; } = null!;
    public required string Title { get; set; }
    public ContentType Type { get; set; }
    public int SortOrder { get; set; }
    public required string FileUrl { get; set; }
    public long FileSize { get; set; }
    public int? DurationSeconds { get; set; }
    public int CompletionThreshold { get; set; } = 90;
    public bool DownloadAllowed { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

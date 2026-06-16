using System;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class ContentAccess
{
    public Guid Id { get; set; }
    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;
    public Guid ContentItemId { get; set; }
    public ContentItem ContentItem { get; set; } = null!;
    public Guid LessonId { get; set; }
    public AccessType AccessType { get; set; }
    public int Progress { get; set; }
    public int? LastPosition { get; set; }
    public DateTime? CompletedAt { get; set; }
    public int AccessCount { get; set; } = 1;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

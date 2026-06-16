using System;
using System.Collections.Generic;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class Lesson
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int LessonNumber { get; set; }
    public int? WeekNumber { get; set; }
    public LessonStatus Status { get; set; } = LessonStatus.Draft;
    public DateTime? PublishedAt { get; set; }

    public Guid StageId { get; set; }
    public Stage Stage { get; set; } = null!;
    public Guid GradeId { get; set; }
    public Grade Grade { get; set; } = null!;
    public Guid CreatedByUserId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ContentItem> ContentItems { get; set; } = new List<ContentItem>();
}

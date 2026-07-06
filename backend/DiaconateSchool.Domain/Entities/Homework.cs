using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;

namespace DiaconateSchool.Domain.Entities;

public class Homework
{
    public Guid Id { get; set; }
    public required string Title { get; set; }

    public Guid SubjectId { get; set; }
    public HomeworkSubject Subject { get; set; } = null!;

    public Guid StageId { get; set; }
    public Stage Stage { get; set; } = null!;

    public Guid GradeId { get; set; }
    public Grade Grade { get; set; } = null!;

    public HomeworkMaterialType MaterialType { get; set; }
    public required string MaterialUrl { get; set; }
    public string? MaterialFileName { get; set; }
    public bool AllowDownload { get; set; } = false;

    public decimal TotalMarks { get; set; } = 10;
    public LessonStatus Status { get; set; } = LessonStatus.Draft;

    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<HomeworkQuestion> Questions { get; set; } = new List<HomeworkQuestion>();
}

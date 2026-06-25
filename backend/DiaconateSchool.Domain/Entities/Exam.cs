using System;
using System.Collections.Generic;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class Exam
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public Guid GradeId { get; set; }
    public Grade Grade { get; set; } = null!;
    public Guid StageId { get; set; }
    public Stage Stage { get; set; } = null!;
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ExamResult> Results { get; set; } = new List<ExamResult>();
}

using System;

namespace DiaconateSchool.Domain.Entities;

public class Announcement
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Body { get; set; }
    public bool IsActive { get; set; } = true;
    public Guid? TargetStageId { get; set; }
    public Stage? TargetStage { get; set; }
    // Narrows TargetStage to one grade (e.g. KG1 only). Null = the whole stage.
    public Guid? TargetGradeId { get; set; }
    public Grade? TargetGrade { get; set; }
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

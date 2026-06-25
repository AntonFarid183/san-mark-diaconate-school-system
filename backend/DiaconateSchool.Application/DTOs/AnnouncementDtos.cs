using System;

namespace DiaconateSchool.Application.DTOs;

public class AnnouncementDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public Guid? TargetStageId { get; set; }
    public string? TargetStageName { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateAnnouncementDto
{
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public Guid? TargetStageId { get; set; }
}

public class UpdateAnnouncementDto
{
    public string? Title { get; set; }
    public string? Body { get; set; }
    public bool? IsActive { get; set; }
    public Guid? TargetStageId { get; set; }
}

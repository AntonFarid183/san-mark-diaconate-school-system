using System;

namespace DiaconateSchool.Application.DTOs;

public class CreatePublicFeedbackDto
{
    public string Name { get; set; } = string.Empty;
    public string? ContactInfo { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class PublicFeedbackItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ContactInfo { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

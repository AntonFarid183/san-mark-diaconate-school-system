namespace DiaconateSchool.Application.DTOs;

public class CreatePublicFeedbackDto
{
    public string Name { get; set; } = string.Empty;
    public string? ContactInfo { get; set; }
    public string Message { get; set; } = string.Empty;
}

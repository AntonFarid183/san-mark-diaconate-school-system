namespace DiaconateSchool.Domain.Entities;

public class PublicFeedback
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? ContactInfo { get; set; }
    public required string Message { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

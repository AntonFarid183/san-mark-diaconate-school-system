using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class Curriculum
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public required string AcademicYear { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public CurriculumStatus Status { get; set; } = CurriculumStatus.Draft;

    public Guid StageId { get; set; }
    public Stage Stage { get; set; } = null!;

    public string? PdfUrl { get; set; }
    public string? PdfFileName { get; set; }
    public long? PdfSizeBytes { get; set; }

    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

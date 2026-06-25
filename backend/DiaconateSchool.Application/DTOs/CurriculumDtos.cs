using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.DTOs;

public class CurriculumDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string AcademicYear { get; set; } = string.Empty;
    public Guid StageId { get; set; }
    public string StageName { get; set; } = string.Empty;
    public string? PdfUrl { get; set; }
    public string? PdfFileName { get; set; }
    public long? PdfSizeBytes { get; set; }
    public CurriculumStatus Status { get; set; }
    public string StatusLabel { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateCurriculumDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string AcademicYear { get; set; } = string.Empty;
    public Guid StageId { get; set; }
    public int DisplayOrder { get; set; } = 0;
}

public class UpdateCurriculumDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string AcademicYear { get; set; } = string.Empty;
    public Guid StageId { get; set; }
    public int DisplayOrder { get; set; }
}

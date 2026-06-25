using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.DTOs;

public class HymnLessonDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid StageId { get; set; }
    public string StageName { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public LessonStatus Status { get; set; }
    public string StatusLabel { get; set; } = string.Empty;

    public HymnVideoType VideoType { get; set; }
    public string? VideoUrl { get; set; }
    public string? VideoFileName { get; set; }

    public HymnLyricsType LyricsType { get; set; }
    public string? LyricsPdfUrl { get; set; }
    public string? LyricsPdfFileName { get; set; }
    public string? LyricsImageUrl { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateHymnLessonDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid StageId { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public string? YouTubeUrl { get; set; }
}

public class UpdateHymnLessonDto
{
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid StageId { get; set; }
    public int DisplayOrder { get; set; }
    public string? YouTubeUrl { get; set; }
}

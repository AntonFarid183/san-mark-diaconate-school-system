using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Domain.Entities;

public class HymnLesson
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? Description { get; set; }
    public int DisplayOrder { get; set; } = 0;
    public LessonStatus Status { get; set; } = LessonStatus.Draft;

    public Guid StageId { get; set; }
    public Stage Stage { get; set; } = null!;

    public Guid? GradeId { get; set; }
    public Grade? Grade { get; set; }

    // Video
    public HymnVideoType VideoType { get; set; } = HymnVideoType.None;
    public string? VideoUrl { get; set; }
    public string? VideoFileName { get; set; }

    // Lyrics
    public HymnLyricsType LyricsType { get; set; } = HymnLyricsType.None;
    public string? LyricsPdfUrl { get; set; }
    public string? LyricsPdfFileName { get; set; }
    public string? LyricsImageUrl { get; set; }

    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

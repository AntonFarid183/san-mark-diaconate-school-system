namespace DiaconateSchool.Domain.Entities;

public class HymnLessonProgress
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid StudentId { get; set; }
    public Student Student { get; set; } = null!;

    public Guid HymnLessonId { get; set; }
    public HymnLesson HymnLesson { get; set; } = null!;

    // The furthest second the student has genuinely watched (server watermark)
    public int MaxReachedPosition { get; set; } = 0;

    // Where they stopped last — used for resume
    public int LastPosition { get; set; } = 0;

    // Cached from first ping so we don't re-fetch the video every time
    public int TotalDuration { get; set; } = 0;

    public decimal WatchedPercent { get; set; } = 0;

    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }

    public DateTime FirstViewedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastViewedAt { get; set; } = DateTime.UtcNow;
}

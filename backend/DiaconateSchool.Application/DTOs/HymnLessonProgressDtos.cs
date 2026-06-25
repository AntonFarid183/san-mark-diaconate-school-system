namespace DiaconateSchool.Application.DTOs;

public class HymnProgressPingDto
{
    public int Position { get; set; }      // current playback position in seconds
    public int Duration { get; set; }      // total video duration in seconds
}

public class HymnProgressResponseDto
{
    public int LastPosition { get; set; }
    public int MaxReachedPosition { get; set; }
    public int TotalDuration { get; set; }
    public decimal WatchedPercent { get; set; }
    public bool IsCompleted { get; set; }
    public int CompletionThreshold { get; set; }
}

public class StudentHymnProgressDto
{
    public Guid HymnLessonId { get; set; }
    public string Title { get; set; } = "";
    public string StageName { get; set; } = "";
    public int LastPosition { get; set; }
    public int MaxReachedPosition { get; set; }
    public int TotalDuration { get; set; }
    public decimal WatchedPercent { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? LastViewedAt { get; set; }
    public bool HasVideo { get; set; }
}

public class HymnLessonProgressStatsDto
{
    public Guid HymnLessonId { get; set; }
    public string Title { get; set; } = "";
    public int TotalStudentsInStage { get; set; }
    public int Started { get; set; }
    public int Completed { get; set; }
    public int NeverStarted { get; set; }
    public decimal AveragePercent { get; set; }
    public decimal CompletionRate { get; set; }
    public List<StudentProgressDetailDto> StudentDetails { get; set; } = [];
}

public class StudentProgressDetailDto
{
    public Guid StudentId { get; set; }
    public string StudentName { get; set; } = "";
    public string StudentCode { get; set; } = "";
    public decimal WatchedPercent { get; set; }
    public bool IsCompleted { get; set; }
    public DateTime? LastViewedAt { get; set; }
    public string Status { get; set; } = "";  // "لم يبدأ" | "جاري" | "مكتمل"
}

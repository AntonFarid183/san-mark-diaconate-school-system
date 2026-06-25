using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.Services;

public class HymnLessonProgressService : IHymnLessonProgressService
{
    private readonly IHymnLessonProgressRepository _progressRepo;
    private readonly IHymnLessonRepository _lessonRepo;
    private readonly IStudentRepository _studentRepo;

    // Server-side tolerance: student may be up to 30s ahead of watermark (buffering lag)
    private const int SeekToleranceSeconds   = 30;
    private const int CompletionThreshold    = 90; // percent

    public HymnLessonProgressService(
        IHymnLessonProgressRepository progressRepo,
        IHymnLessonRepository lessonRepo,
        IStudentRepository studentRepo)
    {
        _progressRepo = progressRepo;
        _lessonRepo   = lessonRepo;
        _studentRepo  = studentRepo;
    }

    public async Task<HymnProgressResponseDto> PingAsync(Guid userId, Guid hymnLessonId, HymnProgressPingDto dto)
    {
        if (dto.Duration <= 0) throw new InvalidOperationException("Invalid video duration.");
        if (dto.Position < 0)  throw new InvalidOperationException("Invalid position.");

        var student = await _studentRepo.GetByUserIdAsync(userId)
            ?? throw new InvalidOperationException("Student profile not found.");

        var existing = await _progressRepo.GetAsync(student.Id, hymnLessonId);

        var progress = existing ?? new HymnLessonProgress
        {
            StudentId      = student.Id,
            HymnLessonId   = hymnLessonId,
            FirstViewedAt  = DateTime.UtcNow,
        };

        // Always update total duration (in case metadata was late)
        progress.TotalDuration = dto.Duration;

        // Clamp reported position to total duration
        var clampedPosition = Math.Min(dto.Position, dto.Duration);

        // Server watermark: only advance if within tolerance of current watermark
        // This is the anti-skip rule — client cannot jump ahead of what it has genuinely played
        if (clampedPosition <= progress.MaxReachedPosition + SeekToleranceSeconds)
            progress.MaxReachedPosition = Math.Max(progress.MaxReachedPosition, clampedPosition);
        // else: position is beyond tolerance — reject advancement, watermark stays

        // Last position is always updated (used for resume — may go backward if they rewound)
        progress.LastPosition = clampedPosition;

        // Recalculate percent based on watermark
        progress.WatchedPercent = Math.Round((decimal)progress.MaxReachedPosition / dto.Duration * 100, 1);
        progress.WatchedPercent = Math.Min(100, progress.WatchedPercent);

        // Completion: once completed, never un-complete
        if (!progress.IsCompleted && progress.WatchedPercent >= CompletionThreshold)
        {
            progress.IsCompleted  = true;
            progress.CompletedAt  = DateTime.UtcNow;
        }

        progress.LastViewedAt = DateTime.UtcNow;

        await _progressRepo.UpsertAsync(progress);

        return ToResponseDto(progress);
    }

    public async Task<HymnProgressResponseDto?> GetProgressAsync(Guid userId, Guid hymnLessonId)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId);
        if (student == null) return null;

        var progress = await _progressRepo.GetAsync(student.Id, hymnLessonId);
        if (progress == null)
            return new HymnProgressResponseDto { CompletionThreshold = CompletionThreshold };

        return ToResponseDto(progress);
    }

    public async Task<List<StudentHymnProgressDto>> GetStudentHymnProgressAsync(Guid userId)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId);
        if (student == null) return [];

        var progresses = await _progressRepo.GetByStudentAsync(student.Id);

        return progresses.Select(p => new StudentHymnProgressDto
        {
            HymnLessonId       = p.HymnLessonId,
            Title              = p.HymnLesson.Title,
            StageName          = p.HymnLesson.Stage?.Name ?? "",
            LastPosition       = p.LastPosition,
            MaxReachedPosition = p.MaxReachedPosition,
            TotalDuration      = p.TotalDuration,
            WatchedPercent     = p.WatchedPercent,
            IsCompleted        = p.IsCompleted,
            LastViewedAt       = p.LastViewedAt,
            HasVideo           = p.HymnLesson.VideoType != HymnVideoType.None,
        }).ToList();
    }

    public async Task<HymnLessonProgressStatsDto> GetLessonStatsAsync(Guid hymnLessonId)
    {
        var lesson = await _lessonRepo.GetByIdAsync(hymnLessonId);
        if (lesson == null) throw new InvalidOperationException("Lesson not found.");

        var stats     = await _progressRepo.GetLessonStatsAsync(hymnLessonId);
        var details   = await _progressRepo.GetByLessonAsync(hymnLessonId);

        return new HymnLessonProgressStatsDto
        {
            HymnLessonId           = hymnLessonId,
            Title                  = lesson.Title,
            TotalStudentsInStage   = stats.TotalStudents,
            Started                = stats.Started,
            Completed              = stats.Completed,
            NeverStarted           = stats.NeverStarted,
            AveragePercent         = stats.AveragePercent,
            CompletionRate         = stats.CompletionRate,
            StudentDetails         = details.Select(p => new StudentProgressDetailDto
            {
                StudentId    = p.StudentId,
                StudentName  = p.Student?.User != null ? $"{p.Student.User.FirstName} {p.Student.User.LastName}" : "",
                StudentCode  = p.Student?.StudentCode ?? "",
                WatchedPercent = p.WatchedPercent,
                IsCompleted  = p.IsCompleted,
                LastViewedAt = p.LastViewedAt,
                Status       = p.IsCompleted ? "مكتمل" : p.WatchedPercent > 0 ? "جاري" : "لم يبدأ",
            }).ToList(),
        };
    }

    public async Task ResetProgressAsync(Guid studentId, Guid hymnLessonId)
    {
        var progress = await _progressRepo.GetAsync(studentId, hymnLessonId);
        if (progress == null) return;

        progress.MaxReachedPosition = 0;
        progress.LastPosition       = 0;
        progress.WatchedPercent     = 0;
        progress.IsCompleted        = false;
        progress.CompletedAt        = null;
        await _progressRepo.UpsertAsync(progress);
    }

    private static HymnProgressResponseDto ToResponseDto(HymnLessonProgress p) => new()
    {
        LastPosition         = p.LastPosition,
        MaxReachedPosition   = p.MaxReachedPosition,
        TotalDuration        = p.TotalDuration,
        WatchedPercent       = p.WatchedPercent,
        IsCompleted          = p.IsCompleted,
        CompletionThreshold  = CompletionThreshold,
    };
}

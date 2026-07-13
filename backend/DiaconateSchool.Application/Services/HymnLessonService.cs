using System.Text.RegularExpressions;
using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.Services;

public class HymnLessonService : IHymnLessonService
{
    private readonly IHymnLessonRepository _repo;
    private readonly INotificationService _notificationService;
    private readonly IUnitOfWork _uow;

    public HymnLessonService(IHymnLessonRepository repo, INotificationService notificationService, IUnitOfWork uow)
    {
        _repo = repo;
        _notificationService = notificationService;
        _uow = uow;
    }

    public async Task<IEnumerable<HymnLessonDto>> GetAllAsync(Guid? stageId, LessonStatus? status)
    {
        var items = await _repo.GetAllAsync(stageId, status);
        return items.Select(Map);
    }

    public async Task<IEnumerable<HymnLessonDto>> GetMyAsync(Guid studentStageId)
    {
        var items = await _repo.GetPublishedForStageAsync(studentStageId);
        return items.Select(Map);
    }

    public async Task<HymnLessonDto?> GetByIdAsync(Guid id)
    {
        var h = await _repo.GetByIdAsync(id);
        return h == null ? null : Map(h);
    }

    public async Task<HymnLessonDto> CreateAsync(CreateHymnLessonDto dto, Guid createdByUserId)
    {
        var lesson = new HymnLesson
        {
            Id = Guid.NewGuid(),
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            StageId = dto.StageId,
            GradeId = dto.GradeId,
            Status = LessonStatus.Draft,
            CreatedByUserId = createdByUserId
        };

        if (!string.IsNullOrWhiteSpace(dto.YouTubeUrl))
        {
            lesson.VideoType = HymnVideoType.YouTubeUrl;
            lesson.VideoUrl = NormalizeYouTubeUrl(dto.YouTubeUrl);
        }

        await _repo.AddAsync(lesson);
        await _uow.SaveChangesAsync();
        var result = await _repo.GetByIdAsync(lesson.Id);
        return Map(result!);
    }

    public async Task<HymnLessonDto?> UpdateAsync(Guid id, UpdateHymnLessonDto dto)
    {
        var h = await _repo.GetByIdAsync(id);
        if (h == null) return null;

        h.Title = dto.Title.Trim();
        h.Description = dto.Description?.Trim();
        h.UpdatedAt = DateTime.UtcNow;

        // Stage can only change in Draft
        if (h.Status == LessonStatus.Draft)
        {
            h.StageId = dto.StageId;
            h.GradeId = dto.GradeId;
        }

        // YouTube URL
        if (!string.IsNullOrWhiteSpace(dto.YouTubeUrl))
        {
            h.VideoType = HymnVideoType.YouTubeUrl;
            h.VideoUrl = NormalizeYouTubeUrl(dto.YouTubeUrl);
            h.VideoFileName = null;
        }
        else if (dto.YouTubeUrl == string.Empty && h.VideoType == HymnVideoType.YouTubeUrl)
        {
            // Explicitly cleared
            h.VideoType = HymnVideoType.None;
            h.VideoUrl = null;
        }

        _repo.Update(h);
        await _uow.SaveChangesAsync();
        var result = await _repo.GetByIdAsync(id);
        return Map(result!);
    }

    public async Task<HymnLessonDto?> SetVideoFileAsync(Guid id, string videoUrl, string videoFileName)
    {
        var h = await _repo.GetByIdAsync(id);
        if (h == null) return null;

        h.VideoType = HymnVideoType.UploadedFile;
        h.VideoUrl = videoUrl;
        h.VideoFileName = videoFileName;
        h.UpdatedAt = DateTime.UtcNow;

        _repo.Update(h);
        await _uow.SaveChangesAsync();
        var result = await _repo.GetByIdAsync(id);
        return Map(result!);
    }

    public async Task<HymnLessonDto?> SetLyricsPdfAsync(Guid id, string pdfUrl, string pdfFileName)
    {
        var h = await _repo.GetByIdAsync(id);
        if (h == null) return null;

        h.LyricsPdfUrl = pdfUrl;
        h.LyricsPdfFileName = pdfFileName;
        h.LyricsType = h.LyricsImageUrl != null ? HymnLyricsType.Both : HymnLyricsType.Pdf;
        h.UpdatedAt = DateTime.UtcNow;

        _repo.Update(h);
        await _uow.SaveChangesAsync();
        var result = await _repo.GetByIdAsync(id);
        return Map(result!);
    }

    public async Task<HymnLessonDto?> SetLyricsImageAsync(Guid id, string imageUrl)
    {
        var h = await _repo.GetByIdAsync(id);
        if (h == null) return null;

        h.LyricsImageUrl = imageUrl;
        h.LyricsType = h.LyricsPdfUrl != null ? HymnLyricsType.Both : HymnLyricsType.Image;
        h.UpdatedAt = DateTime.UtcNow;

        _repo.Update(h);
        await _uow.SaveChangesAsync();
        var result = await _repo.GetByIdAsync(id);
        return Map(result!);
    }

    public async Task<bool> PublishAsync(Guid id)
    {
        var h = await _repo.GetByIdAsync(id);
        if (h == null) return false;

        var wasPublished = h.Status == LessonStatus.Published;
        h.Status = LessonStatus.Published;
        h.UpdatedAt = DateTime.UtcNow;
        _repo.Update(h);
        await _uow.SaveChangesAsync();

        if (!wasPublished)
            await _notificationService.NotifyHymnLessonPublishedAsync(h.Id, h.StageId, h.GradeId, h.Title);

        return true;
    }

    public async Task<bool> ArchiveAsync(Guid id)
    {
        var h = await _repo.GetByIdAsync(id);
        if (h == null) return false;

        h.Status = LessonStatus.Archived;
        h.UpdatedAt = DateTime.UtcNow;
        _repo.Update(h);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var h = await _repo.GetByIdAsync(id);
        if (h == null) return false;
        _repo.Delete(h);
        await _uow.SaveChangesAsync();
        return true;
    }

    // Matches the video ID out of any common YouTube URL shape — watch (any query
    // param order), youtu.be short links, embed, Shorts, and Live — with or without
    // scheme/www, so every format a teacher might paste normalizes to one canonical
    // embed URL instead of silently failing to play.
    private static readonly Regex YouTubeIdRegex = new(
        @"youtube(?:-nocookie)?\.com/(?:watch\?(?:[^#]*&)?v=|embed/|shorts/|live/)([a-zA-Z0-9_-]{6,})|youtu\.be/([a-zA-Z0-9_-]{6,})",
        RegexOptions.IgnoreCase);

    private static string NormalizeYouTubeUrl(string url)
    {
        var trimmed = url.Trim();
        var match = YouTubeIdRegex.Match(trimmed);
        if (!match.Success) return trimmed; // unrecognized format — stored as-is

        var id = match.Groups[1].Success ? match.Groups[1].Value : match.Groups[2].Value;
        return $"https://www.youtube.com/embed/{id}";
    }

    private static HymnLessonDto Map(HymnLesson h) => new()
    {
        Id = h.Id,
        Title = h.Title,
        Description = h.Description,
        StageId = h.StageId,
        StageName = h.Stage?.Name ?? string.Empty,
        GradeId = h.GradeId,
        GradeName = h.Grade?.Name,
        Status = h.Status,
        StatusLabel = h.Status switch
        {
            LessonStatus.Draft => "مسودة",
            LessonStatus.Published => "منشور",
            LessonStatus.Archived => "مؤرشف",
            _ => string.Empty
        },
        VideoType = h.VideoType,
        VideoUrl = h.VideoUrl,
        VideoFileName = h.VideoFileName,
        LyricsType = h.LyricsType,
        LyricsPdfUrl = h.LyricsPdfUrl,
        LyricsPdfFileName = h.LyricsPdfFileName,
        LyricsImageUrl = h.LyricsImageUrl,
        CreatedAt = h.CreatedAt,
        UpdatedAt = h.UpdatedAt
    };
}

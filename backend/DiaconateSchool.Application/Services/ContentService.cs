using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class ContentService : IContentService
{
    private readonly ILessonRepository _lessonRepo;
    private readonly IContentItemRepository _contentItemRepo;
    private readonly IUnitOfWork _uow;

    public ContentService(
        ILessonRepository lessonRepo,
        IContentItemRepository contentItemRepo,
        IUnitOfWork uow)
    {
        _lessonRepo = lessonRepo;
        _contentItemRepo = contentItemRepo;
        _uow = uow;
    }

    public async Task<LessonListResponseDto> GetLessonsAsync(
        Guid? stageId, Guid? gradeId, string? status, int page, int pageSize)
    {
        var skip = (page - 1) * pageSize;
        var lessons = await _lessonRepo.GetFilteredAsync(stageId, gradeId, status, skip, pageSize);
        var total = await _lessonRepo.GetFilteredCountAsync(stageId, gradeId, status);

        return new LessonListResponseDto
        {
            Lessons = lessons.Select(l => new LessonListItemDto
            {
                Id = l.Id,
                Title = l.Title,
                LessonNumber = l.LessonNumber,
                Status = l.Status.ToString(),
                IsPublished = l.Status == LessonStatus.Published,
                ContentItemCount = l.ContentItems?.Count ?? 0,
                CreatedAt = l.CreatedAt
            }).ToList(),
            TotalCount = total
        };
    }

    public async Task<LessonDetailDto?> GetLessonByIdAsync(Guid lessonId)
    {
        var lesson = await _lessonRepo.GetByIdAsync(lessonId);
        if (lesson == null) return null;

        return new LessonDetailDto
        {
            Id = lesson.Id,
            Title = lesson.Title,
            Description = lesson.Description,
            LessonNumber = lesson.LessonNumber,
            WeekNumber = lesson.WeekNumber,
            Status = lesson.Status.ToString(),
            StageId = lesson.StageId,
            StageName = lesson.Stage?.Name ?? string.Empty,
            GradeId = lesson.GradeId,
            GradeName = lesson.Grade?.Name ?? string.Empty,
            ContentItems = lesson.ContentItems?.Select(ci => new ContentItemDto
            {
                Id = ci.Id,
                Title = ci.Title,
                Type = ci.Type.ToString(),
                SortOrder = ci.SortOrder,
                FileUrl = ci.FileUrl,
                FileSize = ci.FileSize,
                DurationSeconds = ci.DurationSeconds,
                CompletionThreshold = ci.CompletionThreshold,
                DownloadAllowed = ci.DownloadAllowed,
                StudentProgress = 0,
                IsCompleted = false
            }).ToList() ?? new List<ContentItemDto>(),
            CreatedAt = lesson.CreatedAt
        };
    }

    public async Task<LessonDetailDto> CreateLessonAsync(CreateLessonDto dto)
    {
        var lesson = new Lesson
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Description = dto.Description,
            LessonNumber = dto.LessonNumber,
            WeekNumber = dto.WeekNumber,
            Status = LessonStatus.Draft,
            StageId = dto.StageId,
            GradeId = dto.GradeId,
            CreatedByUserId = Guid.Empty
        };

        await _lessonRepo.AddAsync(lesson);
        await _uow.SaveChangesAsync();

        return await GetLessonByIdAsync(lesson.Id)
            ?? throw new InvalidOperationException("Failed to retrieve created lesson.");
    }

    public async Task<LessonDetailDto?> UpdateLessonAsync(Guid lessonId, UpdateLessonDto dto)
    {
        var lesson = await _lessonRepo.GetByIdAsync(lessonId);
        if (lesson == null) return null;

        if (dto.Title != null) lesson.Title = dto.Title;
        if (dto.Description != null) lesson.Description = dto.Description;
        if (dto.LessonNumber.HasValue) lesson.LessonNumber = dto.LessonNumber.Value;
        if (dto.WeekNumber.HasValue) lesson.WeekNumber = dto.WeekNumber.Value;

        lesson.UpdatedAt = DateTime.UtcNow;
        _lessonRepo.Update(lesson);
        await _uow.SaveChangesAsync();

        return await GetLessonByIdAsync(lessonId);
    }

    public async Task<bool> PublishLessonAsync(Guid lessonId)
    {
        var lesson = await _lessonRepo.GetByIdAsync(lessonId);
        if (lesson == null) return false;

        lesson.Status = LessonStatus.Published;
        lesson.PublishedAt = DateTime.UtcNow;
        lesson.UpdatedAt = DateTime.UtcNow;
        _lessonRepo.Update(lesson);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ArchiveLessonAsync(Guid lessonId)
    {
        var lesson = await _lessonRepo.GetByIdAsync(lessonId);
        if (lesson == null) return false;

        lesson.Status = LessonStatus.Archived;
        lesson.UpdatedAt = DateTime.UtcNow;
        _lessonRepo.Update(lesson);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteLessonAsync(Guid lessonId)
    {
        var lesson = await _lessonRepo.GetByIdAsync(lessonId);
        if (lesson == null) return false;

        _lessonRepo.Remove(lesson);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<ContentItemDto> AddContentItemAsync(Guid lessonId, CreateContentItemDto dto)
    {
        if (!Enum.TryParse<ContentType>(dto.Type, true, out var contentType))
            throw new ArgumentException($"Invalid content type: {dto.Type}");

        var item = new ContentItem
        {
            Id = Guid.NewGuid(),
            LessonId = lessonId,
            Title = dto.Title,
            Type = contentType,
            SortOrder = dto.SortOrder,
            FileUrl = dto.FileUrl,
            FileSize = dto.FileSize,
            DurationSeconds = dto.DurationSeconds,
            CompletionThreshold = dto.CompletionThreshold,
            DownloadAllowed = dto.DownloadAllowed
        };

        await _contentItemRepo.AddAsync(item);
        await _uow.SaveChangesAsync();

        return new ContentItemDto
        {
            Id = item.Id,
            Title = item.Title,
            Type = item.Type.ToString(),
            SortOrder = item.SortOrder,
            FileUrl = item.FileUrl,
            FileSize = item.FileSize,
            DurationSeconds = item.DurationSeconds,
            CompletionThreshold = item.CompletionThreshold,
            DownloadAllowed = item.DownloadAllowed
        };
    }

    public async Task<bool> RemoveContentItemAsync(Guid contentItemId)
    {
        var item = await _contentItemRepo.GetByIdAsync(contentItemId);
        if (item == null) return false;

        _contentItemRepo.Remove(item);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReorderContentAsync(Guid lessonId, List<Guid> contentItemIds)
    {
        var items = await _contentItemRepo.GetByLessonAsync(lessonId);
        var itemDict = items.ToDictionary(i => i.Id);

        for (int i = 0; i < contentItemIds.Count; i++)
        {
            if (itemDict.TryGetValue(contentItemIds[i], out var item))
            {
                item.SortOrder = i;
                _contentItemRepo.Update(item);
            }
        }

        await _uow.SaveChangesAsync();
        return true;
    }
}

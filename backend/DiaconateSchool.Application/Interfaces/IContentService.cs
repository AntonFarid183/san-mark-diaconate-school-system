using System;
using System.Threading.Tasks;
using DiaconateSchool.Application.DTOs;

namespace DiaconateSchool.Application.Interfaces;

public interface IContentService
{
    Task<LessonListResponseDto> GetLessonsAsync(Guid? stageId, Guid? gradeId, string? status, int page, int pageSize);
    Task<LessonDetailDto?> GetLessonByIdAsync(Guid lessonId);
    Task<LessonDetailDto> CreateLessonAsync(CreateLessonDto dto);
    Task<LessonDetailDto?> UpdateLessonAsync(Guid lessonId, UpdateLessonDto dto);
    Task<bool> PublishLessonAsync(Guid lessonId);
    Task<bool> ArchiveLessonAsync(Guid lessonId);
    Task<bool> DeleteLessonAsync(Guid lessonId);
    Task<ContentItemDto> AddContentItemAsync(Guid lessonId, CreateContentItemDto dto);
    Task<bool> RemoveContentItemAsync(Guid contentItemId);
    Task<bool> ReorderContentAsync(Guid lessonId, List<Guid> contentItemIds);
}

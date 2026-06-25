using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.Interfaces;

public interface IHymnLessonService
{
    Task<IEnumerable<HymnLessonDto>> GetAllAsync(Guid? stageId, LessonStatus? status);
    Task<IEnumerable<HymnLessonDto>> GetMyAsync(Guid studentStageId);
    Task<HymnLessonDto?> GetByIdAsync(Guid id);
    Task<HymnLessonDto> CreateAsync(CreateHymnLessonDto dto, Guid createdByUserId);
    Task<HymnLessonDto?> UpdateAsync(Guid id, UpdateHymnLessonDto dto);
    Task<HymnLessonDto?> SetVideoFileAsync(Guid id, string videoUrl, string videoFileName);
    Task<HymnLessonDto?> SetLyricsPdfAsync(Guid id, string pdfUrl, string pdfFileName);
    Task<HymnLessonDto?> SetLyricsImageAsync(Guid id, string imageUrl);
    Task<bool> PublishAsync(Guid id);
    Task<bool> ArchiveAsync(Guid id);
    Task<bool> DeleteAsync(Guid id);
}

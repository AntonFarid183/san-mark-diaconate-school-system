using DiaconateSchool.Application.DTOs;

namespace DiaconateSchool.Application.Interfaces;

public interface IHymnLessonProgressService
{
    Task<HymnProgressResponseDto> PingAsync(Guid userId, Guid hymnLessonId, HymnProgressPingDto dto);
    Task<HymnProgressResponseDto?> GetProgressAsync(Guid userId, Guid hymnLessonId);
    Task<List<StudentHymnProgressDto>> GetStudentHymnProgressAsync(Guid userId);
    Task<HymnLessonProgressStatsDto> GetLessonStatsAsync(Guid hymnLessonId);
    Task ResetProgressAsync(Guid studentId, Guid hymnLessonId);
}

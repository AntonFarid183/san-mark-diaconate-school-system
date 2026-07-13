using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.Interfaces;

public interface ICurriculumService
{
    Task<IEnumerable<CurriculumDto>> GetAllAsync(Guid? stageId, CurriculumStatus? status, string? academicYear);
    Task<IEnumerable<CurriculumDto>> GetMyAsync(Guid studentStageId);
    Task<IEnumerable<StageWithCurriculumCountDto>> GetPublicStagesAsync(CurriculumSubject subject);
    Task<IEnumerable<CurriculumDto>> GetPublicAsync(CurriculumSubject subject, Guid stageId);
    Task<CurriculumDto?> GetByIdAsync(Guid id);
    Task<CurriculumDto> CreateAsync(CreateCurriculumDto dto, Guid createdByUserId);
    Task<CurriculumDto?> UpdateAsync(Guid id, UpdateCurriculumDto dto);
    Task<CurriculumDto?> SetPdfAsync(Guid id, string pdfUrl, string pdfFileName, long sizeBytes);
    Task<bool> PublishAsync(Guid id);
    Task<bool> ArchiveAsync(Guid id);
    Task<bool> DeleteAsync(Guid id);
}

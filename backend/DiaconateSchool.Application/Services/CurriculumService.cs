using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.Services;

public class CurriculumService : ICurriculumService
{
    private readonly ICurriculumRepository _repo;
    private readonly IUnitOfWork _uow;

    public CurriculumService(ICurriculumRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<IEnumerable<CurriculumDto>> GetAllAsync(Guid? stageId, CurriculumStatus? status, string? academicYear)
    {
        var items = await _repo.GetAllAsync(stageId, status, academicYear);
        return items.Select(Map);
    }

    public async Task<IEnumerable<CurriculumDto>> GetMyAsync(Guid studentStageId)
    {
        var items = await _repo.GetPublishedForStageAsync(studentStageId);
        return items.Select(Map);
    }

    public async Task<CurriculumDto?> GetByIdAsync(Guid id)
    {
        var c = await _repo.GetByIdAsync(id);
        return c == null ? null : Map(c);
    }

    public async Task<CurriculumDto> CreateAsync(CreateCurriculumDto dto, Guid createdByUserId)
    {
        var curriculum = new Curriculum
        {
            Id = Guid.NewGuid(),
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            AcademicYear = dto.AcademicYear.Trim(),
            StageId = dto.StageId,
            GradeId = dto.GradeId,
            Status = CurriculumStatus.Draft,
            CreatedByUserId = createdByUserId
        };
        await _repo.AddAsync(curriculum);
        await _uow.SaveChangesAsync();

        var result = await _repo.GetByIdAsync(curriculum.Id);
        return Map(result!);
    }

    public async Task<CurriculumDto?> UpdateAsync(Guid id, UpdateCurriculumDto dto)
    {
        var c = await _repo.GetByIdAsync(id);
        if (c == null) return null;

        c.Title = dto.Title.Trim();
        c.Description = dto.Description?.Trim();
        c.AcademicYear = dto.AcademicYear.Trim();
        c.StageId = dto.StageId;
        c.GradeId = dto.GradeId;
        c.UpdatedAt = DateTime.UtcNow;

        _repo.Update(c);
        await _uow.SaveChangesAsync();
        var result = await _repo.GetByIdAsync(id);
        return Map(result!);
    }

    public async Task<CurriculumDto?> SetPdfAsync(Guid id, string pdfUrl, string pdfFileName, long sizeBytes)
    {
        var c = await _repo.GetByIdAsync(id);
        if (c == null) return null;

        c.PdfUrl = pdfUrl;
        c.PdfFileName = pdfFileName;
        c.PdfSizeBytes = sizeBytes;
        c.UpdatedAt = DateTime.UtcNow;

        _repo.Update(c);
        await _uow.SaveChangesAsync();
        var result = await _repo.GetByIdAsync(id);
        return Map(result!);
    }

    public async Task<bool> PublishAsync(Guid id)
    {
        var c = await _repo.GetByIdAsync(id);
        if (c == null) return false;
        if (string.IsNullOrEmpty(c.PdfUrl))
            throw new InvalidOperationException("لا يمكن نشر المنهج بدون ملف PDF.");

        c.Status = CurriculumStatus.Published;
        c.UpdatedAt = DateTime.UtcNow;
        _repo.Update(c);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ArchiveAsync(Guid id)
    {
        var c = await _repo.GetByIdAsync(id);
        if (c == null) return false;
        c.Status = CurriculumStatus.Archived;
        c.UpdatedAt = DateTime.UtcNow;
        _repo.Update(c);
        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var c = await _repo.GetByIdAsync(id);
        if (c == null) return false;
        _repo.Delete(c);
        await _uow.SaveChangesAsync();
        return true;
    }

    private static CurriculumDto Map(Curriculum c) => new()
    {
        Id = c.Id,
        Title = c.Title,
        Description = c.Description,
        AcademicYear = c.AcademicYear,
        StageId = c.StageId,
        StageName = c.Stage?.Name ?? string.Empty,
        GradeId = c.GradeId,
        GradeName = c.Grade?.Name,
        PdfUrl = c.PdfUrl,

        PdfFileName = c.PdfFileName,
        PdfSizeBytes = c.PdfSizeBytes,
        Status = c.Status,
        StatusLabel = c.Status switch
        {
            CurriculumStatus.Draft => "مسودة",
            CurriculumStatus.Published => "منشور",
            CurriculumStatus.Archived => "مؤرشف",
            _ => string.Empty
        },
        CreatedAt = c.CreatedAt,
        UpdatedAt = c.UpdatedAt
    };
}

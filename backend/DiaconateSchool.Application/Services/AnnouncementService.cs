using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class AnnouncementService : IAnnouncementService
{
    private readonly IAnnouncementRepository _repo;
    private readonly IUnitOfWork _uow;

    public AnnouncementService(IAnnouncementRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task<List<AnnouncementDto>> GetAllAsync(bool? activeOnly = null, Guid? stageId = null)
    {
        var items = await _repo.GetAllAsync(activeOnly, stageId);
        return items.Select(MapToDto).ToList();
    }

    public async Task<AnnouncementDto?> GetByIdAsync(Guid id)
    {
        var a = await _repo.GetByIdAsync(id);
        return a == null ? null : MapToDto(a);
    }

    public async Task<AnnouncementDto> CreateAsync(CreateAnnouncementDto dto, Guid createdByUserId)
    {
        var a = new Announcement
        {
            Id = Guid.NewGuid(),
            Title = dto.Title,
            Body = dto.Body,
            IsActive = true,
            TargetStageId = dto.TargetStageId,
            CreatedByUserId = createdByUserId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _repo.AddAsync(a);
        await _uow.SaveChangesAsync();
        return MapToDto(a);
    }

    public async Task<AnnouncementDto?> UpdateAsync(Guid id, UpdateAnnouncementDto dto)
    {
        var a = await _repo.GetByIdAsync(id);
        if (a == null) return null;

        if (dto.Title != null) a.Title = dto.Title;
        if (dto.Body != null) a.Body = dto.Body;
        if (dto.IsActive.HasValue) a.IsActive = dto.IsActive.Value;
        if (dto.TargetStageId.HasValue) a.TargetStageId = dto.TargetStageId;
        a.UpdatedAt = DateTime.UtcNow;

        await _repo.UpdateAsync(a);
        await _uow.SaveChangesAsync();
        return MapToDto(a);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        return await _repo.DeleteAsync(id);
    }

    private static AnnouncementDto MapToDto(Announcement a) => new()
    {
        Id = a.Id,
        Title = a.Title,
        Body = a.Body,
        IsActive = a.IsActive,
        TargetStageId = a.TargetStageId,
        TargetStageName = a.TargetStage?.Name,
        CreatedAt = a.CreatedAt,
        UpdatedAt = a.UpdatedAt
    };
}

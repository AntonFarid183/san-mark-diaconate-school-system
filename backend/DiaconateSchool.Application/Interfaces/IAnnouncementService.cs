using DiaconateSchool.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

public interface IAnnouncementService
{
    Task<List<AnnouncementDto>> GetAllAsync(bool? activeOnly = null, Guid? stageId = null);
    Task<AnnouncementDto?> GetByIdAsync(Guid id);
    Task<AnnouncementDto> CreateAsync(CreateAnnouncementDto dto, Guid createdByUserId);
    Task<AnnouncementDto?> UpdateAsync(Guid id, UpdateAnnouncementDto dto);
    Task<bool> DeleteAsync(Guid id);
}

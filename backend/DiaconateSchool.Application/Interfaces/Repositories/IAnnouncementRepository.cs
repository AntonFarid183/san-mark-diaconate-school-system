using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IAnnouncementRepository
{
    Task<List<Announcement>> GetAllAsync(bool? activeOnly = null, Guid? stageId = null);
    Task<Announcement?> GetByIdAsync(Guid id);
    Task AddAsync(Announcement announcement);
    Task UpdateAsync(Announcement announcement);
    Task<bool> DeleteAsync(Guid id);
}

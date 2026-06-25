using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class AnnouncementRepository : IAnnouncementRepository
{
    private readonly ApplicationDbContext _context;

    public AnnouncementRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<Announcement>> GetAllAsync(bool? activeOnly = null, Guid? stageId = null)
    {
        var query = _context.Announcements
            .Include(a => a.TargetStage)
            .AsQueryable();

        if (activeOnly == true) query = query.Where(a => a.IsActive);
        if (stageId.HasValue)
            query = query.Where(a => a.TargetStageId == null || a.TargetStageId == stageId.Value);

        return await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
    }

    public async Task<Announcement?> GetByIdAsync(Guid id)
    {
        return await _context.Announcements
            .Include(a => a.TargetStage)
            .FirstOrDefaultAsync(a => a.Id == id);
    }

    public async Task AddAsync(Announcement announcement)
    {
        await _context.Announcements.AddAsync(announcement);
    }

    public Task UpdateAsync(Announcement announcement)
    {
        _context.Announcements.Update(announcement);
        return Task.CompletedTask;
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var a = await _context.Announcements.FindAsync(id);
        if (a == null) return false;
        _context.Announcements.Remove(a);
        return true;
    }
}

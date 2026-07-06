using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class NotificationRepository : INotificationRepository
{
    private readonly ApplicationDbContext _context;

    public NotificationRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(Notification notification)
        => await _context.Notifications.AddAsync(notification);

    public async Task AddRangeAsync(IEnumerable<Notification> notifications)
        => await _context.Notifications.AddRangeAsync(notifications);

    public async Task<List<Notification>> GetForUserAsync(Guid userId, bool? isRead, int page, int pageSize)
    {
        var query = _context.Notifications.Where(n => n.UserId == userId);
        if (isRead.HasValue) query = query.Where(n => n.IsRead == isRead.Value);

        return await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .ToListAsync();
    }

    public async Task<int> GetCountForUserAsync(Guid userId, bool? isRead)
    {
        var query = _context.Notifications.Where(n => n.UserId == userId);
        if (isRead.HasValue) query = query.Where(n => n.IsRead == isRead.Value);
        return await query.CountAsync();
    }

    public async Task<Notification?> GetByIdAsync(Guid id)
        => await _context.Notifications.FirstOrDefaultAsync(n => n.Id == id);

    public async Task<List<Notification>> GetUnreadForUserAsync(Guid userId)
        => await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();
}

using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface INotificationRepository
{
    Task AddAsync(Notification notification);
    Task AddRangeAsync(IEnumerable<Notification> notifications);
    Task<List<Notification>> GetForUserAsync(Guid userId, bool? isRead, int page, int pageSize);
    Task<int> GetCountForUserAsync(Guid userId, bool? isRead);
    Task<Notification?> GetByIdAsync(Guid id);
    Task<List<Notification>> GetUnreadForUserAsync(Guid userId);
}

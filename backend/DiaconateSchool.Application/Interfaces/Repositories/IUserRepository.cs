using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IUserRepository
{
    Task AddAsync(ApplicationUser user);
    Task<ApplicationUser?> GetByUserNameAsync(string userName);
    Task<ApplicationUser?> GetByIdAsync(Guid id);
    Task UpdateAsync(ApplicationUser user);

    // Broadcast target list for admin-facing notifications (new self-registration,
    // new hymn submission, new homework submission, new feedback, ...).
    Task<List<Guid>> GetAdminUserIdsAsync();
}

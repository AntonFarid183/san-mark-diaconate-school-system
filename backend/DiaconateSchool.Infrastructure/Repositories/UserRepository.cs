using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(ApplicationUser user)
    {
        await _context.Users.AddAsync(user);
    }

    public async Task<ApplicationUser?> GetByUserNameAsync(string userName)
    {
        return await _context.Users
            .Include(u => u.Student).ThenInclude(s => s!.Grade)
            .FirstOrDefaultAsync(u => u.UserName == userName);
    }

    public async Task<ApplicationUser?> GetByIdAsync(Guid id)
    {
        return await _context.Users
            .Include(u => u.Student).ThenInclude(s => s!.Grade)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public Task UpdateAsync(ApplicationUser user)
    {
        _context.Users.Update(user);
        return Task.CompletedTask;
    }
}

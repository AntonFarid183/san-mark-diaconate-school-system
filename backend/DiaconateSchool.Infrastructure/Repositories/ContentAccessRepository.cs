using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class ContentAccessRepository : IContentAccessRepository
{
    private readonly ApplicationDbContext _context;

    public ContentAccessRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ContentAccess?> GetByStudentAndItemAsync(Guid studentId, Guid contentItemId)
    {
        return await _context.ContentAccesses
            .FirstOrDefaultAsync(ca => ca.StudentId == studentId && ca.ContentItemId == contentItemId);
    }

    public async Task AddAsync(ContentAccess access)
    {
        await _context.ContentAccesses.AddAsync(access);
    }

    public void Update(ContentAccess access)
    {
        _context.ContentAccesses.Update(access);
    }
}

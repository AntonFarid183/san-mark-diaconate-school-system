using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class HymnSubmissionRepository : IHymnSubmissionRepository
{
    private readonly ApplicationDbContext _context;

    public HymnSubmissionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<HymnSubmission?> GetByIdAsync(Guid id)
    {
        return await _context.Set<HymnSubmission>()
            .Include(s => s.Hymn)
            .Include(s => s.Student).ThenInclude(s => s.User)
            .Include(s => s.Student).ThenInclude(s => s.Grade)
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<List<HymnSubmission>> GetByHymnAsync(Guid hymnId)
    {
        return await _context.Set<HymnSubmission>()
            .Include(s => s.Student).ThenInclude(s => s.User)
            .Include(s => s.Student).ThenInclude(s => s.Grade)
            .Where(s => s.HymnId == hymnId)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();
    }

    public async Task<List<HymnSubmission>> GetByStudentAsync(Guid studentId)
    {
        return await _context.Set<HymnSubmission>()
            .Include(s => s.Hymn)
            .Where(s => s.StudentId == studentId)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();
    }

    public async Task<List<HymnSubmission>> GetAllAsync()
    {
        return await _context.Set<HymnSubmission>()
            .Include(s => s.Hymn)
            .Include(s => s.Student).ThenInclude(s => s.User)
            .Include(s => s.Student).ThenInclude(s => s.Grade)
            .OrderByDescending(s => s.SubmittedAt)
            .ToListAsync();
    }

    public async Task<List<HymnSubmission>> GetPendingAsync()
    {
        return await _context.Set<HymnSubmission>()
            .Include(s => s.Hymn)
            .Include(s => s.Student).ThenInclude(s => s.User)
            .Include(s => s.Student).ThenInclude(s => s.Grade)
            .Where(s => s.Status == SubmissionStatus.Submitted)
            .OrderBy(s => s.SubmittedAt)
            .ToListAsync();
    }

    public async Task<HymnSubmission?> GetByHymnAndStudentAsync(Guid hymnId, Guid studentId)
    {
        return await _context.Set<HymnSubmission>()
            .Include(s => s.Hymn)
            .FirstOrDefaultAsync(s => s.HymnId == hymnId && s.StudentId == studentId);
    }

    public async Task AddAsync(HymnSubmission submission)
    {
        await _context.Set<HymnSubmission>().AddAsync(submission);
    }

    public void Update(HymnSubmission submission)
    {
        _context.Set<HymnSubmission>().Update(submission);
    }
}

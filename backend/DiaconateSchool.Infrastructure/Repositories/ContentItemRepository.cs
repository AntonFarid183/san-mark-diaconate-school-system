using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Infrastructure.Repositories;

public class ContentItemRepository : IContentItemRepository
{
    private readonly ApplicationDbContext _context;

    public ContentItemRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ContentItem?> GetByIdAsync(Guid id)
    {
        return await _context.ContentItems.FindAsync(id);
    }

    public async Task<List<ContentItem>> GetByLessonAsync(Guid lessonId)
    {
        return await _context.ContentItems
            .Where(ci => ci.LessonId == lessonId)
            .OrderBy(ci => ci.SortOrder)
            .ToListAsync();
    }

    public async Task AddAsync(ContentItem item)
    {
        await _context.ContentItems.AddAsync(item);
    }

    public void Update(ContentItem item)
    {
        _context.ContentItems.Update(item);
    }

    public void Remove(ContentItem item)
    {
        _context.ContentItems.Remove(item);
    }
}

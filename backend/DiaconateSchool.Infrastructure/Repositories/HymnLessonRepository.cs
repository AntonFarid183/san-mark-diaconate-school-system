using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DiaconateSchool.Infrastructure.Repositories;

public class HymnLessonRepository : IHymnLessonRepository
{
    private readonly ApplicationDbContext _ctx;
    public HymnLessonRepository(ApplicationDbContext ctx) => _ctx = ctx;

    public async Task<IEnumerable<HymnLesson>> GetAllAsync(Guid? stageId, LessonStatus? status)
    {
        var q = _ctx.HymnLessons.Include(h => h.Stage).AsQueryable();
        if (stageId.HasValue) q = q.Where(h => h.StageId == stageId);
        if (status.HasValue) q = q.Where(h => h.Status == status);
        return await q.OrderBy(h => h.DisplayOrder).ThenBy(h => h.CreatedAt).ToListAsync();
    }

    public async Task<IEnumerable<HymnLesson>> GetPublishedForStageAsync(Guid stageId) =>
        await _ctx.HymnLessons
            .Include(h => h.Stage)
            .Where(h => h.StageId == stageId && h.Status == LessonStatus.Published)
            .OrderBy(h => h.DisplayOrder)
            .ToListAsync();

    public async Task<HymnLesson?> GetByIdAsync(Guid id) =>
        await _ctx.HymnLessons.Include(h => h.Stage).FirstOrDefaultAsync(h => h.Id == id);

    public async Task AddAsync(HymnLesson lesson) => await _ctx.HymnLessons.AddAsync(lesson);
    public void Update(HymnLesson lesson) => _ctx.HymnLessons.Update(lesson);
    public void Delete(HymnLesson lesson) => _ctx.HymnLessons.Remove(lesson);
}

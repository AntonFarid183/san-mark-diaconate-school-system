using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using DiaconateSchool.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace DiaconateSchool.Infrastructure.Repositories;

public class CurriculumRepository : ICurriculumRepository
{
    private readonly ApplicationDbContext _ctx;
    public CurriculumRepository(ApplicationDbContext ctx) => _ctx = ctx;

    public async Task<IEnumerable<Curriculum>> GetAllAsync(Guid? stageId, CurriculumStatus? status, string? academicYear)
    {
        var q = _ctx.Curriculums.Include(c => c.Stage).Include(c => c.Grade).AsQueryable();
        if (stageId.HasValue) q = q.Where(c => c.StageId == stageId);
        if (status.HasValue) q = q.Where(c => c.Status == status);
        if (!string.IsNullOrEmpty(academicYear)) q = q.Where(c => c.AcademicYear == academicYear);
        return await q.OrderBy(c => c.DisplayOrder).ThenBy(c => c.CreatedAt).ToListAsync();
    }

    public async Task<IEnumerable<Curriculum>> GetPublishedForStageAsync(Guid stageId) =>
        await _ctx.Curriculums
            .Include(c => c.Stage)
            .Include(c => c.Grade)
            .Where(c => c.StageId == stageId && c.Status == CurriculumStatus.Published)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync();

    public async Task<Curriculum?> GetByIdAsync(Guid id) =>
        await _ctx.Curriculums.Include(c => c.Stage).Include(c => c.Grade).FirstOrDefaultAsync(c => c.Id == id);

    public async Task AddAsync(Curriculum curriculum) => await _ctx.Curriculums.AddAsync(curriculum);
    public void Update(Curriculum curriculum) => _ctx.Curriculums.Update(curriculum);
    public void Delete(Curriculum curriculum) => _ctx.Curriculums.Remove(curriculum);
}

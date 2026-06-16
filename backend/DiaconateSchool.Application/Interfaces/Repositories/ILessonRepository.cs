using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface ILessonRepository
{
    Task<Lesson?> GetByIdAsync(Guid id);
    Task<List<Lesson>> GetByGradeAsync(Guid gradeId, bool includePublished = false);
    Task<List<Lesson>> GetFilteredAsync(Guid? stageId, Guid? gradeId, string? status, int skip, int take);
    Task<int> GetFilteredCountAsync(Guid? stageId, Guid? gradeId, string? status);
    Task AddAsync(Lesson lesson);
    void Update(Lesson lesson);
    void Remove(Lesson lesson);
}

using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IHymnRepository
{
    Task<Hymn?> GetByIdAsync(Guid id);
    Task<List<Hymn>> GetByGradeAsync(Guid gradeId);
    Task<List<Hymn>> GetAllAsync();
    Task AddAsync(Hymn hymn);
    void Update(Hymn hymn);
    void Remove(Hymn hymn);
}

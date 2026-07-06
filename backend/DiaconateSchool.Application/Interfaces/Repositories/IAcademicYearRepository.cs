using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IAcademicYearRepository
{
    Task<List<AcademicYear>> GetAllAsync();
    Task<AcademicYear?> GetByIdAsync(Guid id);
    Task<AcademicYear?> GetCurrentAsync();
    Task AddAsync(AcademicYear year);
    Task DeleteAsync(AcademicYear year);
    Task<bool> NameExistsAsync(string name, Guid? excludeId = null);
}

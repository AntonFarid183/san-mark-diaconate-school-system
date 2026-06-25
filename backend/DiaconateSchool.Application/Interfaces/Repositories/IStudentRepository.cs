using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IStudentRepository
{
    Task<bool> ExistsAsync(string firstName, string middleName, string thirdName, string lastName, DateOnly dateOfBirth);
    Task AddAsync(Student student);
    Task<int> GetTotalCountAsync();
    Task<IEnumerable<Grade>> GetGradesByStageAsync(Guid stageId);
    Task<IEnumerable<Stage>> GetAllStagesAsync();
    Task<List<Student>> GetAllAsync(int page, int pageSize, string? nameFilter = null);
    Task<int> GetFilteredCountAsync(string? nameFilter = null);
    Task<Student?> GetByIdWithIncludesAsync(Guid id);
    Task<Student?> GetByUserIdAsync(Guid userId);
    Task UpdateAsync(Student student);
}

using DiaconateSchool.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IStudentRepository
{
    Task<bool> ExistsAsync(string firstName, string secondName, string thirdName, string lastName, DateOnly dateOfBirth);
    Task AddAsync(Student student);
    Task<int> GetTotalCountAsync();
    
    // New: Fetch list of grades for a specific stage (Primary, Prep, etc.)
    Task<IEnumerable<Grade>> GetGradesByStageAsync(DiaconateSchool.Domain.Enums.Stage stage);
}

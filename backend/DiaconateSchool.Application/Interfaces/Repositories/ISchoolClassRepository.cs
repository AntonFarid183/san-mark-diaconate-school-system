using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface ISchoolClassRepository
{
    Task<List<SchoolClass>> GetByGradeAndYearAsync(Guid gradeId, Guid academicYearId);
    Task<SchoolClass?> GetByIdAsync(Guid id);
    Task<bool> NameExistsAsync(Guid gradeId, Guid academicYearId, string name, Guid? excludeId = null);
    Task AddRangeAsync(IEnumerable<SchoolClass> classes);
    Task DeleteRangeAsync(IEnumerable<SchoolClass> classes);
    Task<List<Student>> GetStudentsByGradeAsync(Guid gradeId);
    Task<List<Student>> GetStudentsByGradeForMoveAsync(IEnumerable<Guid> studentIds);
}

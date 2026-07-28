using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface ISchoolClassRepository
{
    Task<List<SchoolClass>> GetByGradeAndYearAsync(Guid gradeId, Guid academicYearId, StudentLevel level);
    Task<List<SchoolClass>> GetByAcademicYearIdAsync(Guid academicYearId);
    Task<SchoolClass?> GetByIdAsync(Guid id);
    Task<bool> NameExistsAsync(Guid gradeId, Guid academicYearId, StudentLevel level, string name, Guid? excludeId = null);
    Task AddRangeAsync(IEnumerable<SchoolClass> classes);
    Task DeleteRangeAsync(IEnumerable<SchoolClass> classes);
    Task<List<Student>> GetStudentsByGradeAsync(Guid gradeId, StudentLevel level);
    Task<List<Student>> GetStudentsByGradeForMoveAsync(IEnumerable<Guid> studentIds);
}

using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface ICurriculumRepository
{
    Task<IEnumerable<Curriculum>> GetAllAsync(Guid? stageId, CurriculumStatus? status, string? academicYear);
    // gradeId (the student's own grade): items with no grade are for the whole stage, the rest only for that grade.
    Task<IEnumerable<Curriculum>> GetPublishedForStageAsync(Guid stageId, Guid? gradeId = null);
    Task<IEnumerable<Curriculum>> GetPublishedBySubjectAsync(CurriculumSubject subject, Guid? stageId);
    Task<Curriculum?> GetByIdAsync(Guid id);
    Task AddAsync(Curriculum curriculum);
    void Update(Curriculum curriculum);
    void Delete(Curriculum curriculum);
}

using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface ICurriculumRepository
{
    Task<IEnumerable<Curriculum>> GetAllAsync(Guid? stageId, CurriculumStatus? status, string? academicYear);
    Task<IEnumerable<Curriculum>> GetPublishedForStageAsync(Guid stageId);
    Task<IEnumerable<Curriculum>> GetPublishedBySubjectAsync(CurriculumSubject subject, Guid? stageId);
    Task<Curriculum?> GetByIdAsync(Guid id);
    Task AddAsync(Curriculum curriculum);
    void Update(Curriculum curriculum);
    void Delete(Curriculum curriculum);
}

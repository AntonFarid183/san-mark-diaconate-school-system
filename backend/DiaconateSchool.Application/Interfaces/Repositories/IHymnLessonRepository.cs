using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IHymnLessonRepository
{
    Task<IEnumerable<HymnLesson>> GetAllAsync(Guid? stageId, LessonStatus? status);
    Task<IEnumerable<HymnLesson>> GetPublishedForStageAsync(Guid stageId);
    Task<HymnLesson?> GetByIdAsync(Guid id);
    Task AddAsync(HymnLesson lesson);
    void Update(HymnLesson lesson);
    void Delete(HymnLesson lesson);
}

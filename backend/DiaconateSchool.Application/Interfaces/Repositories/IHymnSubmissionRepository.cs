using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IHymnSubmissionRepository
{
    Task<HymnSubmission?> GetByStudentAndLessonAsync(Guid studentId, Guid hymnLessonId);
    Task<HymnSubmission?> GetByIdAsync(Guid id);
    Task AddAsync(HymnSubmission submission);
    Task<List<Student>> GetStudentsForRosterAsync(Guid gradeId, Guid? classId);
    Task<List<HymnSubmission>> GetSubmissionsByLessonAsync(Guid hymnLessonId);
    Task<List<HymnSubmission>> GetSubmissionsByStudentIdsAsync(IEnumerable<Guid> studentIds);
    Task<List<HymnSubmission>> GetAllByStudentIdAsync(Guid studentId);
    Task<int> GetPendingCountAsync();
    Task<HymnSubmission?> GetFirstPendingAsync();
}

using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IHymnSubmissionRepository
{
    Task<HymnSubmission?> GetByIdAsync(Guid id);
    Task<List<HymnSubmission>> GetByHymnAsync(Guid hymnId);
    Task<List<HymnSubmission>> GetByStudentAsync(Guid studentId);
    Task<List<HymnSubmission>> GetAllAsync();
    Task<List<HymnSubmission>> GetPendingAsync();
    Task<HymnSubmission?> GetByHymnAndStudentAsync(Guid hymnId, Guid studentId);
    Task AddAsync(HymnSubmission submission);
    void Update(HymnSubmission submission);
}

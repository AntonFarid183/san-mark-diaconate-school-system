using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IExamRepository
{
    Task<Exam?> GetByIdAsync(Guid id);
    Task<List<Exam>> GetByGradeAsync(Guid gradeId);
    Task<List<Exam>> GetAllAsync();
    Task AddAsync(Exam exam);
    void Update(Exam exam);
    void Remove(Exam exam);
}

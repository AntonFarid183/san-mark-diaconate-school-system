using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IExamRepository
{
    Task<List<Exam>> GetAllAsync(Guid? gradeId = null, Guid? stageId = null);
    Task<Exam?> GetByIdAsync(Guid id);
    Task AddAsync(Exam exam);
    Task UpdateAsync(Exam exam);
    Task<bool> DeleteAsync(Guid id);
}

public interface IExamResultRepository
{
    Task<List<ExamResult>> GetByExamAsync(Guid examId);
    Task<List<ExamResult>> GetByStudentAsync(Guid studentId);
    Task<ExamResult?> GetByIdAsync(Guid id);
    Task AddAsync(ExamResult result);
    Task UpdateAsync(ExamResult result);
}

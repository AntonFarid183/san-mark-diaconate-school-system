using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IExamAttemptRepository
{
    Task<ExamAttempt?> GetByIdAsync(Guid id);
    Task<ExamAttempt?> GetByExamAndStudentAsync(Guid examId, Guid studentId);
    Task<List<ExamAttempt>> GetByExamAsync(Guid examId);
    Task<List<ExamAttempt>> GetByStudentAsync(Guid studentId);
    Task AddAsync(ExamAttempt attempt);
    void Update(ExamAttempt attempt);
}

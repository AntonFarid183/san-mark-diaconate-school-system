using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IGradeHistoryRepository
{
    Task<List<GradeHistory>> GetByStudentAsync(Guid studentId);
    Task AddAsync(GradeHistory history);
}

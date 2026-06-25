using DiaconateSchool.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface ICertificateRepository
{
    Task<List<Certificate>> GetByStudentAsync(Guid studentId);
    Task<Certificate?> GetByIdAsync(Guid id);
    Task AddAsync(Certificate certificate);
}

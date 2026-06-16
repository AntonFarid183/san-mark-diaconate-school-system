using DiaconateSchool.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IContentAccessRepository
{
    Task<ContentAccess?> GetByStudentAndItemAsync(Guid studentId, Guid contentItemId);
    Task AddAsync(ContentAccess access);
    void Update(ContentAccess access);
}

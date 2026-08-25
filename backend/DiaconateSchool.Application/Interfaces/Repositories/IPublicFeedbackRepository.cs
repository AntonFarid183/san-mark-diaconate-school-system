using DiaconateSchool.Domain.Entities;

namespace DiaconateSchool.Application.Interfaces.Repositories;

public interface IPublicFeedbackRepository
{
    Task AddAsync(PublicFeedback feedback);
    Task<List<PublicFeedback>> GetAllAsync();
}

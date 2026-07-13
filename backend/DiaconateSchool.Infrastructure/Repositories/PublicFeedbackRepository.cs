using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using DiaconateSchool.Infrastructure.Data;

namespace DiaconateSchool.Infrastructure.Repositories;

public class PublicFeedbackRepository : IPublicFeedbackRepository
{
    private readonly ApplicationDbContext _ctx;
    public PublicFeedbackRepository(ApplicationDbContext ctx) => _ctx = ctx;

    public async Task AddAsync(PublicFeedback feedback) => await _ctx.PublicFeedbacks.AddAsync(feedback);
}

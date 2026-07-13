using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;

namespace DiaconateSchool.Application.Services;

public class PublicFeedbackService : IPublicFeedbackService
{
    private readonly IPublicFeedbackRepository _repo;
    private readonly IUnitOfWork _uow;

    public PublicFeedbackService(IPublicFeedbackRepository repo, IUnitOfWork uow)
    {
        _repo = repo;
        _uow = uow;
    }

    public async Task SubmitAsync(CreatePublicFeedbackDto dto)
    {
        var feedback = new PublicFeedback
        {
            Id = Guid.NewGuid(),
            Name = dto.Name.Trim(),
            ContactInfo = dto.ContactInfo?.Trim(),
            Message = dto.Message.Trim(),
        };
        await _repo.AddAsync(feedback);
        await _uow.SaveChangesAsync();
    }
}

using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Entities;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public class PublicFeedbackService : IPublicFeedbackService
{
    private readonly IPublicFeedbackRepository _repo;
    private readonly INotificationService _notificationService;
    private readonly IUnitOfWork _uow;

    public PublicFeedbackService(IPublicFeedbackRepository repo, INotificationService notificationService, IUnitOfWork uow)
    {
        _repo = repo;
        _notificationService = notificationService;
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

        await _notificationService.NotifyAdminsNewFeedbackAsync(feedback.Id, feedback.Name);
    }

    public async Task<List<PublicFeedbackItemDto>> GetAllAsync()
    {
        var items = await _repo.GetAllAsync();
        return items.Select(f => new PublicFeedbackItemDto
        {
            Id = f.Id,
            Name = f.Name,
            ContactInfo = f.ContactInfo,
            Message = f.Message,
            CreatedAt = f.CreatedAt
        }).ToList();
    }

    public async Task DeleteAsync(Guid id)
    {
        var feedback = await _repo.GetByIdAsync(id);
        if (feedback == null) return;
        _repo.Remove(feedback);
        await _uow.SaveChangesAsync();
    }
}

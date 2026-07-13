using DiaconateSchool.Application.DTOs;

namespace DiaconateSchool.Application.Interfaces;

public interface IPublicFeedbackService
{
    Task SubmitAsync(CreatePublicFeedbackDto dto);
}

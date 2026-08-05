using DiaconateSchool.Application.DTOs;

namespace DiaconateSchool.Application.Interfaces;

public interface ISynaxariumService
{
    Task<SynaxariumDayDto?> GetTodayAsync();
}

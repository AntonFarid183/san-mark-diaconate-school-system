using DiaconateSchool.Application.DTOs;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces;

/// <summary>Aggregate, non-personal numbers shown on the public home page.</summary>
public interface IPublicStatsService
{
    Task<PublicStatsDto> GetAsync();
}

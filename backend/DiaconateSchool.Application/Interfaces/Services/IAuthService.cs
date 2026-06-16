using DiaconateSchool.Application.DTOs;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Interfaces.Services;

public interface IAuthService
{
    Task<AuthResultDto> LoginAsync(LoginDto dto);
    Task<bool> ChangePasswordAsync(ChangePasswordDto dto);
    Task<CurrentUserDto?> GetCurrentUserAsync(string userId);
}

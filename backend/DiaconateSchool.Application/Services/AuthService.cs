using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Application.Interfaces.Services;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

public interface IJwtTokenGenerator
{
    string GenerateToken(Domain.Entities.ApplicationUser user);
}

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtGenerator;
    private readonly IUnitOfWork _uow;

    public AuthService(
        IUserRepository userRepo,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtGenerator,
        IUnitOfWork uow)
    {
        _userRepo = userRepo;
        _passwordHasher = passwordHasher;
        _jwtGenerator = jwtGenerator;
        _uow = uow;
    }

    public async Task<AuthResultDto> LoginAsync(LoginDto dto)
    {
        var user = await _userRepo.GetByUserNameAsync(dto.UserName);
        if (user == null)
            return new AuthResultDto { ErrorMessage = "Invalid credentials." };

        if (!_passwordHasher.VerifyPassword(dto.Password, user.PasswordHash))
            return new AuthResultDto { ErrorMessage = "Invalid credentials." };

        if (user.MustChangePassword)
        {
            return new AuthResultDto
            {
                MustChangePassword = true,
                ErrorMessage = "You must change your password before accessing the system."
            };
        }

        string token = _jwtGenerator.GenerateToken(user);

        return new AuthResultDto { Token = token };
    }

    public async Task<bool> ChangePasswordAsync(ChangePasswordDto dto)
    {
        var user = await _userRepo.GetByUserNameAsync(dto.UserName);
        if (user == null) return false;

        if (!_passwordHasher.VerifyPassword(dto.CurrentPassword, user.PasswordHash))
            return false;

        user.PasswordHash = _passwordHasher.HashPassword(dto.NewPassword);
        user.MustChangePassword = false;

        await _uow.SaveChangesAsync();
        return true;
    }

    public async Task<CurrentUserDto?> GetCurrentUserAsync(string userId)
    {
        if (!Guid.TryParse(userId, out var parsedId))
            return null;

        var user = await _userRepo.GetByIdAsync(parsedId);
        if (user == null) return null;

        return new CurrentUserDto
        {
            Id = user.Id.ToString(),
            UserName = user.UserName,
            Role = user.Role.ToString(),
            FullName = $"{user.FirstName} {user.MiddleName} {user.ThirdName} {user.LastName}",
            MustChangePassword = user.MustChangePassword,
            StudentId = user.Student?.Id.ToString()
        };
    }
}

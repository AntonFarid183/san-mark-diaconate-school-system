using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Application.Interfaces.Services;
using System.Threading.Tasks;

namespace DiaconateSchool.Application.Services;

// A small interface purely for this layer to ask for a token
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
        // 1. Find User by Username
        var user = await _userRepo.GetByUserNameAsync(dto.UserName);
        if (user == null)
            return new AuthResultDto { ErrorMessage = "Invalid credentials." };

        // 2. Verify Password using PBKDF2 hash
        if (!_passwordHasher.VerifyPassword(dto.Password, user.PasswordHash))
            return new AuthResultDto { ErrorMessage = "Invalid credentials." };

        // 3. Enforce Mandatory Password Change
        if (user.RequiresPasswordChange)
        {
            return new AuthResultDto 
            { 
                RequiresPasswordChange = true,
                ErrorMessage = "You must change your password before accessing the system." 
            };
        }

        // 4. All checks passed -> Generate JWT
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
        user.RequiresPasswordChange = false; 

        await _uow.SaveChangesAsync();
        return true;
    }
}

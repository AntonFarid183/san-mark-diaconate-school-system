using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);

        if (!string.IsNullOrEmpty(result.ErrorMessage))
            return BadRequest(new { Message = result.ErrorMessage, RequiresPasswordChange = result.RequiresPasswordChange });

        return Ok(new { Token = result.Token });
    }

    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        bool success = await _authService.ChangePasswordAsync(dto);
        if (!success)
            return BadRequest(new { Message = "Invalid credentials." });

        return Ok(new { Message = "Password permanently changed. You may now log in." });
    }
}

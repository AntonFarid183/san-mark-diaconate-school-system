using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
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

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        // TEMP DIAGNOSTIC — surfaces the real exception for a prod-only 500 we can't
        // otherwise see (no log access from here). Remove after root cause found.
        AuthResultDto result;
        try
        {
            result = await _authService.LoginAsync(dto);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Message = ex.ToString() });
        }

        if (!string.IsNullOrEmpty(result.ErrorMessage))
            return BadRequest(new { Message = result.ErrorMessage, MustChangePassword = result.MustChangePassword });

        return Ok(new { Token = result.Token });
    }

    [AllowAnonymous]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        bool success = await _authService.ChangePasswordAsync(dto);
        if (!success)
            return BadRequest(new { Message = "بيانات الدخول غير صحيحة." });

        return Ok(new { Message = "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن." });
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized();

        var currentUser = await _authService.GetCurrentUserAsync(userId);
        if (currentUser == null)
            return NotFound();

        return Ok(currentUser);
    }
}

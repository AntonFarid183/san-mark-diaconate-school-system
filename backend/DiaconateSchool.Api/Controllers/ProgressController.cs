using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProgressController : ControllerBase
{
    private readonly IProgressService _progressService;

    public ProgressController(IProgressService progressService)
    {
        _progressService = progressService;
    }

    [Authorize]
    [HttpPost("heartbeat")]
    public async Task<IActionResult> RecordHeartbeat([FromBody] ProgressHeartbeatDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        try
        {
            await _progressService.RecordHeartbeatAsync(Guid.Parse(userId), dto);
            return Ok(new { Message = "Progress updated." });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Roles = nameof(Role.Student))]
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var dashboard = await _progressService.GetStudentDashboardAsync(Guid.Parse(userId));
        if (dashboard == null)
            return NotFound(new { Message = "Student profile not found." });

        return Ok(dashboard);
    }

    [Authorize(Roles = nameof(Role.Student))]
    [HttpGet("lessons")]
    public async Task<IActionResult> GetLessonProgress()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var progress = await _progressService.GetLessonProgressAsync(Guid.Parse(userId));
        return Ok(progress);
    }
}

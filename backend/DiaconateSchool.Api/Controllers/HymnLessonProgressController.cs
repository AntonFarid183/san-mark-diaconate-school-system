using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/hymn-lessons")]
public class HymnLessonProgressController : ControllerBase
{
    private readonly IHymnLessonProgressService _service;

    public HymnLessonProgressController(IHymnLessonProgressService service)
    {
        _service = service;
    }

    // POST /api/hymn-lessons/{id}/progress  — student pings every 10s
    [Authorize(Roles = nameof(Role.Student))]
    [HttpPost("{id:guid}/progress")]
    public async Task<IActionResult> Ping(Guid id, [FromBody] HymnProgressPingDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        try
        {
            var result = await _service.PingAsync(Guid.Parse(userId), id, dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // GET /api/hymn-lessons/{id}/progress  — student opens lesson, get resume point
    [Authorize(Roles = nameof(Role.Student))]
    [HttpGet("{id:guid}/progress")]
    public async Task<IActionResult> GetProgress(Guid id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var result = await _service.GetProgressAsync(Guid.Parse(userId), id);
        return Ok(result ?? new HymnProgressResponseDto { CompletionThreshold = 90 });
    }

    // GET /api/hymn-lessons/my-progress  — all hymns progress for current student
    [Authorize(Roles = nameof(Role.Student))]
    [HttpGet("my-progress")]
    public async Task<IActionResult> GetMyProgress()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null) return Unauthorized();

        var result = await _service.GetStudentHymnProgressAsync(Guid.Parse(userId));
        return Ok(result);
    }

    // GET /api/hymn-lessons/{id}/progress-stats  — admin stats for a lesson
    [Authorize(Roles = nameof(Role.Admin))]
    [HttpGet("{id:guid}/progress-stats")]
    public async Task<IActionResult> GetStats(Guid id)
    {
        try
        {
            var result = await _service.GetLessonStatsAsync(id);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // DELETE /api/hymn-lessons/{lessonId}/progress/{studentId}  — admin reset
    [Authorize(Roles = nameof(Role.Admin))]
    [HttpDelete("{lessonId:guid}/progress/{studentId:guid}")]
    public async Task<IActionResult> ResetProgress(Guid lessonId, Guid studentId)
    {
        await _service.ResetProgressAsync(studentId, lessonId);
        return Ok(new { message = "Progress reset." });
    }
}

using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/hymn-submissions")]
public class HymnSubmissionsController : ControllerBase
{
    private readonly IHymnSubmissionService _service;
    private readonly IStudentRepository _studentRepo;

    public HymnSubmissionsController(IHymnSubmissionService service, IStudentRepository studentRepo)
    {
        _service = service;
        _studentRepo = studentRepo;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private async Task<Guid?> GetCurrentStudentIdAsync()
    {
        var student = await _studentRepo.GetByUserIdAsync(GetUserId());
        return student?.Id;
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("mine/{hymnLessonId}")]
    public async Task<IActionResult> GetMine(Guid hymnLessonId)
    {
        var studentId = await GetCurrentStudentIdAsync();
        if (studentId == null) return BadRequest(new { Message = "هذه الميزة متاحة للطلاب فقط." });

        var result = await _service.GetMySubmissionAsync(studentId.Value, hymnLessonId);
        return Ok(result); // null if not submitted yet
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpPost("{hymnLessonId}")]
    public async Task<IActionResult> Submit(Guid hymnLessonId, [FromBody] SubmitHymnRecordingDto dto)
    {
        var studentId = await GetCurrentStudentIdAsync();
        if (studentId == null) return BadRequest(new { Message = "هذه الميزة متاحة للطلاب فقط." });

        var (success, error, result) = await _service.SubmitRecordingAsync(studentId.Value, hymnLessonId, dto);
        return success ? Ok(result) : BadRequest(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("roster")]
    public async Task<IActionResult> GetRoster(
        [FromQuery] Guid hymnLessonId, [FromQuery] Guid gradeId, [FromQuery] Guid? classId)
    {
        var result = await _service.GetRosterAsync(hymnLessonId, gradeId, classId);
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{submissionId}/review")]
    public async Task<IActionResult> Review(Guid submissionId, [FromBody] ReviewHymnSubmissionDto dto)
    {
        var (success, error, result) = await _service.ReviewAsync(submissionId, dto, GetUserId());
        if (!success) return error!.Contains("غير موجود") ? NotFound(new { Message = error }) : BadRequest(new { Message = error });
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("manual")]
    public async Task<IActionResult> SubmitManualScore([FromBody] ManualHymnScoreDto dto)
    {
        var (success, error, result) = await _service.SubmitManualScoreAsync(dto, GetUserId());
        return success ? Ok(result) : BadRequest(new { Message = error });
    }
}

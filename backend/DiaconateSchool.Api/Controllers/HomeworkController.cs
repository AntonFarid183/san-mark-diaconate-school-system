using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Application.Interfaces.Repositories;
using DiaconateSchool.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/homework")]
public class HomeworkController : ControllerBase
{
    private readonly IHomeworkService _service;
    private readonly IStudentRepository _studentRepo;

    public HomeworkController(IHomeworkService service, IStudentRepository studentRepo)
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
    [HttpGet("subjects")]
    public async Task<IActionResult> GetSubjects()
        => Ok(await _service.GetSubjectsAsync());

    // ── Admin ──────────────────────────────────────────────

    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? stageId, [FromQuery] Guid? gradeId, [FromQuery] Guid? subjectId, [FromQuery] LessonStatus? status)
        => Ok(await _service.GetAllAsync(stageId, gradeId, subjectId, status));

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var result = await _service.GetByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateHomeworkDto dto)
    {
        var (success, error, result) = await _service.CreateAsync(dto, GetUserId());
        return success ? Ok(result) : BadRequest(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        var (success, error) = await _service.SetStatusAsync(id, LessonStatus.Published);
        return success ? Ok() : NotFound(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/unpublish")]
    public async Task<IActionResult> Unpublish(Guid id)
    {
        var (success, error) = await _service.SetStatusAsync(id, LessonStatus.Draft);
        return success ? Ok() : NotFound(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var (success, error) = await _service.DeleteAsync(id);
        return success ? NoContent() : NotFound(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("{id}/roster")]
    public async Task<IActionResult> GetGradingRoster(Guid id)
    {
        var (success, error, result) = await _service.GetGradingRosterAsync(id);
        return success ? Ok(result) : NotFound(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/manual-grades")]
    public async Task<IActionResult> SetManualGrades(Guid id, [FromBody] ManualGradeEntryDto dto)
    {
        var (success, error) = await _service.SetManualGradesAsync(id, dto);
        return success ? Ok() : BadRequest(new { Message = error });
    }

    // ── Student ────────────────────────────────────────────

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("my")]
    public async Task<IActionResult> GetMine()
    {
        var studentId = await GetCurrentStudentIdAsync();
        if (studentId == null) return BadRequest(new { Message = "هذه الميزة متاحة للطلاب فقط." });

        return Ok(await _service.GetAvailableForStudentAsync(studentId.Value));
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("my/{id}")]
    public async Task<IActionResult> GetMineById(Guid id)
    {
        var studentId = await GetCurrentStudentIdAsync();
        if (studentId == null) return BadRequest(new { Message = "هذه الميزة متاحة للطلاب فقط." });

        var (success, error, result) = await _service.GetForStudentAsync(id, studentId.Value);
        return success ? Ok(result) : NotFound(new { Message = error });
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpPost("my/{id}/submit")]
    public async Task<IActionResult> Submit(Guid id, [FromBody] SubmitHomeworkDto dto)
    {
        var studentId = await GetCurrentStudentIdAsync();
        if (studentId == null) return BadRequest(new { Message = "هذه الميزة متاحة للطلاب فقط." });

        var (success, error, result) = await _service.SubmitAsync(id, studentId.Value, dto);
        return success ? Ok(result) : BadRequest(new { Message = error });
    }
}

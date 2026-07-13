using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using DiaconateSchool.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/classes")]
[Authorize(Policy = "AdminOnly")]
public class ClassesController : ControllerBase
{
    private readonly ISchoolClassService _service;

    public ClassesController(ISchoolClassService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetClasses([FromQuery] Guid gradeId, [FromQuery] Guid academicYearId, [FromQuery] StudentLevel level = StudentLevel.Level1)
        => Ok(await _service.GetClassesAsync(gradeId, academicYearId, level));

    [HttpGet("distribution-options")]
    public async Task<IActionResult> GetDistributionOptions(
        [FromQuery] Guid gradeId,
        [FromQuery] Guid academicYearId,
        [FromQuery] StudentLevel level = StudentLevel.Level1,
        [FromQuery] int preferredSize = 20)
        => Ok(await _service.GetDistributionOptionsAsync(gradeId, academicYearId, level, preferredSize));

    [HttpPost("distribution/preview")]
    public async Task<IActionResult> PreviewDistribution([FromBody] PreviewDistributionDto dto)
        => Ok(await _service.PreviewDistributionAsync(dto));

    [HttpPost("distribution/apply")]
    public async Task<IActionResult> ApplyDistribution([FromBody] ApplyDistributionDto dto)
    {
        var (success, error, result) = await _service.ApplyDistributionAsync(dto);
        return success ? Ok(result) : BadRequest(new { Message = error });
    }

    [HttpPost("move-students")]
    public async Task<IActionResult> MoveStudents([FromBody] MoveStudentsDto dto)
    {
        var (success, error) = await _service.MoveStudentsAsync(dto);
        return success ? Ok() : BadRequest(new { Message = error });
    }

    [HttpPost("{id}/toggle-lock")]
    public async Task<IActionResult> ToggleLock(Guid id)
    {
        var (success, error) = await _service.ToggleLockAsync(id);
        return success ? Ok() : NotFound(new { Message = error });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var (success, error) = await _service.DeleteClassAsync(id);
        return success ? NoContent() : NotFound(new { Message = error });
    }
}

using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/academic-years")]
public class AcademicYearsController : ControllerBase
{
    private readonly IAcademicYearService _service;

    public AcademicYearsController(IAcademicYearService service)
    {
        _service = service;
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _service.GetAllAsync());

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("current")]
    public async Task<IActionResult> GetCurrent()
    {
        var result = await _service.GetCurrentAsync();
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAcademicYearDto dto)
    {
        var (success, error, result) = await _service.CreateAsync(dto);
        return success ? Ok(result) : BadRequest(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAcademicYearDto dto)
    {
        var (success, error, result) = await _service.UpdateAsync(id, dto);
        if (!success) return error!.Contains("غير موجودة") ? NotFound() : BadRequest(new { Message = error });
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/set-current")]
    public async Task<IActionResult> SetCurrent(Guid id)
    {
        var (success, error) = await _service.SetCurrentAsync(id);
        return success ? Ok() : NotFound(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var (success, error) = await _service.DeleteAsync(id);
        if (!success) return error!.Contains("غير موجودة") ? NotFound() : BadRequest(new { Message = error });
        return NoContent();
    }
}

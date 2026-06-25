using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnnouncementController : ControllerBase
{
    private readonly IAnnouncementService _service;

    public AnnouncementController(IAnnouncementService service)
    {
        _service = service;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? activeOnly, [FromQuery] Guid? stageId)
    {
        var items = await _service.GetAllAsync(activeOnly, stageId);
        return Ok(items);
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        if (!Guid.TryParse(id, out var parsedId))
            return BadRequest(new { Message = "Invalid ID." });

        var item = await _service.GetByIdAsync(parsedId);
        return item == null ? NotFound() : Ok(item);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAnnouncementDto dto)
    {
        var result = await _service.CreateAsync(dto, GetUserId());
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(string id, [FromBody] UpdateAnnouncementDto dto)
    {
        if (!Guid.TryParse(id, out var parsedId))
            return BadRequest(new { Message = "Invalid ID." });

        var result = await _service.UpdateAsync(parsedId, dto);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        if (!Guid.TryParse(id, out var parsedId))
            return BadRequest(new { Message = "Invalid ID." });

        var success = await _service.DeleteAsync(parsedId);
        return success ? Ok(new { Message = "Deleted." }) : NotFound();
    }
}

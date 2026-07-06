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
[Route("api/notifications")]
[Authorize(Policy = "AllAuthenticated")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;
    private readonly IStudentRepository _studentRepo;

    public NotificationsController(INotificationService service, IStudentRepository studentRepo)
    {
        _service = service;
        _studentRepo = studentRepo;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool IsAdmin() => User.IsInRole(nameof(Role.Admin));

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        if (IsAdmin())
            return Ok(await _service.GetAdminSummaryAsync());

        var student = await _studentRepo.GetByUserIdAsync(GetUserId());
        if (student == null) return Ok(new { dynamicItems = Array.Empty<object>(), recentPersistent = Array.Empty<object>(), unreadPersistentCount = 0 });

        return Ok(await _service.GetStudentSummaryAsync(student.Id, GetUserId()));
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? isRead, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var result = await _service.GetPersistentAsync(GetUserId(), isRead, page, pageSize);
        return Ok(result);
    }

    [HttpPost("{id}/read")]
    public async Task<IActionResult> MarkRead(Guid id)
    {
        var success = await _service.MarkReadAsync(id, GetUserId());
        return success ? Ok() : NotFound();
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        await _service.MarkAllReadAsync(GetUserId());
        return Ok();
    }
}

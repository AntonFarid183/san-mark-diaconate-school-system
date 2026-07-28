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
[Route("api/attendance")]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _service;
    private readonly IStudentRepository _studentRepo;

    public AttendanceController(IAttendanceService service, IStudentRepository studentRepo)
    {
        _service = service;
        _studentRepo = studentRepo;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private bool IsAdmin() => User.IsInRole(nameof(Role.Admin));

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("sessions")]
    public async Task<IActionResult> CreateSession([FromBody] CreateAttendanceSessionDto dto)
    {
        try
        {
            var result = await _service.CreateSessionAsync(dto, GetUserId());
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("sessions")]
    public async Task<IActionResult> GetSessions([FromQuery] Guid? gradeId, [FromQuery] Guid? classId, [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] AttendanceSessionStatus? status)
    {
        var result = await _service.GetSessionsAsync(gradeId, classId, from, to, status);
        return Ok(result);
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("sessions/open-for-me")]
    public async Task<IActionResult> GetOpenSessionsForMe()
    {
        var result = await _service.GetOpenSessionsForStudentAsync(GetUserId());
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("sessions/{id}")]
    public async Task<IActionResult> GetSessionById(Guid id)
    {
        var result = await _service.GetSessionByIdAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("sessions/{id}/open")]
    public async Task<IActionResult> OpenSession(Guid id)
    {
        var result = await _service.OpenSessionAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("sessions/{id}/close")]
    public async Task<IActionResult> CloseSession(Guid id)
    {
        var result = await _service.CloseSessionAsync(id);
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("sessions/{id}/records")]
    public async Task<IActionResult> GetSessionRecords(Guid id)
    {
        var result = await _service.GetSessionRecordsAsync(id);
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("sessions/{id}/checkin-manual")]
    public async Task<IActionResult> ManualCheckIn(Guid id, [FromBody] ManualAttendanceDto dto)
    {
        var (success, error, record) = await _service.ManualCheckInAsync(id, dto, GetUserId());
        return success ? Ok(record) : BadRequest(new { Message = error });
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpPost("sessions/{id}/checkin-pin")]
    public async Task<IActionResult> PinCheckIn(Guid id, [FromBody] PinCheckInDto dto)
    {
        var (success, error, record) = await _service.PinCheckInAsync(id, dto.Pin, GetUserId());
        return success ? Ok(record) : BadRequest(new { Message = error });
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("sessions/{id}/mark-bulk")]
    public async Task<IActionResult> BulkMark(Guid id, [FromBody] BulkManualAttendanceDto dto)
    {
        var result = await _service.BulkMarkAsync(id, dto, GetUserId());
        return Ok(result);
    }

    // Simplified secretary flow — pick a class + day, see the roster, mark present/absent, save.
    [Authorize(Policy = "AdminOnly")]
    [HttpGet("class-roster")]
    public async Task<IActionResult> GetClassRoster([FromQuery] Guid classId, [FromQuery] DateOnly date)
    {
        var result = await _service.GetClassRosterAsync(classId, date);
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("record-class")]
    public async Task<IActionResult> RecordClassAttendance([FromBody] RecordClassAttendanceDto dto)
    {
        try
        {
            var result = await _service.RecordClassAttendanceAsync(dto, GetUserId());
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("records")]
    public async Task<IActionResult> GetRecords([FromQuery] Guid? gradeId, [FromQuery] Guid? studentId, [FromQuery] DateTime? from, [FromQuery] DateTime? to, [FromQuery] AttendanceStatus? status)
    {
        var result = await _service.GetRecordsAsync(gradeId, studentId, from, to, status);
        return Ok(result);
    }

    // Self-scoped mirror of the admin "records?studentId=" call, for the student's own
    // home dashboard — reuses GetRecordsAsync exactly, just resolves the id from the JWT.
    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("mine")]
    public async Task<IActionResult> GetMyRecords()
    {
        var student = await _studentRepo.GetByUserIdAsync(GetUserId());
        if (student == null) return BadRequest(new { Message = "هذه الميزة متاحة للطلاب فقط." });

        var result = await _service.GetRecordsAsync(null, student.Id, null, null, null);
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("records/{id}")]
    public async Task<IActionResult> OverrideRecord(Guid id, [FromBody] UpdateAttendanceRecordDto dto)
    {
        var result = await _service.OverrideRecordAsync(id, dto, GetUserId());
        return result == null ? NotFound() : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("records/{id}/audit")]
    public async Task<IActionResult> GetRecordAudit(Guid id)
    {
        var result = await _service.GetAuditLogAsync(id);
        return Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary([FromQuery] Guid? gradeId, [FromQuery] DateTime from, [FromQuery] DateTime to)
    {
        var result = await _service.GetSummaryAsync(gradeId, from, to);
        return Ok(result);
    }

}

using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using DiaconateSchool.Domain.Enums;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentsController : ControllerBase
{
    private readonly IStudentRegistrationService _registrationService;
    private readonly IStudentQueryService _queryService;

    public StudentsController(
        IStudentRegistrationService registrationService,
        IStudentQueryService queryService)
    {
        _registrationService = registrationService;
        _queryService = queryService;
    }

    [Authorize(Policy = "ServantOrAdmin")]
    [HttpGet]
    public async Task<IActionResult> GetStudents(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? name = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        if (pageSize > 50) pageSize = 50;

        var result = await _queryService.GetStudentsAsync(page, pageSize, name);
        return Ok(result);
    }

    [Authorize(Policy = "ServantOrAdmin")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetStudent(string id)
    {
        if (!Guid.TryParse(id, out var parsedId))
            return BadRequest(new { Message = "Invalid student ID format." });

        var student = await _queryService.GetStudentByIdAsync(parsedId);
        if (student == null)
            return NotFound(new { Message = "Student not found." });

        return Ok(student);
    }

    [Authorize(Policy = "ServantOrAdmin")]
    [HttpGet("grades/{stageId}")]
    public async Task<IActionResult> GetGrades(string stageId)
    {
        if (!Guid.TryParse(stageId, out var parsedStageId))
            return BadRequest(new { Message = "Invalid stage ID format." });

        var grades = await _registrationService.GetGradesByStageAsync(parsedStageId);
        var gradeList = grades.ToList();

        if (!gradeList.Any())
            return NotFound(new { Message = "No grades found for the specified stage." });

        return Ok(gradeList.Select(g => new
        {
            g.Id,
            g.Name,
            g.Level
        }));
    }

    [Authorize(Policy = "ServantOrAdmin")]
    [HttpPost("register")]
    public async Task<IActionResult> RegisterStudent([FromBody] RegisterStudentDto dto)
    {
        try
        {
            var result = await _registrationService.RegisterStudentAsync(dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, new { Message = "An unexpected error occurred on the server." });
        }
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized();

        var role = User.FindFirstValue(ClaimTypes.Role);
        if (role != nameof(Role.Student))
            return BadRequest(new { Message = "This endpoint is for students only." });

        var parsedUserId = Guid.Parse(userId);
        var student = await _queryService.GetStudentByUserIdAsync(parsedUserId);
        if (student == null)
            return NotFound(new { Message = "Student profile not found." });

        return Ok(student);
    }
}

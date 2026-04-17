using DiaconateSchool.Application.DTOs;
using DiaconateSchool.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace DiaconateSchool.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StudentsController : ControllerBase
{
    private readonly IStudentRegistrationService _registrationService;

    public StudentsController(IStudentRegistrationService registrationService)
    {
        _registrationService = registrationService;
    }

    /// <summary>
    /// Fetches the list of grades for a specific academic stage.
    /// URL: GET /api/students/grades/{stage}
    /// </summary>
    [HttpGet("grades/{stage}")]
    public async Task<IActionResult> GetGrades(string stage)
    {
        // Try to parse the stage integer or string name
        if (!Enum.TryParse<DiaconateSchool.Domain.Enums.Stage>(stage, true, out var stageEnum))
        {
            if (int.TryParse(stage, out var stageInt))
            {
                stageEnum = (DiaconateSchool.Domain.Enums.Stage)stageInt;
            }
            else
            {
                return BadRequest(new { Message = "Invalid stage value." });
            }
        }

        var grades = await _registrationService.GetGradesByStageAsync(stageEnum);
        var gradeList = grades.ToList();

        if (!gradeList.Any())
        {
            // Logging internally might help, but returning empty or 404 is clear
            return NotFound(new { Message = $"No grades found for stage: {stageEnum}" });
        }
        
        return Ok(gradeList.Select(g => new { 
            g.Id, 
            g.Name, 
            g.Level 
        }));
    }

    /// <summary>
    /// Endpoint for a Servant to register a new student.
    /// URL: POST /api/students/register
    /// </summary>
    [HttpPost("register")]
    public async Task<IActionResult> RegisterStudent([FromBody] RegisterStudentDto dto)
    {
        try
        {
            // Hand the DTO over to our Application layer
            var result = await _registrationService.RegisterStudentAsync(dto);
            
            // Succeeds -> Returns HTTP 200 (OK) with the credentials JSON
            return Ok(result); 
        }
        catch (InvalidOperationException ex)
        {
            // Fails due to duplicate student -> Returns HTTP 400 (Bad Request)
            return BadRequest(new { Message = ex.Message });
        }
        catch (Exception)
        {
            // Fails due to unexpected bug -> Returns HTTP 500 (Server Error)
            return StatusCode(500, new { Message = "An unexpected error occurred on the server." });
        }
    }
}

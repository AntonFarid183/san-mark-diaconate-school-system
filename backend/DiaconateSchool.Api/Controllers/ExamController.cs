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
public class ExamController : ControllerBase
{
    private readonly IExamService _examService;

    public ExamController(IExamService examService)
    {
        _examService = examService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetExam(string id)
    {
        if (!Guid.TryParse(id, out var examId))
            return BadRequest(new { Message = "Invalid exam ID." });

        try
        {
            var result = await _examService.GetExamAsync(examId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("student")]
    public async Task<IActionResult> GetExamsForStudent()
    {
        var gradeIdClaim = User.FindFirst("GradeId")?.Value;
        if (string.IsNullOrEmpty(gradeIdClaim))
            return BadRequest(new { Message = "Grade not found." });

        var result = await _examService.GetExamsForStudentAsync(Guid.Parse(gradeIdClaim));
        return Ok(result);
    }

    [Authorize(Policy = "ServantOrAdmin")]
    [HttpPost]
    public async Task<IActionResult> CreateExam([FromBody] CreateExamDto dto)
    {
        try
        {
            var result = await _examService.CreateExamAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpPost("{id}/submit")]
    public async Task<IActionResult> SubmitExam(string id, [FromBody] SubmitExamDto dto)
    {
        if (!Guid.TryParse(id, out var examId))
            return BadRequest(new { Message = "Invalid exam ID." });

        var studentIdClaim = User.FindFirst("StudentId")?.Value;
        if (string.IsNullOrEmpty(studentIdClaim))
            return BadRequest(new { Message = "Student profile not found." });

        try
        {
            var result = await _examService.SubmitExamAsync(examId, Guid.Parse(studentIdClaim), dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("{id}/results")]
    public async Task<IActionResult> GetResults(string id)
    {
        if (!Guid.TryParse(id, out var examId))
            return BadRequest(new { Message = "Invalid exam ID." });

        var studentIdClaim = User.FindFirst("StudentId")?.Value;
        if (string.IsNullOrEmpty(studentIdClaim))
            return BadRequest(new { Message = "Student profile not found." });

        try
        {
            var result = await _examService.GetExamResultAsync(examId, Guid.Parse(studentIdClaim));
            return Ok(result);
        }
        catch (Exception ex)
        {
            return NotFound(new { Message = ex.Message });
        }
    }
}

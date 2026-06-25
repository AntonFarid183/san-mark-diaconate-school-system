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

    // ── Exam CRUD (Admin) ─────────────────────────────────────────────

    [Authorize(Policy = "AdminOnly")]
    [HttpGet]
    public async Task<IActionResult> GetExams([FromQuery] Guid? gradeId, [FromQuery] Guid? stageId)
    {
        var exams = await _examService.GetAllExamsAsync(gradeId, stageId);
        return Ok(exams);
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetExam(string id)
    {
        if (!Guid.TryParse(id, out var examId))
            return BadRequest(new { Message = "Invalid exam ID." });

        var exam = await _examService.GetExamByIdAsync(examId);
        return exam == null ? NotFound(new { Message = "Exam not found." }) : Ok(exam);
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("my-exams")]
    public async Task<IActionResult> GetMyExams()
    {
        var gradeIdClaim = User.FindFirst("GradeId")?.Value;
        if (string.IsNullOrEmpty(gradeIdClaim))
            return BadRequest(new { Message = "Grade not found in token." });

        var exams = await _examService.GetExamsForStudentAsync(Guid.Parse(gradeIdClaim));
        return Ok(exams);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPost]
    public async Task<IActionResult> CreateExam([FromBody] CreateExamDto dto)
    {
        try
        {
            var result = await _examService.CreateExamAsync(dto, GetUserId());
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateExam(string id, [FromBody] UpdateExamDto dto)
    {
        if (!Guid.TryParse(id, out var examId))
            return BadRequest(new { Message = "Invalid exam ID." });

        var result = await _examService.UpdateExamAsync(examId, dto);
        return result == null ? NotFound(new { Message = "Exam not found." }) : Ok(result);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExam(string id)
    {
        if (!Guid.TryParse(id, out var examId))
            return BadRequest(new { Message = "Invalid exam ID." });

        var success = await _examService.DeleteExamAsync(examId);
        return success ? Ok(new { Message = "Deleted." }) : NotFound(new { Message = "Exam not found." });
    }

    // ── Result entry (Admin) ──────────────────────────────────────────

    [Authorize(Policy = "AdminOnly")]
    [HttpPost("{id}/results")]
    public async Task<IActionResult> EnterResult(string id, [FromBody] EnterExamResultDto dto)
    {
        if (!Guid.TryParse(id, out var examId))
            return BadRequest(new { Message = "Invalid exam ID." });

        try
        {
            var result = await _examService.EnterResultAsync(examId, dto, GetUserId());
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpGet("{id}/results")]
    public async Task<IActionResult> GetResults(string id)
    {
        if (!Guid.TryParse(id, out var examId))
            return BadRequest(new { Message = "Invalid exam ID." });

        var results = await _examService.GetResultsByExamAsync(examId);
        return Ok(results);
    }

    [Authorize(Policy = "AdminOnly")]
    [HttpPut("results/{resultId}/approve")]
    public async Task<IActionResult> ApproveResult(string resultId, [FromBody] ApproveExamResultDto dto)
    {
        if (!Guid.TryParse(resultId, out var parsedId))
            return BadRequest(new { Message = "Invalid result ID." });

        try
        {
            var result = await _examService.ApproveResultAsync(parsedId, dto, GetUserId());
            return result == null ? NotFound(new { Message = "Result not found." }) : Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    // ── Student self-results ──────────────────────────────────────────

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet("my-results")]
    public async Task<IActionResult> GetMyResults()
    {
        var studentIdClaim = User.FindFirst("StudentId")?.Value;
        if (string.IsNullOrEmpty(studentIdClaim))
            return BadRequest(new { Message = "Student profile not found." });

        var results = await _examService.GetResultsByStudentAsync(Guid.Parse(studentIdClaim));
        return Ok(results);
    }
}

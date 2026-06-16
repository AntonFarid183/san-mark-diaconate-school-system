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
public class HymnController : ControllerBase
{
    private readonly IHymnService _hymnService;

    public HymnController(IHymnService hymnService)
    {
        _hymnService = hymnService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role) ?? "";

    [Authorize(Policy = "AllAuthenticated")]
    [HttpGet]
    public async Task<IActionResult> GetHymns()
    {
        if (GetUserRole() == "Student")
        {
            var studentIdClaim = User.FindFirst("StudentId")?.Value;
            var gradeIdClaim = User.FindFirst("GradeId")?.Value;
            if (string.IsNullOrEmpty(gradeIdClaim))
                return BadRequest(new { Message = "Grade not found for user." });

            var result = await _hymnService.GetHymnsForStudentAsync(
                Guid.Parse(studentIdClaim!), Guid.Parse(gradeIdClaim));
            return Ok(result);
        }

        var all = await _hymnService.GetAllHymnsAsync();
        return Ok(all);
    }

    [Authorize(Policy = "ServantOrAdmin")]
    [HttpPost]
    public async Task<IActionResult> CreateHymn([FromBody] CreateHymnDto dto)
    {
        try
        {
            var result = await _hymnService.CreateHymnAsync(dto);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Policy = "AllAuthenticated")]
    [HttpPost("{id}/submit")]
    public async Task<IActionResult> SubmitHymn(string id)
    {
        if (!Guid.TryParse(id, out var hymnId))
            return BadRequest(new { Message = "Invalid hymn ID." });

        var studentIdClaim = User.FindFirst("StudentId")?.Value;
        if (string.IsNullOrEmpty(studentIdClaim))
            return BadRequest(new { Message = "Student profile not found." });

        var file = Request.Form.Files.GetFile("audio");
        if (file == null)
            return BadRequest(new { Message = "Audio file is required." });

        // TODO: Save file to disk/cloud and return URL
        var audioUrl = $"/uploads/hymns/{hymnId}/{Guid.NewGuid()}.webm";

        try
        {
            var result = await _hymnService.SubmitHymnAsync(hymnId, Guid.Parse(studentIdClaim), audioUrl);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }

    [Authorize(Policy = "ServantOrAdmin")]
    [HttpGet("submissions")]
    public async Task<IActionResult> GetSubmissions([FromQuery] string? filter)
    {
        var result = await _hymnService.GetSubmissionsAsync(filter);
        return Ok(result);
    }

    [Authorize(Policy = "ServantOrAdmin")]
    [HttpPut("submissions/{id}/review")]
    public async Task<IActionResult> ReviewSubmission(string id, [FromBody] HymnReviewDto dto)
    {
        if (!Guid.TryParse(id, out var submissionId))
            return BadRequest(new { Message = "Invalid submission ID." });

        try
        {
            var result = await _hymnService.ReviewSubmissionAsync(submissionId, dto, GetUserId());
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Message = ex.Message });
        }
    }
}
